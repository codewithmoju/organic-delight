import { 
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  orderBy,
  where
} from 'firebase/firestore';
import { db } from './firebase';
import { Item } from './types';

export async function getInventorySummary(): Promise<Item[]> {
  const itemsRef = collection(db, 'items');
  const q = query(itemsRef, orderBy('quantity'));
  const snapshot = await getDocs(q);
  
  const items = [];
  for (const doc of snapshot.docs) {
    const item = { id: doc.id, ...doc.data() };
    
    // Get category if category_id exists
    if (item.category_id) {
      try {
        const categoryDoc = await getDoc(doc(db, 'categories', item.category_id));
        if (categoryDoc.exists()) {
          item.category = { id: categoryDoc.id, ...categoryDoc.data() };
        }
      } catch (error) {
        console.warn('Failed to load category for item:', item.id);
      }
    }
    
    items.push(item);
  }
  
  return items;
}

export async function getLowStockItems(): Promise<Item[]> {
  const itemsRef = collection(db, 'items');
  const snapshot = await getDocs(itemsRef);
  
  const items = [];
  for (const doc of snapshot.docs) {
    const item = { id: doc.id, ...doc.data() };
    
    if (item.quantity <= item.reorder_point) {
      // Get category if category_id exists
      if (item.category_id) {
        try {
          const categoryDoc = await getDoc(doc(db, 'categories', item.category_id));
          if (categoryDoc.exists()) {
            item.category = { id: categoryDoc.id, ...categoryDoc.data() };
          }
        } catch (error) {
          console.warn('Failed to load category for item:', item.id);
        }
      }
      items.push(item);
    }
  }
  
  return items;
}