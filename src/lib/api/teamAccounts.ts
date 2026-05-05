import { auth } from '../firebase';

const API_KEY = import.meta.env.VITE_FIREBASE_API_KEY;

interface CreateTeamAccountResult {
  userId: string;
  email: string;
  role: string;
}

export async function createTeamMember(
  orgId: string,
  email: string,
  displayName: string,
  password: string,
  role: string
): Promise<CreateTeamAccountResult> {
  // Step 1: Create Firebase Auth user via REST API
  // This does NOT affect the current admin session
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  );

  const data = await res.json();
  if (!res.ok) {
    if (data.error?.message === 'EMAIL_EXISTS') {
      throw new Error('An account with this email already exists');
    }
    throw new Error(data.error?.message || 'Failed to create account');
  }

  const uid = data.localId;

  // Step 2: Create profile + org_member using admin's Firestore access
  // Admin is still signed in, so Firestore writes use admin's auth
  const { doc, setDoc, Timestamp } = await import('firebase/firestore');
  const { db } = await import('../firebase');

  // Create profile
  await setDoc(doc(db, 'profiles', uid), {
    id: uid,
    email,
    full_name: displayName || email.split('@')[0],
    preferred_currency: 'PKR',
    role: 'user',
    created_by_admin: true,
    created_at: Timestamp.now(),
    updated_at: Timestamp.now(),
  });

  // Create org membership
  const memberId = `${orgId}_${uid}`;
  await setDoc(doc(db, 'organization_members', memberId), {
    organization_id: orgId,
    user_id: uid,
    role,
    status: 'active',
    joined_at: Timestamp.now(),
    invited_by: auth.currentUser?.uid,
    user_name: displayName || email.split('@')[0],
    user_email: email,
  });

  return { userId: uid, email, role };
}
