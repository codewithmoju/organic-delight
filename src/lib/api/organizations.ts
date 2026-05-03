import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Organization, OrganizationMember, OrgRole } from '../types/org';
import { requireCurrentUserId } from './userScope';

const COLLECTION = 'organizations';
const MEMBERS_COLLECTION = 'organization_members';

// ── Organization CRUD ────────────────────────────────────────────────────────

function mapOrgSnapshot(docSnap: any): Organization {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    name: data.name,
    created_by: data.created_by,
    created_at: data.created_at?.toDate ? data.created_at.toDate() : new Date(data.created_at || Date.now()),
    updated_at: data.updated_at?.toDate ? data.updated_at.toDate() : new Date(data.updated_at || Date.now()),
    settings: data.settings,
  };
}

function mapMemberSnapshot(docSnap: any): OrganizationMember {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    organization_id: data.organization_id,
    user_id: data.user_id,
    role: data.role,
    permissions_overrides: data.permissions_overrides,
    status: data.status,
    joined_at: data.joined_at?.toDate ? data.joined_at.toDate() : new Date(data.joined_at || Date.now()),
    invited_by: data.invited_by,
    user_name: data.user_name,
    user_email: data.user_email,
    user_avatar: data.user_avatar,
  };
}

export async function createOrganization(name: string): Promise<string> {
  const userId = requireCurrentUserId();
  const orgRef = await addDoc(collection(db, COLLECTION), {
    name,
    created_by: userId,
    created_at: Timestamp.now(),
    updated_at: Timestamp.now(),
  });

  // Auto-add creator as owner
  const memberId = `${orgRef.id}_${userId}`;
  await addDoc(collection(db, MEMBERS_COLLECTION), {
    organization_id: orgRef.id,
    user_id: userId,
    role: 'owner' as OrgRole,
    status: 'active',
    joined_at: Timestamp.now(),
  });

  return orgRef.id;
}

export async function getOrganization(orgId: string): Promise<Organization> {
  const docSnap = await getDoc(doc(db, COLLECTION, orgId));
  if (!docSnap.exists()) throw new Error('Organization not found');
  return mapOrgSnapshot(docSnap);
}

export async function getUserOrganizations(userId?: string): Promise<Organization[]> {
  const uid = userId || requireCurrentUserId();
  const membersQuery = query(
    collection(db, MEMBERS_COLLECTION),
    where('user_id', '==', uid),
    where('status', '==', 'active')
  );
  const memberSnaps = await getDocs(membersQuery);
  const orgIds = memberSnaps.docs.map(d => d.data().organization_id);

  if (orgIds.length === 0) return [];

  const orgs: Organization[] = [];
  for (const orgId of orgIds) {
    try {
      const org = await getOrganization(orgId);
      orgs.push(org);
    } catch {
      // org may have been deleted
    }
  }
  return orgs;
}

export async function updateOrganization(orgId: string, data: Partial<Pick<Organization, 'name' | 'settings'>>): Promise<void> {
  await updateDoc(doc(db, COLLECTION, orgId), {
    ...data,
    updated_at: Timestamp.now(),
  });
}

export async function deleteOrganization(orgId: string): Promise<void> {
  // Delete all members first
  const membersQuery = query(
    collection(db, MEMBERS_COLLECTION),
    where('organization_id', '==', orgId)
  );
  const memberSnaps = await getDocs(membersQuery);
  const batch = writeBatch(db);
  memberSnaps.docs.forEach(d => batch.delete(d.ref));
  batch.delete(doc(db, COLLECTION, orgId));
  await batch.commit();
}

// ── Member CRUD ──────────────────────────────────────────────────────────────

export async function getMembers(orgId: string): Promise<OrganizationMember[]> {
  const membersQuery = query(
    collection(db, MEMBERS_COLLECTION),
    where('organization_id', '==', orgId)
  );
  const snapshot = await getDocs(membersQuery);
  const members = snapshot.docs.map(mapMemberSnapshot);

  // Enrich with profile data for members missing name/email
  const missingProfile = members.filter(m => !m.user_name && m.user_id);
  if (missingProfile.length > 0) {
    const profileFetches = missingProfile.map(async (m) => {
      try {
        const profileSnap = await getDoc(doc(db, 'profiles', m.user_id));
        if (profileSnap.exists()) {
          const data = profileSnap.data();
          m.user_name = data.full_name || data.email || m.user_id;
          m.user_email = data.email || '';
          m.user_avatar = data.avatar_url || '';
        }
      } catch { /* profile fetch is best-effort */ }
    });
    await Promise.allSettled(profileFetches);
  }

  return members;
}

export async function getMember(orgId: string, userId: string): Promise<OrganizationMember | null> {
  const memberId = `${orgId}_${userId}`;
  const docSnap = await getDoc(doc(db, MEMBERS_COLLECTION, memberId));
  if (!docSnap.exists()) return null;
  return mapMemberSnapshot(docSnap);
}

export async function addMember(orgId: string, userId: string, role: OrgRole, invitedBy?: string): Promise<string> {
  const memberId = `${orgId}_${userId}`;
  await addDoc(collection(db, MEMBERS_COLLECTION), {
    organization_id: orgId,
    user_id: userId,
    role,
    status: 'active',
    joined_at: Timestamp.now(),
    invited_by: invitedBy,
  });
  return memberId;
}

export async function updateMemberRole(orgId: string, userId: string, role: OrgRole): Promise<void> {
  const memberId = `${orgId}_${userId}`;
  await updateDoc(doc(db, MEMBERS_COLLECTION, memberId), { role });
}

export async function updateMemberOverrides(
  orgId: string,
  userId: string,
  overrides: Record<string, boolean>
): Promise<void> {
  const memberId = `${orgId}_${userId}`;
  await updateDoc(doc(db, MEMBERS_COLLECTION, memberId), {
    permissions_overrides: overrides,
  });
}

export async function removeMember(orgId: string, userId: string): Promise<void> {
  const memberId = `${orgId}_${userId}`;
  await deleteDoc(doc(db, MEMBERS_COLLECTION, memberId));
}

export async function deactivateMember(orgId: string, userId: string): Promise<void> {
  const memberId = `${orgId}_${userId}`;
  await updateDoc(doc(db, MEMBERS_COLLECTION, memberId), { status: 'inactive' });
}
