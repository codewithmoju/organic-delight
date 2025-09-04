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
    preferred_currency: 'USD',
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
    return profileDoc.data();
  }
  
  // Create profile if it doesn't exist
  const newProfile = {
    id: user.uid,
    email: user.email,
    full_name: user.displayName || 'User',
    preferred_currency: 'USD',
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
}>) {
  const userRef = doc(db, 'profiles', userId);
  await updateDoc(userRef, {
    ...data,
    updated_at: new Date()
  });
}