import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  User,
  sendEmailVerification
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

export async function signUp(email: string, password: string, fullName: string) {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(user, { displayName: fullName });

  // Send email verification
  await sendEmailVerification(user);

  await setDoc(doc(db, 'profiles', user.uid), {
    id: user.uid,
    email,
    full_name: fullName,
    preferred_currency: 'PKR',
    role: 'user',
    created_at: new Date(),
    updated_at: new Date()
  });

  return user;
}

export async function signIn(email: string, password: string) {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  const profile = await getProfile(user);
  return { user, profile };
}

export async function getProfile(user: User) {
  const profileDoc = await getDoc(doc(db, 'profiles', user.uid));
  if (profileDoc.exists()) {
    const data = profileDoc.data();
    // Convert Firestore Timestamps to JavaScript Date objects for consistency
    return {
      ...data,
      created_at: data.created_at?.toDate ? data.created_at.toDate() : data.created_at,
      updated_at: data.updated_at?.toDate ? data.updated_at.toDate() : data.updated_at
    };
  }

  // Create profile if it doesn't exist
  const newProfile = {
    id: user.uid,
    email: user.email,
    full_name: user.displayName || 'User',
    preferred_currency: 'PKR',
    role: 'user',
    created_at: new Date(),
    updated_at: new Date()
  };

  await setDoc(doc(db, 'profiles', user.uid), newProfile);
  return newProfile;
}

export async function updateUserProfile(userId: string, data: Partial<{
  full_name: string;
  preferred_currency: string;
  company: string;
  phone: string;
  address: string;
  avatar_url: string;
  language: string;
  theme: 'light' | 'dark' | 'system';
  notifications_enabled: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  two_factor_enabled: boolean;
  timezone: string;
  business_name: string;
  business_type: string;
  business_tagline: string;
  business_logo: string;
  business_address: string;
  business_city: string;
  business_country: string;
  business_phone: string;
  business_email: string;
  tax_number: string;
  receipt_header: string;
  receipt_footer: string;
}>) {
  const userRef = doc(db, 'profiles', userId);
  await updateDoc(userRef, {
    ...data,
    updated_at: new Date()
  });
}