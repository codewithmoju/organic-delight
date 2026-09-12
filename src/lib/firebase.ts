import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'firebase/firestore';

function getEnv(name: keyof ImportMetaEnv, fallback: string = ''): string {
  const value = import.meta.env[name];
  if (!value || value.trim() === '') {
    return fallback;
  }
  return value;
}

export const firebaseConfig = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY', 'AIzaSyA8XWZ5Gd8lH9hLJq_8dOEn5Jt1yVe_1sU'),
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN', 'stocksuit.firebaseapp.com'),
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID', 'stocksuit'),
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET', 'stocksuit.firebasestorage.app'),
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', '627855569208'),
  appId: getEnv('VITE_FIREBASE_APP_ID', '1:627855569208:web:150b56b12fc101fa4a91cd'),
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-Y0HB0QTNSJ'
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});