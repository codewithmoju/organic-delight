import { collection, query, where, getDocs, addDoc, setDoc, doc, Timestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuthStore } from '../store';
import type { Organization, OrganizationMember } from '../types/org';
import { getOrganization } from '../api/organizations';

const ORG_SCOPING_ENABLED = import.meta.env.VITE_ORG_SCOPING_ENABLED === 'true';

/** Force token refresh to pick up latest custom claims (org roles).
 *  Fire-and-forget — non-blocking, claims refresh in background. */
function refreshClaims(): void {
  auth.currentUser?.getIdToken(true).catch(() => {});
}

/**
 * Resolves the active organization for the current user.
 * Called during app bootstrap after profile is loaded.
 *
 * Flow:
 * 1. Query organization_members where user_id == uid && status == 'active'
 * 2. If exactly one membership, auto-select it
 * 3. If multiple, check localStorage for last-used org; if none, use first
 * 4. If zero, create a personal org (legacy migration)
 * 5. Store activeOrganization + membership in auth store
 */
export async function resolveActiveOrganization(uid: string): Promise<void> {
  if (!ORG_SCOPING_ENABLED) return;

  const { setActiveOrganization, setMembership } = useAuthStore.getState();

  // Find memberships for this user
  const membersQuery = query(
    collection(db, 'organization_members'),
    where('user_id', '==', uid),
    where('status', '==', 'active')
  );
  const memberSnap = await getDocs(membersQuery);
  const memberships = memberSnap.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    joined_at: doc.data().joined_at?.toDate ? doc.data().joined_at.toDate() : new Date(),
  })) as OrganizationMember[];

  if (memberships.length === 0) {
    // Admin-created users should already have membership — don't create personal org
    const profile = useAuthStore.getState().profile;
    if (profile?.created_by_admin) {
      console.error('Admin-created user has no organization membership');
      return;
    }
    // No org memberships — create a personal org for legacy user
    const orgId = await createPersonalOrg(uid);
    const org = await getOrganization(orgId);
    const membership: OrganizationMember = {
      id: `${orgId}_${uid}`,
      organization_id: orgId,
      user_id: uid,
      role: 'owner',
      status: 'active',
      joined_at: new Date(),
    };
    setActiveOrganization(org);
    setMembership(membership);
    refreshClaims();
    return;
  }

  // Select org: prefer last-used from localStorage, else first membership
  const lastOrgId = localStorage.getItem('stocksuite_active_org');
  let selected = memberships.find(m => m.organization_id === lastOrgId);
  if (!selected) selected = memberships[0];

  try {
    const org = await getOrganization(selected.organization_id);
    setActiveOrganization(org);
    setMembership(selected);
    localStorage.setItem('stocksuite_active_org', selected.organization_id);
    refreshClaims();
  } catch {
    // Org may have been deleted — try next membership
    const fallback = memberships.find(m => m.id !== selected!.id);
    if (fallback) {
      const org = await getOrganization(fallback.organization_id);
      setActiveOrganization(org);
      setMembership(fallback);
      localStorage.setItem('stocksuite_active_org', fallback.organization_id);
      refreshClaims();
    }
  }
}

/**
 * Switch the active organization (for users in multiple orgs).
 */
export async function switchOrganization(orgId: string): Promise<void> {
  const uid = useAuthStore.getState().user?.uid;
  if (!uid) throw new Error('Not authenticated');

  const { setActiveOrganization, setMembership } = useAuthStore.getState();

  const org = await getOrganization(orgId);

  // Fetch membership for this org
  const membersQuery = query(
    collection(db, 'organization_members'),
    where('organization_id', '==', orgId),
    where('user_id', '==', uid),
    where('status', '==', 'active')
  );
  const memberSnap = await getDocs(membersQuery);
  if (memberSnap.empty) throw new Error('Not a member of this organization');

  const memberData = memberSnap.docs[0];
  const membership: OrganizationMember = {
    id: memberData.id,
    ...memberData.data(),
    joined_at: memberData.data().joined_at?.toDate ? memberData.data().joined_at.toDate() : new Date(),
  } as OrganizationMember;

  setActiveOrganization(org);
  setMembership(membership);
  localStorage.setItem('stocksuite_active_org', orgId);
  refreshClaims();
}

/**
 * Create a personal organization for a legacy user.
 * Called when a user has no org memberships.
 */
async function createPersonalOrg(uid: string): Promise<string> {
  // Get user profile for org name
  const profile = useAuthStore.getState().profile;
  const orgName = profile?.business_name || profile?.full_name || 'My Shop';

  const orgRef = await addDoc(collection(db, 'organizations'), {
    name: orgName,
    created_by: uid,
    created_at: Timestamp.now(),
    updated_at: Timestamp.now(),
  });

  // Add user as owner
  const memberId = `${orgRef.id}_${uid}`;
  await setDoc(doc(db, 'organization_members', memberId), {
    organization_id: orgRef.id,
    user_id: uid,
    role: 'owner',
    status: 'active',
    joined_at: Timestamp.now(),
  });

  localStorage.setItem('stocksuite_active_org', orgRef.id);
  return orgRef.id;
}
