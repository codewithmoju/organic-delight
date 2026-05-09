import { collection, query, where, getDocs, addDoc, setDoc, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuthStore } from '../store';
import type { Organization, OrganizationMember } from '../types/org';
import { getOrganization } from '../api/organizations';

/** Write active org context to the user's profile so Firestore security rules
 *  can verify membership via get(profiles/$(uid)) — no custom claims needed.
 *  Throws on failure — callers MUST handle or the app stays on loading screen. */
async function syncOrgToProfile(uid: string, orgId: string, role: string): Promise<void> {
  const payload = {
    active_organization_id: orgId,
    active_organization_role: role,
  };
  try {
    await updateDoc(doc(db, 'profiles', uid), payload);
    console.log('[orgResolver] Synced org to profile:', orgId, role);
  } catch (err) {
    // Retry once — profile doc might not exist yet (race with getProfile creating it)
    console.warn('[orgResolver] First sync attempt failed, retrying…', err);
    await new Promise(r => setTimeout(r, 500));
    await updateDoc(doc(db, 'profiles', uid), payload);
    console.log('[orgResolver] Synced org to profile (retry):', orgId, role);
  }
}

const ORG_SCOPING_ENABLED = import.meta.env.VITE_ORG_SCOPING_ENABLED !== 'false';

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
  // Super admin doesn't need an org — skip resolution entirely
  if (useAuthStore.getState().isSuperAdmin) {
    useAuthStore.getState().setOrgResolved(true);
    return;
  }

  if (!ORG_SCOPING_ENABLED) {
    useAuthStore.getState().setOrgResolved(true);
    return;
  }

  const { setActiveOrganization, setMembership, setOrgResolved } = useAuthStore.getState();

  // Clear stale localStorage data to force fresh resolution
  setActiveOrganization(null);
  setMembership(null);
  setOrgResolved(false);

  // Safety timeout — if Firestore query hangs, unblock UI after 15s
  const timeout = setTimeout(() => {
    console.warn('[orgResolver] Timed out waiting for org resolution — unblocking UI');
    useAuthStore.getState().setOrgResolved(true);
  }, 15000);

  try {
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
        setOrgResolved(true);
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
      await syncOrgToProfile(uid, orgId, 'owner');
      setOrgResolved(true);
      return;
    }

    // Select org: prefer last-used from localStorage, else first membership
    const lastOrgId = localStorage.getItem('stocksuite_active_org');
    let selected = memberships.find(m => m.organization_id === lastOrgId);
    if (!selected) selected = memberships[0];

    const org = await getOrganization(selected.organization_id);
    // If user is the org creator but membership role is wrong, auto-promote to owner
    if (org.created_by === uid && selected.role !== 'owner') {
      console.warn('[orgResolver] Org creator has role', selected.role, '— auto-promoting to owner');
      selected = { ...selected, role: 'owner' };
      // Update Firestore in background
      import('firebase/firestore').then(({ doc, updateDoc }) => {
        updateDoc(doc(db, 'organization_members', selected.id), { role: 'owner' }).catch(() => {});
      });
    }
    console.log('[orgResolver] Resolved org:', org.name, 'role:', selected.role, 'orgId:', selected.organization_id);
    setActiveOrganization(org);
    setMembership(selected);
    localStorage.setItem('stocksuite_active_org', selected.organization_id);
    await syncOrgToProfile(uid, selected.organization_id, selected.role);
    setOrgResolved(true);
  } catch (err) {
    // Org resolution failed — unblock the UI so user isn't stuck on loader forever
    console.error('[orgResolver] Failed to resolve organization:', err);
    setOrgResolved(true);
  } finally {
    clearTimeout(timeout);
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
  await syncOrgToProfile(uid, orgId, membership.role);
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
