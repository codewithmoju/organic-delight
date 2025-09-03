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
  orderBy,
  limit,
  startAfter,
  DocumentSnapshot
} from 'firebase/firestore';
import { db } from '../firebase';
import { Item } from '../types';

export async function getItems(limitCount?: number, lastDoc?: DocumentSnapshot) {
  const itemsRef = collection(db, 'items');
  let q = query(itemsRef, orderBy('name'));
  
  if (limitCount) {
    q = query(q, limit(limitCount));
  }
  
  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }
  
  const snapshot = await getDocs(q);
  
  const items = [];
  for (const docSnapshot of snapshot.docs) {
    const item = { id: docSnapshot.id, ...docSnapshot.data() } as Item;
    if (item.category_id) {
      const categoryDoc = await getDoc(doc(db, 'categories', item.category_id));
      if (categoryDoc.exists()) {
        item.category = { id: categoryDoc.id, ...categoryDoc.data() };
      }
    }
    items.push(item);
  }
  
  return { items, lastDoc: snapshot.docs[snapshot.docs.length - 1] };
}

export async function searchItems(searchQuery: string, categoryId?: string) {
  const itemsRef = collection(db, 'items');
  let q = query(itemsRef, orderBy('name'));
  
  if (categoryId) {
    q = query(itemsRef, where('category_id', '==', categoryId), orderBy('name'));
  }
  
  const snapshot = await getDocs(q);
  
  const items = [];
  for (const docSnapshot of snapshot.docs) {
    const item = { id: docSnapshot.id, ...docSnapshot.data() } as Item;
    
    // Client-side filtering for search
    if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !item.description?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !item.sku?.toLowerCase().includes(searchQuery.toLowerCase())) {
      continue;
    }
    
    if (item.category_id) {
      const categoryDoc = await getDoc(doc(db, 'categories', item.category_id));
      if (categoryDoc.exists()) {
        item.category = { id: categoryDoc.id, ...categoryDoc.data() };
      }
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
  if (item.category_id) {
    const categoryDoc = await getDoc(doc(db, 'categories', item.category_id));
    if (categoryDoc.exists()) {
      item.category = { id: categoryDoc.id, ...categoryDoc.data() };
    }
  }
  
  return item;
}

export async function getLowStockItems() {
  const itemsRef = collection(db, 'items');
  const snapshot = await getDocs(itemsRef);
  
  const items = [];
  for (const docSnapshot of snapshot.docs) {
    const item = { id: docSnapshot.id, ...docSnapshot.data() } as Item;
    if (item.quantity <= item.reorder_point) {
      if (item.category_id) {
        const categoryDoc = await getDoc(doc(db, 'categories', item.category_id));
        if (categoryDoc.exists()) {
          item.category = { id: categoryDoc.id, ...categoryDoc.data() };
        }
      }
      items.push(item);
    }
  }
  
  return items;
}

export async function createItem(item: Omit<Item, 'id'>) {
  const docRef = await addDoc(collection(db, 'items'), {
    ...item,
    created_at: new Date(),
    updated_at: new Date()
  });
  return getItem(docRef.id);
}

export async function updateItem(id: string, item: Partial<Item>) {
  const docRef = doc(db, 'items', id);
  await updateDoc(docRef, {
    ...item,
    updated_at: new Date()
  });
  return getItem(id);
}

export async function deleteItem(id: string) {
  await deleteDoc(doc(db, 'items', id));
}

export async function bulkUpdateItems(updates: Array<{ id: string; data: Partial<Item> }>) {
  const promises = updates.map(({ id, data }) => updateItem(id, data));
  return Promise.all(promises);
}