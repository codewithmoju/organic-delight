import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Organization, OrganizationMember, OrgRole, OrgSummary, AdminUserProfile, PlatformStats, Permission } from '../types/org';
import type { AuditEntry } from './auditLog';

const ORGS = 'organizations';
const MEMBERS = 'organization_members';
const PROFILES = 'profiles';
const AUDIT = 'audit_logs';
const ORG_SETTINGS = 'organization_settings';

// ── Helpers ──────────────────────────────────────────────────────────────────

function mapOrg(docSnap: any): Organization {
  const d = docSnap.data();
  return {
    id: docSnap.id,
    name: d.name,
    created_by: d.created_by,
    created_at: d.created_at?.toDate?.() || new Date(d.created_at || Date.now()),
    updated_at: d.updated_at?.toDate?.() || new Date(d.updated_at || Date.now()),
    settings: d.settings,
  };
}

function mapMember(docSnap: any): OrganizationMember {
  const d = docSnap.data();
  return {
    id: docSnap.id,
    organization_id: d.organization_id,
    user_id: d.user_id,
    role: d.role,
    permissions_overrides: d.permissions_overrides,
    status: d.status,
    joined_at: d.joined_at?.toDate?.() || new Date(d.joined_at || Date.now()),
    invited_by: d.invited_by,
    user_name: d.user_name,
    user_email: d.user_email,
    user_avatar: d.user_avatar,
  };
}

function mapProfile(docSnap: any) {
  const d = docSnap.data();
  return {
    id: docSnap.id,
    full_name: d.full_name || '',
    email: d.email || '',
    avatar_url: d.avatar_url,
    created_at: d.created_at?.toDate?.() || new Date(d.created_at || Date.now()),
    created_by_admin: d.created_by_admin,
  };
}

function mapAudit(docSnap: any): AuditEntry {
  const d = docSnap.data();
  return {
    id: docSnap.id,
    user_id: d.user_id,
    user_name: d.user_name,
    action: d.action,
    resource: d.resource,
    resource_id: d.resource_id,
    resource_name: d.resource_name,
    details: d.details,
    metadata: d.metadata,
    created_at: d.created_at?.toDate?.() || new Date(),
  };
}

// ── Organizations ────────────────────────────────────────────────────────────

export async function getAllOrganizations(): Promise<OrgSummary[]> {
  const orgsSnap = await getDocs(query(collection(db, ORGS), orderBy('created_at', 'desc')));
  const orgs = orgsSnap.docs.map(mapOrg);

  // Enrich with member count and owner info
  const enriched = await Promise.all(
    orgs.map(async (org) => {
      const membersSnap = await getDocs(
        query(collection(db, MEMBERS), where('organization_id', '==', org.id))
      );
      const members = membersSnap.docs.map(mapMember);
      const owner = members.find(m => m.role === 'owner');

      return {
        ...org,
        member_count: members.length,
        owner_name: owner?.user_name,
        owner_email: owner?.user_email,
      } as OrgSummary;
    })
  );

  // Final dedup by ID
  const uniqueMap = new Map<string, OrgSummary>();
  for (const o of enriched) {
    if (!uniqueMap.has(o.id)) uniqueMap.set(o.id, o);
  }
  return Array.from(uniqueMap.values());
}

export async function getOrganizationDetail(orgId: string): Promise<{
  org: Organization;
  members: OrganizationMember[];
  memberCount: number;
}> {
  const orgSnap = await getDoc(doc(db, ORGS, orgId));
  if (!orgSnap.exists()) throw new Error('Organization not found');

  const org = mapOrg(orgSnap);
  const membersSnap = await getDocs(
    query(collection(db, MEMBERS), where('organization_id', '==', orgId))
  );
  let members = membersSnap.docs.map(mapMember);

  // Enrich members with profile data if user_name/user_email missing
  const needsProfile = members.filter(m => !m.user_name || !m.user_email);
  if (needsProfile.length > 0) {
    const profileMap = new Map<string, { name: string; email: string; avatar?: string }>();
    await Promise.all(
      needsProfile.map(async (m) => {
        try {
          const profileSnap = await getDoc(doc(db, PROFILES, m.user_id));
          if (profileSnap.exists()) {
            const d = profileSnap.data();
            profileMap.set(m.user_id, {
              name: d.full_name || d.email || m.user_id,
              email: d.email || '',
              avatar: d.avatar_url,
            });
          }
        } catch { /* ignore */ }
      })
    );

    members = members.map(m => ({
      ...m,
      user_name: m.user_name || profileMap.get(m.user_id)?.name || m.user_id,
      user_email: m.user_email || profileMap.get(m.user_id)?.email || '',
      user_avatar: m.user_avatar || profileMap.get(m.user_id)?.avatar,
    }));
  }

  return { org, members, memberCount: members.length };
}

export async function createStoreForUser(name: string, userId: string): Promise<string> {
  const orgRef = await addDoc(collection(db, ORGS), {
    name,
    created_by: userId,
    created_at: Timestamp.now(),
    updated_at: Timestamp.now(),
  });

  // Add user as owner
  const memberId = `${orgRef.id}_${userId}`;
  await setDoc(doc(db, MEMBERS, memberId), {
    organization_id: orgRef.id,
    user_id: userId,
    role: 'owner',
    status: 'active',
    joined_at: Timestamp.now(),
  });

  return orgRef.id;
}

export async function deleteOrganizationAsSuperAdmin(orgId: string): Promise<void> {
  // Delete all members first
  const membersSnap = await getDocs(
    query(collection(db, MEMBERS), where('organization_id', '==', orgId))
  );
  const batch = writeBatch(db);
  membersSnap.docs.forEach(d => batch.delete(d.ref));
  batch.delete(doc(db, ORGS, orgId));
  await batch.commit();
}

export async function updateOrganizationName(orgId: string, name: string): Promise<void> {
  await updateDoc(doc(db, ORGS, orgId), {
    name,
    updated_at: Timestamp.now(),
  });
}

// ── Users ────────────────────────────────────────────────────────────────────

export async function getAllUsers(options?: {
  search?: string;
  limitCount?: number;
}): Promise<AdminUserProfile[]> {
  // Fetch profiles, memberships, and orgs in parallel (3 queries instead of N*M+1)
  const [profilesSnap, membersSnap, orgsSnap] = await Promise.all([
    getDocs(collection(db, PROFILES)),
    getDocs(collection(db, MEMBERS)),
    getDocs(collection(db, ORGS)),
  ]);

  // Deduplicate — Firestore offline cache can return duplicate docs
  const seen = new Set<string>();
  let profiles = profilesSnap.docs.filter(d => {
    if (seen.has(d.id)) return false;
    seen.add(d.id);
    return true;
  }).map(mapProfile);

  // Client-side search
  if (options?.search) {
    const q = options.search.toLowerCase();
    profiles = profiles.filter(
      p => p.full_name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q)
    );
  }

  if (options?.limitCount) {
    profiles = profiles.slice(0, options.limitCount);
  }

  // Build lookup maps
  const orgNameMap = new Map<string, string>();
  orgsSnap.forEach(d => orgNameMap.set(d.id, d.data().name || 'Unknown'));

  const membersByUser = new Map<string, ReturnType<typeof mapMember>>();
  membersSnap.forEach(d => {
    const m = mapMember(d);
    // Group by user_id
    const existing = membersByUser.get(m.user_id);
    if (!existing) membersByUser.set(m.user_id, m);
  });

  // Collect all memberships grouped by user_id
  const allMemberships = new Map<string, ReturnType<typeof mapMember>[]>();
  membersSnap.forEach(d => {
    const m = mapMember(d);
    if (!allMemberships.has(m.user_id)) allMemberships.set(m.user_id, []);
    allMemberships.get(m.user_id)!.push(m);
  });

  // Enrich profiles with memberships (in-memory join)
  const enriched: AdminUserProfile[] = profiles.map((profile) => {
    const memberships = allMemberships.get(profile.id) || [];
    const enrichedMemberships = memberships.map((m) => ({
      organization_id: m.organization_id,
      organization_name: orgNameMap.get(m.organization_id) || 'Unknown',
      role: m.role,
      status: m.status,
    }));

    return {
      ...profile,
      memberships: enrichedMemberships,
    } as AdminUserProfile;
  });

  // Final dedup by ID — guard against any duplication from enrichment
  const uniqueMap = new Map<string, AdminUserProfile>();
  for (const u of enriched) {
    if (!uniqueMap.has(u.id)) uniqueMap.set(u.id, u);
  }
  return Array.from(uniqueMap.values());
}

export async function getUserDetail(userId: string): Promise<AdminUserProfile> {
  const profileSnap = await getDoc(doc(db, PROFILES, userId));
  if (!profileSnap.exists()) throw new Error('User not found');

  const profile = mapProfile(profileSnap);
  const membersSnap = await getDocs(
    query(collection(db, MEMBERS), where('user_id', '==', userId))
  );
  const memberships = membersSnap.docs.map(mapMember);

  const enrichedMemberships = await Promise.all(
    memberships.map(async (m) => {
      try {
        const orgSnap = await getDoc(doc(db, ORGS, m.organization_id));
        return {
          organization_id: m.organization_id,
          organization_name: orgSnap.exists() ? orgSnap.data().name : 'Unknown',
          role: m.role,
          status: m.status,
        };
      } catch {
        return {
          organization_id: m.organization_id,
          organization_name: 'Unknown',
          role: m.role,
          status: m.status,
        };
      }
    })
  );

  return {
    ...profile,
    memberships: enrichedMemberships,
  } as AdminUserProfile;
}

// ── Platform Stats ───────────────────────────────────────────────────────────

export async function getPlatformStats(): Promise<PlatformStats> {
  const [orgsSnap, profilesSnap, membersSnap] = await Promise.all([
    getDocs(collection(db, ORGS)),
    getDocs(collection(db, PROFILES)),
    getDocs(collection(db, MEMBERS)),
  ]);

  const orgs = orgsSnap.docs.map(mapOrg);
  const members = membersSnap.docs.map(mapMember);
  const activeMembers = members.filter(m => m.status === 'active');

  // Recent orgs (last 5)
  const recentOrgs = orgs
    .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
    .slice(0, 5);

  // Enrich recent orgs with member count
  const enrichedRecent = await Promise.all(
    recentOrgs.map(async (org) => {
      const count = members.filter(m => m.organization_id === org.id).length;
      const owner = members.find(m => m.organization_id === org.id && m.role === 'owner');
      return {
        ...org,
        member_count: count,
        owner_name: owner?.user_name,
        owner_email: owner?.user_email,
      } as OrgSummary;
    })
  );

  return {
    totalOrganizations: orgs.length,
    totalUsers: profilesSnap.size,
    totalTeamMembers: members.length,
    totalActiveMembers: activeMembers.length,
    recentOrganizations: enrichedRecent,
  };
}

// ── Org Data Access ──────────────────────────────────────────────────────────

export async function getOrgData(
  orgId: string,
  collectionName: string,
  options?: { limitCount?: number; orderByField?: string }
): Promise<any[]> {
  // Avoid composite index: filter only, sort client-side
  let q = query(
    collection(db, collectionName),
    where('organization_id', '==', orgId)
  );

  if (options?.limitCount) {
    q = query(q, firestoreLimit(options.limitCount));
  }

  const snap = await getDocs(q);
  const seen = new Set<string>();
  let results = snap.docs.filter(d => {
    if (seen.has(d.id)) return false;
    seen.add(d.id);
    return true;
  }).map(d => ({
    id: d.id,
    ...d.data(),
    // Convert any Timestamps
    created_at: d.data().created_at?.toDate?.() || d.data().created_at,
    updated_at: d.data().updated_at?.toDate?.() || d.data().updated_at,
    date: d.data().date?.toDate?.() || d.data().date,
  }));

  // Client-side sort if requested
  if (options?.orderByField) {
    const field = options.orderByField;
    results.sort((a, b) => {
      const aVal = a[field] instanceof Date ? a[field].getTime() : new Date(a[field] || 0).getTime();
      const bVal = b[field] instanceof Date ? b[field].getTime() : new Date(b[field] || 0).getTime();
      return bVal - aVal;
    });
  }

  return results;
}

// ── Member Management ────────────────────────────────────────────────────────

export async function setUserRole(orgId: string, userId: string, role: OrgRole): Promise<void> {
  const memberId = `${orgId}_${userId}`;
  await updateDoc(doc(db, MEMBERS, memberId), { role });
}

export async function removeUserFromOrg(orgId: string, userId: string): Promise<void> {
  const memberId = `${orgId}_${userId}`;
  await deleteDoc(doc(db, MEMBERS, memberId));
}

// ── Global Audit ─────────────────────────────────────────────────────────────

export async function getAuditLogsGlobal(options?: {
  orgId?: string;
  userId?: string;
  limitCount?: number;
}): Promise<AuditEntry[]> {
  let q;

  if (options?.orgId) {
    // Avoid composite index: filter only, sort client-side
    q = query(
      collection(db, AUDIT),
      where('organization_id', '==', options.orgId)
    );
  } else {
    q = query(collection(db, AUDIT), orderBy('created_at', 'desc'));
  }

  if (options?.limitCount) {
    q = query(q, firestoreLimit(options.limitCount));
  }

  const snap = await getDocs(q);
  let results = snap.docs.map(mapAudit);

  // Client-side sort when filtering by org (avoids composite index)
  if (options?.orgId) {
    results.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
  }

  // Client-side filter by userId if specified
  if (options?.userId) {
    results = results.filter(e => e.user_id === options.userId);
  }

  // Enrich with user names if missing
  const userIdsNeedingNames = [...new Set(
    results.filter(e => !e.user_name).map(e => e.user_id)
  )];

  if (userIdsNeedingNames.length > 0) {
    const profileMap = new Map<string, string>();
    await Promise.all(
      userIdsNeedingNames.map(async (uid) => {
        try {
          const profileSnap = await getDoc(doc(db, PROFILES, uid));
          if (profileSnap.exists()) {
            const name = profileSnap.data().full_name || profileSnap.data().email || uid;
            profileMap.set(uid, name);
          }
        } catch {
          // Ignore - will use uid as fallback
        }
      })
    );

    results = results.map(e => ({
      ...e,
      user_name: e.user_name || profileMap.get(e.user_id) || e.user_id,
    }));
  }

  return results;
}

// ── Role Permission Overrides ────────────────────────────────────────────────

/** Type for per-role permission overrides stored in org settings */
export type RoleOverrides = Partial<Record<OrgRole, Partial<Record<Permission, boolean>>>>;

/** Get custom role permission overrides for an organization */
export async function getOrgRoleOverrides(orgId: string): Promise<RoleOverrides> {
  try {
    const snap = await getDoc(doc(db, ORG_SETTINGS, orgId));
    if (!snap.exists()) return {};
    const data = snap.data();
    return (data.role_overrides as RoleOverrides) ?? {};
  } catch {
    return {};
  }
}

/** Save custom role permission overrides for an organization */
export async function saveOrgRoleOverrides(orgId: string, overrides: RoleOverrides): Promise<void> {
  await setDoc(
    doc(db, ORG_SETTINGS, orgId),
    { role_overrides: overrides, updated_at: Timestamp.now() },
    { merge: true }
  );
}

/** Get effective permissions for a role in an org (base + overrides) */
export async function getEffectiveRolePermissions(
  orgId: string,
  role: OrgRole
): Promise<{ base: Set<Permission>; overrides: Partial<Record<Permission, boolean>>; effective: Set<Permission> }> {
  const { ROLE_PERMISSIONS } = await import('../constants/permissions');
  const base = ROLE_PERMISSIONS[role] ?? new Set<Permission>();
  const allOverrides = await getOrgRoleOverrides(orgId);
  const roleOverrides = allOverrides[role] ?? {};

  // Apply overrides to base
  const effective = new Set(base);
  for (const [perm, allowed] of Object.entries(roleOverrides)) {
    if (allowed) {
      effective.add(perm as Permission);
    } else {
      effective.delete(perm as Permission);
    }
  }

  return { base, overrides: roleOverrides, effective };
}
