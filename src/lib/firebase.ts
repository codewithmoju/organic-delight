import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAr_l5BZdZnScis8ACekrRyrNBtn-Vn-O0",
  authDomain: "organic-delight-inventory-db.firebaseapp.com",
  projectId: "organic-delight-inventory-db",
  storageBucket: "organic-delight-inventory-db.firebasestorage.app",
  messagingSenderId: "111222170933",
  appId: "1:111222170933:web:b7748bd1803278c81f587c",
  measurementId: "G-LQX137002G"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);