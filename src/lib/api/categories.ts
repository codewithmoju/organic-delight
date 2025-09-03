import { 
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where
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

export async function getCategoryById(id: string) {
  const docRef = doc(db, 'categories', id);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    throw new Error('Category not found');
  }
  
  return { id: docSnap.id, ...docSnap.data() } as Category;
}

export async function getCategoryItemCount(categoryId: string) {
  const itemsRef = collection(db, 'items');
  const q = query(itemsRef, where('category_id', '==', categoryId));
  const snapshot = await getDocs(q);
  return snapshot.size;
}

export async function createCategory(category: Omit<Category, 'id'>) {
  const docRef = await addDoc(collection(db, 'categories'), {
    ...category,
    created_at: new Date(),
    updated_at: new Date()
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
    updated_at: new Date()
  });
  
  return {
    id,
    ...category
  } as Category;
}

export async function deleteCategory(id: string, reassignToId?: string) {
  // If reassigning items, update them first
  if (reassignToId) {
    const itemsRef = collection(db, 'items');
    const q = query(itemsRef, where('category_id', '==', id));
    const snapshot = await getDocs(q);
    
    const updatePromises = snapshot.docs.map(doc => 
      updateDoc(doc.ref, { category_id: reassignToId, updated_at: new Date() })
    );
    await Promise.all(updatePromises);
  }
  
  await deleteDoc(doc(db, 'categories', id));
}