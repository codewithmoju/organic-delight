import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Invite, OrgRole } from '../types/org';
import { requireCurrentUserId } from './userScope';
import { addMember } from './organizations';

const COLLECTION = 'invites';
const INVITE_EXPIRY_DAYS = 7;

function mapInviteSnapshot(docSnap: any): Invite {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    organization_id: data.organization_id,
    email: data.email,
    role: data.role,
    status: data.status,
    created_by: data.created_by,
    created_at: data.created_at?.toDate ? data.created_at.toDate() : new Date(data.created_at || Date.now()),
    expires_at: data.expires_at?.toDate ? data.expires_at.toDate() : new Date(data.expires_at || Date.now()),
    accepted_at: data.accepted_at?.toDate ? data.accepted_at.toDate() : data.accepted_at ? new Date(data.accepted_at) : undefined,
    organization_name: data.organization_name,
    inviter_name: data.inviter_name,
  };
}

export async function createInvite(
  orgId: string,
  email: string,
  role: OrgRole,
  orgName?: string,
  inviterName?: string
): Promise<string> {
  const userId = requireCurrentUserId();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);

  const docRef = await addDoc(collection(db, COLLECTION), {
    organization_id: orgId,
    email: email.toLowerCase(),
    role,
    status: 'pending',
    created_by: userId,
    created_at: Timestamp.now(),
    expires_at: Timestamp.fromDate(expiresAt),
    organization_name: orgName,
    inviter_name: inviterName,
  });

  return docRef.id;
}

export async function getInvite(inviteId: string): Promise<Invite> {
  const docSnap = await getDoc(doc(db, COLLECTION, inviteId));
  if (!docSnap.exists()) throw new Error('Invite not found');
  return mapInviteSnapshot(docSnap);
}

export async function getPendingInvites(orgId: string): Promise<Invite[]> {
  const q = query(
    collection(db, COLLECTION),
    where('organization_id', '==', orgId),
    where('status', '==', 'pending')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(mapInviteSnapshot);
}

export async function getInvitesForEmail(email: string): Promise<Invite[]> {
  const q = query(
    collection(db, COLLECTION),
    where('email', '==', email.toLowerCase()),
    where('status', '==', 'pending')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map(mapInviteSnapshot)
    .filter(invite => invite.expires_at > new Date());
}

export async function acceptInvite(inviteId: string): Promise<string> {
  const userId = requireCurrentUserId();
  const invite = await getInvite(inviteId);

  if (invite.status !== 'pending') throw new Error('Invite is no longer pending');
  if (invite.expires_at < new Date()) {
    await updateDoc(doc(db, COLLECTION, inviteId), { status: 'expired' });
    throw new Error('Invite has expired');
  }

  // Add user as member
  await addMember(invite.organization_id, userId, invite.role, invite.created_by);

  // Mark invite as accepted
  await updateDoc(doc(db, COLLECTION, inviteId), {
    status: 'accepted',
    accepted_at: Timestamp.now(),
  });

  return invite.organization_id;
}

export async function rejectInvite(inviteId: string): Promise<void> {
  await updateDoc(doc(db, COLLECTION, inviteId), { status: 'rejected' });
}

export async function cancelInvite(inviteId: string): Promise<void> {
  // Only the inviter or org owner can cancel
  await updateDoc(doc(db, COLLECTION, inviteId), { status: 'rejected' });
}
