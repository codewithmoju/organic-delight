import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

initializeApp();

/**
 * Syncs organization membership to Firebase Auth custom claims.
 *
 * When an `organization_members/{orgId}_{uid}` document is created, updated,
 * or deleted, this function rebuilds the user's `orgs` custom claim:
 *
 *   { orgs: { "<orgId>": "<role>", ... } }
 *
 * The client can read this via `getIdTokenResult()` without any extra
 * Firestore reads, making role checks O(1) instead of O(n) per request.
 */
export const syncMemberClaims = onDocumentWritten(
  "organization_members/{memberId}",
  async (event) => {
    const memberId = event.params.memberId;

    // Extract uid from composite doc ID: "{orgId}_{uid}"
    const lastUnderscore = memberId.lastIndexOf("_");
    if (lastUnderscore === -1) return;
    const uid = memberId.substring(lastUnderscore + 1);
    if (!uid) return;

    const before = event.data?.before?.data();
    const after = event.data?.after?.data();

    // Collect all organization_members docs for this user
    const db = (await import("firebase-admin/firestore")).getFirestore();
    const memberSnap = await db
      .collection("organization_members")
      .where("user_id", "==", uid)
      .where("status", "==", "active")
      .get();

    const orgs = {};
    for (const doc of memberSnap.docs) {
      const data = doc.data();
      if (data.organization_id && data.role) {
        orgs[data.organization_id] = data.role;
      }
    }

    try {
      await getAuth().setCustomUserClaims(uid, { orgs });
      console.log(`Updated claims for ${uid}:`, orgs);
    } catch (err) {
      console.error(`Failed to set claims for ${uid}:`, err);
    }
  }
);
