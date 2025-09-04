import { 
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where
} from 'firebase/firestore';
import { db } from '../firebase';
import { Category } from '../types';

export async function getCategories(): Promise<Category[]> {
  const categoriesRef = collection(db, 'categories');
  const q = query(categoriesRef, orderBy('name'));
  const snapshot = await getDocs(q);
  
  const categories = [];
  for (const docSnapshot of snapshot.docs) {
    const category = { id: docSnapshot.id, ...docSnapshot.data() } as Category;
    
    // Get item count for this category
    const itemsRef = collection(db, 'items');
    const itemsQuery = query(itemsRef, where('category_id', '==', category.id));
    const itemsSnapshot = await getDocs(itemsQuery);
    category.item_count = itemsSnapshot.size;
    
    categories.push(category);
  }
  
  return categories;
}

export async function getCategoryById(id: string): Promise<Category> {
  const docRef = doc(db, 'categories', id);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    throw new Error('Category not found');
  }
  
  return { id: docSnap.id, ...docSnap.data() } as Category;
}

export async function createCategory(categoryData: {
  name: string;
  description: string;
  created_by: string;
}): Promise<Category> {
  // Check for duplicate category names
  const categoriesRef = collection(db, 'categories');
  const existingQuery = query(categoriesRef, where('name', '==', categoryData.name.trim()));
  const existingSnapshot = await getDocs(existingQuery);
  
  if (!existingSnapshot.empty) {
    throw new Error('A category with this name already exists');
  }

  const docRef = await addDoc(collection(db, 'categories'), {
    ...categoryData,
    name: categoryData.name.trim(),
    created_at: new Date(),
    updated_at: new Date()
  });
  
  return {
    id: docRef.id,
    ...categoryData,
    name: categoryData.name.trim(),
    created_at: new Date() as any,
    updated_at: new Date() as any
  };
}

export async function updateCategory(id: string, categoryData: {
  name?: string;
  description?: string;
}): Promise<Category> {
  // Check for duplicate category names if name is being updated
  if (categoryData.name) {
    const categoriesRef = collection(db, 'categories');
    const existingQuery = query(categoriesRef, where('name', '==', categoryData.name.trim()));
    const existingSnapshot = await getDocs(existingQuery);
    
    // Check if any existing category has this name (excluding current category)
    const duplicateExists = existingSnapshot.docs.some(doc => doc.id !== id);
    if (duplicateExists) {
      throw new Error('A category with this name already exists');
    }
  }

  const docRef = doc(db, 'categories', id);
  const updateData = {
    ...categoryData,
    ...(categoryData.name && { name: categoryData.name.trim() }),
    updated_at: new Date()
  };
  
  await updateDoc(docRef, updateData);
  return getCategoryById(id);
}

export async function deleteCategory(id: string): Promise<void> {
  // Check if category has items
  const itemsRef = collection(db, 'items');
  const itemsQuery = query(itemsRef, where('category_id', '==', id));
  const itemsSnapshot = await getDocs(itemsQuery);
  
  if (!itemsSnapshot.empty) {
    throw new Error('Cannot delete category that contains items. Please move or delete all items first.');
  }
  
  await deleteDoc(doc(db, 'categories', id));
}

export async function getCategoryItemCount(categoryId: string): Promise<number> {
  const itemsRef = collection(db, 'items');
  const q = query(itemsRef, where('category_id', '==', categoryId));
  const snapshot = await getDocs(q);
  return snapshot.size;
}