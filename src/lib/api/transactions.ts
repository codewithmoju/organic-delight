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
  let q = query(transactionsRef, orderBy('transaction_date', 'desc'));
  
  if (limitCount) {
    q = query(q, limit(limitCount));
  }
  
  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }
  
  const snapshot = await getDocs(q);
  
  const transactions = [];
  for (const docSnapshot of snapshot.docs) {
    const transactionData = docSnapshot.data();
    const transaction = { 
      id: docSnapshot.id, 
      ...transactionData,
      transaction_date: transactionData.transaction_date?.toDate ? transactionData.transaction_date.toDate() : new Date(transactionData.transaction_date || Date.now()),
      created_at: transactionData.created_at?.toDate ? transactionData.created_at.toDate() : new Date(transactionData.created_at || Date.now())
    } as Transaction;
    
    // Get item data
    if (transaction.item_id) {
      const itemDoc = await getDoc(doc(db, 'items', transaction.item_id));
      if (itemDoc.exists()) {
        transaction.item = { id: itemDoc.id, ...itemDoc.data() };
        
        // Get category for the item
        if (transaction.item.category_id) {
          const categoryDoc = await getDoc(doc(db, 'categories', transaction.item.category_id));
          if (categoryDoc.exists()) {
            transaction.item.category = { id: categoryDoc.id, ...categoryDoc.data() };
          }
        }
      }
    }
    
    transactions.push(transaction);
  }
  
  return { transactions, lastDoc: snapshot.docs[snapshot.docs.length - 1] };
}

export async function getRecentTransactions(limitCount: number = 5): Promise<Transaction[]> {
  const result = await getTransactions(limitCount);
  return result.transactions;
}

export async function getTransactionsByDateRange(startDate: Date, endDate: Date): Promise<Transaction[]> {
  const transactionsRef = collection(db, 'transactions');
  const q = query(
    transactionsRef, 
    where('transaction_date', '>=', Timestamp.fromDate(startDate)),
    where('transaction_date', '<=', Timestamp.fromDate(endDate)),
    orderBy('transaction_date', 'desc')
  );
  const snapshot = await getDocs(q);
  
  const transactions = [];
  for (const docSnapshot of snapshot.docs) {
    const transactionData = docSnapshot.data();
    const transaction = { 
      id: docSnapshot.id, 
      ...transactionData,
      transaction_date: transactionData.transaction_date?.toDate ? transactionData.transaction_date.toDate() : new Date(transactionData.transaction_date || Date.now()),
      created_at: transactionData.created_at?.toDate ? transactionData.created_at.toDate() : new Date(transactionData.created_at || Date.now())
    } as Transaction;
    
    // Get item data
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

export async function createTransaction(transactionData: {
  item_id: string;
  type: 'stock_in' | 'stock_out';
  quantity: number;
  unit_price: number;
  transaction_date: Date;
  supplier_customer: string;
  reference_number?: string;
  notes?: string;
  created_by: string;
}): Promise<Transaction> {
  // Calculate total value
  const total_value = transactionData.quantity * transactionData.unit_price;
  
  // Validate stock out doesn't exceed available quantity
  if (transactionData.type === 'stock_out') {
    const stockLevel = await import('./items').then(m => m.getItemStockLevel(transactionData.item_id));
    if (stockLevel && transactionData.quantity > stockLevel.current_quantity) {
      throw new Error(`Insufficient stock. Available: ${stockLevel.current_quantity}`);
    }
  }

  const docRef = await addDoc(collection(db, 'transactions'), {
    ...transactionData,
    total_value,
    transaction_date: Timestamp.fromDate(transactionData.transaction_date),
    created_at: new Date(),
  });
  
  const newTransaction = {
    id: docRef.id,
    ...transactionData,
    transaction_date: transactionData.transaction_date,
    created_at: new Date(),
    total_value,
  };
  
  // Get item data for the response
  const itemDoc = await getDoc(doc(db, 'items', transactionData.item_id));
  if (itemDoc.exists()) {
    newTransaction.item = { id: itemDoc.id, ...itemDoc.data() };
  }
  
  return newTransaction;
}

export async function getTransactionsByItem(itemId: string): Promise<Transaction[]> {
  const transactionsRef = collection(db, 'transactions');
  const q = query(transactionsRef, where('item_id', '==', itemId), orderBy('transaction_date', 'desc'));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(docSnapshot => ({
    id: docSnapshot.id,
    ...docSnapshot.data(),
    transaction_date: docSnapshot.data().transaction_date?.toDate ? docSnapshot.data().transaction_date.toDate() : new Date(docSnapshot.data().transaction_date || Date.now()),
    created_at: docSnapshot.data().created_at?.toDate ? docSnapshot.data().created_at.toDate() : new Date(docSnapshot.data().created_at || Date.now())
  })) as Transaction[];
}

export async function getTransactionsForPeriod(startDate: Date, endDate: Date): Promise<Transaction[]> {
  const transactionsRef = collection(db, 'transactions');
  const q = query(
    transactionsRef,
    where('transaction_date', '>=', Timestamp.fromDate(startDate)),
    where('transaction_date', '<=', Timestamp.fromDate(endDate)),
    orderBy('transaction_date', 'desc')
  );
  
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    transaction_date: doc.data().transaction_date?.toDate ? doc.data().transaction_date.toDate() : new Date(doc.data().transaction_date || Date.now()),
    created_at: doc.data().created_at?.toDate ? doc.data().created_at.toDate() : new Date(doc.data().created_at || Date.now())
  })) as Transaction[];
}