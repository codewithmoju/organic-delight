import { 
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase';
import { Item } from '../types';

export async function getItems() {
  const itemsRef = collection(db, 'items');
  const q = query(itemsRef, orderBy('name'));
  const snapshot = await getDocs(q);
  
  const items = [];
  for (const doc of snapshot.docs) {
    const item = { id: doc.id, ...doc.data() } as Item;
    if (item.categoryId) {
      const categoryDoc = await getDoc(doc(db, 'categories', item.categoryId));
      item.category = { id: categoryDoc.id, ...categoryDoc.data() };
    }
    items.push(item);
  }
  
  return items;
}

export async function getItem(id: string) {
  const docRef = doc(db, 'items', id);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    throw new Error('Item not found');
  }
  
  const item = { id: docSnap.id, ...docSnap.data() } as Item;
  if (item.categoryId) {
    const categoryDoc = await getDoc(doc(db, 'categories', item.categoryId));
    item.category = { id: categoryDoc.id, ...categoryDoc.data() };
  }
  
  return item;
}

export async function createItem(item: Omit<Item, 'id'>) {
  const docRef = await addDoc(collection(db, 'items'), {
    ...item,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  return getItem(docRef.id);
}

export async function updateItem(id: string, item: Partial<Item>) {
  const docRef = doc(db, 'items', id);
  await updateDoc(docRef, {
    ...item,
    updatedAt: new Date()
  });
  return getItem(id);
}

export async function deleteItem(id: string) {
  await deleteDoc(doc(db, 'items', id));
}