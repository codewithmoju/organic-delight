import { 
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../firebase';
import { Transaction } from '../types';

export async function getTransactions() {
  const transactionsRef = collection(db, 'transactions');
  const q = query(transactionsRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  
  const transactions = [];
  for (const doc of snapshot.docs) {
    const transaction = { id: doc.id, ...doc.data() } as Transaction;
    
    // Get item data if itemId exists
    if (transaction.itemId) {
      const itemDoc = await getDoc(doc(db, 'items', transaction.itemId));
      if (itemDoc.exists()) {
        transaction.item = { id: itemDoc.id, ...itemDoc.data() };
      }
    }
    
    transactions.push(transaction);
  }
  
  return transactions;
}

export async function getRecentTransactions(limitCount: number = 5) {
  const transactionsRef = collection(db, 'transactions');
  const q = query(transactionsRef, orderBy('createdAt', 'desc'), limit(limitCount));
  const snapshot = await getDocs(q);
  
  const transactions = [];
  for (const doc of snapshot.docs) {
    const transaction = { id: doc.id, ...doc.data() } as Transaction;
    
    // Get item data if itemId exists
    if (transaction.itemId) {
      const itemDoc = await getDoc(doc(db, 'items', transaction.itemId));
      if (itemDoc.exists()) {
        transaction.item = { id: itemDoc.id, ...itemDoc.data() };
      }
    }
    
    transactions.push(transaction);
  }
  
  return transactions;
}

export async function createTransaction(transaction: Omit<Transaction, 'id'>) {
  const docRef = await addDoc(collection(db, 'transactions'), {
    ...transaction,
    createdAt: new Date(),
  });
  
  return {
    id: docRef.id,
    ...transaction
  } as Transaction;
}

export async function getTransactionsByItem(itemId: string) {
  const transactionsRef = collection(db, 'transactions');
  const q = query(transactionsRef, where('itemId', '==', itemId), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Transaction[];
}