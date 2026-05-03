#!/usr/bin/env node
/**
 * Backfill `organization_id` on all existing business documents.
 *
 * For each user in `profiles`:
 *   1. Create `organizations/{orgId}` + `organization_members/{orgId}_{uid}` (role: owner)
 *   2. Set `organization_id = orgId` on every business doc where `created_by == uid`
 *      (or `cashier_id == uid` for pos_transactions)
 *
 * Idempotent: skips docs that already have `organization_id`.
 * Resumable: tracks last processed doc ID per collection in `.backfill-state.json`.
 *
 * Usage:
 *   node scripts/backfill-org-id.mjs              # run backfill
 *   node scripts/backfill-org-id.mjs --verify     # verify coverage only
 *   node scripts/backfill-org-id.mjs --dry-run    # show what would be done
 *
 * Prerequisites:
 *   - firebase-admin installed: npm i -D firebase-admin
 *   - GOOGLE_APPLICATION_CREDENTIALS env var pointing to service account JSON
 *     OR `gcloud auth application-default login` run locally
 */

import admin from 'firebase-admin';
import fs from 'node:fs';
import path from 'node:path';

// ── Config ────────────────────────────────────────────────────────────────────

const BATCH_SIZE = 500;
const STATE_FILE = path.join(process.cwd(), '.backfill-state.json');

const BUSINESS_COLLECTIONS = [
  { name: 'items', ownerField: 'created_by' },
  { name: 'categories', ownerField: 'created_by' },
  { name: 'transactions', ownerField: 'created_by' },
  { name: 'customers', ownerField: 'created_by' },
  { name: 'vendors', ownerField: 'created_by' },
  { name: 'expenses', ownerField: 'created_by' },
  { name: 'purchases', ownerField: 'created_by' },
  { name: 'pos_transactions', ownerField: 'cashier_id' },
  { name: 'pos_returns', ownerField: 'created_by' },
  { name: 'stock_adjustments', ownerField: 'created_by' },
  { name: 'sales', ownerField: 'created_by' },
  { name: 'customer_payments', ownerField: 'created_by' },
  { name: 'vendor_payments', ownerField: 'created_by' },
  { name: 'audit_logs', ownerField: 'user_id' },
];

// ── Args ──────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const VERIFY_ONLY = args.includes('--verify');
const DRY_RUN = args.includes('--dry-run');

// ── Init Admin SDK ────────────────────────────────────────────────────────────

function getProjectId() {
  // Try .env.local first
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    const match = content.match(/^VITE_FIREBASE_PROJECT_ID=(.+)$/m);
    if (match) return match[1].trim();
  }
  // Try process.env
  if (process.env.VITE_FIREBASE_PROJECT_ID) return process.env.VITE_FIREBASE_PROJECT_ID;
  if (process.env.GCLOUD_PROJECT) return process.env.GCLOUD_PROJECT;
  if (process.env.GOOGLE_CLOUD_PROJECT) return process.env.GOOGLE_CLOUD_PROJECT;
  throw new Error(
    'Cannot determine project ID. Set VITE_FIREBASE_PROJECT_ID in .env.local or GOOGLE_CLOUD_PROJECT env var.'
  );
}

function initFirebase() {
  if (admin.apps.length > 0) return admin.firestore();

  const projectId = getProjectId();
  admin.initializeApp({ projectId });
  return admin.firestore();
}

// ── State (for resumability) ──────────────────────────────────────────────────

function loadState() {
  if (fs.existsSync(STATE_FILE)) {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  }
  return { lastDocId: {}, completedCollections: [] };
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateId() {
  return admin.firestore().collection('_').doc().id;
}

async function processBatch(db, collectionName, ownerField, userOrgMap, state, options = {}) {
  const colRef = db.collection(collectionName);
  const resumeAfterId = state.lastDocId?.[collectionName] || null;

  if (state.completedCollections?.includes(collectionName)) {
    console.log(`  ✓ ${collectionName}: already completed, skipping`);
    return { updated: 0, skipped: 0, missing: 0 };
  }

  let query = colRef.orderBy(admin.firestore.FieldPath.documentId());
  if (resumeAfterId) {
    const resumeDoc = await colRef.doc(resumeAfterId).get();
    if (resumeDoc.exists) {
      query = query.startAfter(resumeAfterId);
    }
  }
  query = query.limit(BATCH_SIZE);

  let updated = 0;
  let skipped = 0;
  let missing = 0;
  let lastId = resumeAfterId;
  let hasMore = true;

  while (hasMore) {
    const snap = await query.get();
    if (snap.empty) break;

    const batch = db.batch();

    for (const doc of snap.docs) {
      const data = doc.data();
      lastId = doc.id;

      // Already has organization_id — skip
      if (data.organization_id) {
        skipped++;
        continue;
      }

      const ownerId = data[ownerField];
      if (!ownerId || !userOrgMap[ownerId]) {
        missing++;
        continue;
      }

      if (!options.verifyOnly && !options.dryRun) {
        batch.update(doc.ref, { organization_id: userOrgMap[ownerId] });
        updated++;
      } else {
        updated++;
      }
    }

    if (!options.verifyOnly && !options.dryRun && updated > 0) {
      await batch.commit();
    }

    // Save progress
    state.lastDocId[collectionName] = lastId;
    if (!options.verifyOnly) saveState(state);

    // Get next batch
    if (snap.size < BATCH_SIZE) {
      hasMore = false;
    } else {
      const nextQuery = colRef
        .orderBy(admin.firestore.FieldPath.documentId())
        .startAfter(lastId)
        .limit(BATCH_SIZE);
      query = nextQuery;
    }
  }

  // Mark collection as completed
  if (!options.verifyOnly && !hasMore) {
    state.completedCollections = state.completedCollections || [];
    if (!state.completedCollections.includes(collectionName)) {
      state.completedCollections.push(collectionName);
      saveState(state);
    }
  }

  return { updated, skipped, missing };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const db = initFirebase();
  const state = loadState();

  console.log('=== StockSuit Organization ID Backfill ===');
  console.log(`Mode: ${VERIFY_ONLY ? 'VERIFY' : DRY_RUN ? 'DRY-RUN' : 'LIVE'}`);
  console.log('');

  // Step 1: Build user → org mapping
  console.log('Step 1: Building user → organization mapping...');

  const userOrgMap = {}; // uid → orgId
  const profilesSnap = await db.collection('profiles').get();
  console.log(`  Found ${profilesSnap.size} profiles`);

  // Check existing orgs
  const existingMembersSnap = await db.collection('organization_members').get();
  const existingMemberMap = {}; // uid → orgId
  for (const doc of existingMembersSnap.docs) {
    const data = doc.data();
    if (data.user_id && data.organization_id) {
      existingMemberMap[data.user_id] = data.organization_id;
    }
  }

  for (const profile of profilesSnap.docs) {
    const uid = profile.id;
    const data = profile.data();

    // Already has org membership
    if (existingMemberMap[uid]) {
      userOrgMap[uid] = existingMemberMap[uid];
      continue;
    }

    if (VERIFY_ONLY || DRY_RUN) {
      // Would create org
      userOrgMap[uid] = `(would-create-org-for-${uid})`;
      continue;
    }

    // Create organization
    const orgId = generateId();
    const orgRef = db.collection('organizations').doc(orgId);
    await orgRef.set({
      name: data.full_name ? `${data.full_name}'s Organization` : 'Personal Organization',
      created_by: uid,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      settings: {},
    });

    // Create membership
    const memberDocId = `${orgId}_${uid}`;
    await db.collection('organization_members').doc(memberDocId).set({
      organization_id: orgId,
      user_id: uid,
      role: 'owner',
      permissions_overrides: {},
      status: 'active',
      joined_at: admin.firestore.FieldValue.serverTimestamp(),
      invited_by: null,
    });

    userOrgMap[uid] = orgId;
    console.log(`  Created org ${orgId} for user ${uid} (${data.email || data.full_name || 'unknown'})`);
  }

  console.log(`  Mapped ${Object.keys(userOrgMap).length} users to organizations`);
  console.log('');

  if (VERIFY_ONLY) {
    // Step 2: Verify coverage
    console.log('Step 2: Verifying coverage...');
    for (const { name, ownerField } of BUSINESS_COLLECTIONS) {
      const colRef = db.collection(name);
      const allSnap = await colRef.count().get();
      const total = allSnap.data().count;

      const withOrgSnap = await colRef.where('organization_id', '!=', null).count().get();
      const withOrg = withOrgSnap.data().count;

      const pct = total > 0 ? ((withOrg / total) * 100).toFixed(1) : '100';
      const status = total === withOrg ? '✓' : '⚠';
      console.log(`  ${status} ${name}: ${withOrg}/${total} (${pct}%)`);
    }
    return;
  }

  // Step 2: Backfill each collection
  console.log('Step 2: Backfilling business collections...');

  let totalUpdated = 0;
  let totalSkipped = 0;
  let totalMissing = 0;

  for (const { name, ownerField } of BUSINESS_COLLECTIONS) {
    process.stdout.write(`  Processing ${name}...`);
    const result = await processBatch(db, name, ownerField, userOrgMap, state, { dryRun: DRY_RUN });
    console.log(` updated=${result.updated} skipped=${result.skipped} missing=${result.missing}`);
    totalUpdated += result.updated;
    totalSkipped += result.skipped;
    totalMissing += result.missing;
  }

  console.log('');
  console.log('=== Summary ===');
  console.log(`Updated:  ${totalUpdated}`);
  console.log(`Skipped:  ${totalSkipped} (already had organization_id)`);
  console.log(`Missing:  ${totalMissing} (no matching user org)`);
  console.log('');

  if (totalMissing > 0) {
    console.log('⚠ Some documents had no matching user org.');
    console.log('  This can happen if a document was created by a user that no longer exists in profiles.');
    console.log('  These docs will need manual attention or can be left as-is.');
  }

  if (!DRY_RUN && totalUpdated > 0) {
    console.log('');
    console.log('✓ Backfill complete. Run with --verify to check coverage.');
    console.log('  You can delete .backfill-state.json once verified.');
  }
}

main().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
