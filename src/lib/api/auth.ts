import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  User
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

export async function signUp(email: string, password: string, fullName: string) {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(user, { displayName: fullName });
  
  await setDoc(doc(db, 'profiles', user.uid), {
    id: user.uid,
    email,
    fullName,
    preferredCurrency: 'USD',
    createdAt: new Date(),
    updatedAt: new Date()
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
  return profileDoc.data();
}

export async function updateUserProfile(userId: string, data: Partial<{
  fullName: string;
  preferredCurrency: string;
}>) {
  const userRef = doc(db, 'profiles', userId);
  await updateDoc(userRef, {
    ...data,
    updatedAt: new Date()
  });
}