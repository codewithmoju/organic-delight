import { 
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  where
} from 'firebase/firestore';
import { db } from './firebase';

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
  const transactionsRef = collection(db, 'transactions');
  const q = query(transactionsRef, orderBy('createdAt', 'desc'), limit(5));
  const snapshot = await getDocs(q);
  
  const transactions = [];
  for (const doc of snapshot.docs) {
    const transaction = { id: doc.id, ...doc.data() };
    
    // Get item name if itemId exists
    if (transaction.itemId) {
      const itemsRef = collection(db, 'items');
      const itemQuery = query(itemsRef, where('__name__', '==', transaction.itemId));
      const itemSnapshot = await getDocs(itemQuery);
      if (!itemSnapshot.empty) {
        transaction.items = { name: itemSnapshot.docs[0].data().name };
      }
    }
    
    transactions.push(transaction);
  }
  
  return transactions;
}