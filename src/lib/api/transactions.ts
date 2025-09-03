import { 
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  DocumentSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { Transaction } from '../types';

export async function getTransactions(limitCount?: number, lastDoc?: DocumentSnapshot) {
  const transactionsRef = collection(db, 'transactions');
  let q = query(transactionsRef, orderBy('created_at', 'desc'));
  
  if (limitCount) {
    q = query(q, limit(limitCount));
  }
  
  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }
  
  const snapshot = await getDocs(q);
  
  const transactions = [];
  for (const doc of snapshot.docs) {
    const transaction = { id: doc.id, ...doc.data() } as Transaction;
    
    // Get item data if item_id exists
    if (transaction.item_id) {
      const itemDoc = await getDoc(doc(db, 'items', transaction.item_id));
      if (itemDoc.exists()) {
        transaction.item = { id: itemDoc.id, ...itemDoc.data() };
      }
    }
    
    transactions.push(transaction);
  }
  
  return { transactions, lastDoc: snapshot.docs[snapshot.docs.length - 1] };
}

export async function getRecentTransactions(limitCount: number = 5) {
  const transactionsRef = collection(db, 'transactions');
  const q = query(transactionsRef, orderBy('created_at', 'desc'), limit(limitCount));
  const snapshot = await getDocs(q);
  
  const transactions = [];
  for (const doc of snapshot.docs) {
    const transaction = { id: doc.id, ...doc.data() } as Transaction;
    
    // Get item data if item_id exists
    if (transaction.item_id) {
      const itemDoc = await getDoc(doc(db, 'items', transaction.item_id));
      if (itemDoc.exists()) {
        transaction.item = { id: itemDoc.id, ...itemDoc.data() };
      }
    }
    
    transactions.push(transaction);
  }
  
  return transactions;
}

export async function getTransactionsByDateRange(startDate: Date, endDate: Date) {
  const transactionsRef = collection(db, 'transactions');
  const q = query(
    transactionsRef, 
    where('created_at', '>=', Timestamp.fromDate(startDate)),
    where('created_at', '<=', Timestamp.fromDate(endDate)),
    orderBy('created_at', 'desc')
  );
  const snapshot = await getDocs(q);
  
  const transactions = [];
  for (const doc of snapshot.docs) {
    const transaction = { id: doc.id, ...doc.data() } as Transaction;
    
    if (transaction.item_id) {
      const itemDoc = await getDoc(doc(db, 'items', transaction.item_id));
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
    created_at: new Date(),
  });
  
  return {
    id: docRef.id,
    ...transaction
  } as Transaction;
}

export async function getTransactionsByItem(itemId: string) {
  const transactionsRef = collection(db, 'transactions');
  const q = query(transactionsRef, where('item_id', '==', itemId), orderBy('created_at', 'desc'));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Transaction[];
}