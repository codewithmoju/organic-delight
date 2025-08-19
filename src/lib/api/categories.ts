import { 
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase';
import { Category } from '../types';

export async function getCategories() {
  const categoriesRef = collection(db, 'categories');
  const q = query(categoriesRef, orderBy('name'));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Category[];
}

export async function createCategory(category: Omit<Category, 'id'>) {
  const docRef = await addDoc(collection(db, 'categories'), {
    ...category,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  return {
    id: docRef.id,
    ...category
  } as Category;
}

export async function updateCategory(id: string, category: Partial<Category>) {
  const docRef = doc(db, 'categories', id);
  await updateDoc(docRef, {
    ...category,
    updatedAt: new Date()
  });
  
  return {
    id,
    ...category
  } as Category;
}

export async function deleteCategory(id: string) {
  await deleteDoc(doc(db, 'categories', id));
}