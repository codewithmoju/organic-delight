import { 
  collection,
  getDocs,
  query,
  orderBy,
  where
} from 'firebase/firestore';
import { db } from './firebase';
import { getRecentTransactions as getRecentTransactionsFromTransactions } from './api/transactions';

export async function getInventorySummary() {
  const itemsRef = collection(db, 'items');
  const q = query(itemsRef, orderBy('quantity'));
  const snapshot = await getDocs(q);
  
  const items = [];
  for (const doc of snapshot.docs) {
    const item = { id: doc.id, ...doc.data() };
    
    // Get category if categoryId exists
    if (item.categoryId) {
      const categoriesRef = collection(db, 'categories');
      const categoryQuery = query(categoriesRef, where('__name__', '==', item.categoryId));
      const categorySnapshot = await getDocs(categoryQuery);
      if (!categorySnapshot.empty) {
        item.categories = { name: categorySnapshot.docs[0].data().name };
      }
    }
    
    items.push(item);
  }
  
  return items;
}

export async function getLowStockItems() {
  const itemsRef = collection(db, 'items');
  const snapshot = await getDocs(itemsRef);
  
  return snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(item => item.quantity <= item.reorderPoint);
}

export async function getRecentTransactions() {
  return await getRecentTransactionsFromTransactions(5);
}