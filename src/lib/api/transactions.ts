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

// Cache for transaction data
const transactionsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 1 * 60 * 1000; // 1 minute for transactions

function isCacheValid(timestamp: number): boolean {
  return Date.now() - timestamp < CACHE_DURATION;
}
export async function getTransactions(limitCount?: number, lastDoc?: DocumentSnapshot) {
  const cacheKey = `transactions-${limitCount || 'all'}-${lastDoc?.id || 'start'}`;
  const cached = transactionsCache.get(cacheKey);

  if (cached && isCacheValid(cached.timestamp)) {
    return cached.data;
  }

  const transactionsRef = collection(db, 'transactions');
  let q = query(transactionsRef, orderBy('transaction_date', 'desc'));

  if (limitCount) {
    q = query(q, limit(limitCount));
  }

  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }

  const snapshot = await getDocs(q);

  const transactions = snapshot.docs.map(docSnapshot => {
    const data = docSnapshot.data();
    return {
      id: docSnapshot.id,
      ...data,
      transaction_date: data.transaction_date?.toDate ? data.transaction_date.toDate() : new Date(data.transaction_date || Date.now()),
      created_at: data.created_at?.toDate ? data.created_at.toDate() : new Date(data.created_at || Date.now())
    } as Transaction;
  });

  // Solve N+1 for items
  const itemIds = [...new Set(transactions.map(t => t.item_id).filter(Boolean))];
  const items: Record<string, any> = {};

  if (itemIds.length > 0) {
    for (let i = 0; i < itemIds.length; i += 30) {
      const chunk = itemIds.slice(i, i + 30);
      const itemsSnapshot = await getDocs(query(collection(db, 'items'), where('__name__', 'in', chunk)));
      itemsSnapshot.forEach(itemDoc => {
        items[itemDoc.id] = { id: itemDoc.id, ...itemDoc.data() };
      });
    }

    // Solve N+1 for categories
    const categoryIds = [...new Set(Object.values(items).map(item => item.category_id).filter(Boolean))];
    const categories: Record<string, any> = {};

    if (categoryIds.length > 0) {
      for (let i = 0; i < categoryIds.length; i += 30) {
        const chunk = categoryIds.slice(i, i + 30);
        const catsSnapshot = await getDocs(query(collection(db, 'categories'), where('__name__', 'in', chunk)));
        catsSnapshot.forEach(catDoc => {
          categories[catDoc.id] = { id: catDoc.id, ...catDoc.data() };
        });
      }
    }

    // Attach categories to items
    Object.values(items).forEach(item => {
      if (item.category_id && categories[item.category_id]) {
        item.category = categories[item.category_id];
      }
    });
  }

  // Attach items to transactions
  transactions.forEach(t => {
    if (t.item_id && items[t.item_id]) {
      t.item = items[t.item_id];
    }
  });

  const result = { transactions, lastDoc: snapshot.docs[snapshot.docs.length - 1] };

  // Cache the result
  transactionsCache.set(cacheKey, { data: result, timestamp: Date.now() });

  return result;
}

export async function getRecentTransactions(limitCount: number = 5): Promise<Transaction[]> {
  const cacheKey = `recent-transactions-${limitCount}`;
  const cached = transactionsCache.get(cacheKey);

  if (cached && isCacheValid(cached.timestamp)) {
    return cached.data;
  }

  const result = await getTransactions(limitCount);
  const transactions = result.transactions;

  // Cache the result
  transactionsCache.set(cacheKey, { data: transactions, timestamp: Date.now() });

  return transactions;
}

// Clear cache when new transactions are created
export function clearTransactionsCache() {
  transactionsCache.clear();
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

  const transactions = snapshot.docs.map(docSnapshot => {
    const data = docSnapshot.data();
    return {
      id: docSnapshot.id,
      ...data,
      transaction_date: data.transaction_date?.toDate ? data.transaction_date.toDate() : new Date(data.transaction_date || Date.now()),
      created_at: data.created_at?.toDate ? data.created_at.toDate() : new Date(data.created_at || Date.now())
    } as Transaction;
  });

  // Solve N+1 for items
  const itemIds = [...new Set(transactions.map(t => t.item_id).filter(Boolean))];
  const items: Record<string, any> = {};

  if (itemIds.length > 0) {
    for (let i = 0; i < itemIds.length; i += 30) {
      const chunk = itemIds.slice(i, i + 30);
      const itemsSnapshot = await getDocs(query(collection(db, 'items'), where('__name__', 'in', chunk)));
      itemsSnapshot.forEach(itemDoc => {
        items[itemDoc.id] = { id: itemDoc.id, ...itemDoc.data() };
      });
    }
  }

  // Attach items to transactions
  transactions.forEach(t => {
    if (t.item_id && items[t.item_id]) {
      t.item = items[t.item_id];
    }
  });

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

  const newTransaction: any = {
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

  const transactions = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      transaction_date: data.transaction_date?.toDate ? data.transaction_date.toDate() : new Date(data.transaction_date || Date.now()),
      created_at: data.created_at?.toDate ? data.created_at.toDate() : new Date(data.created_at || Date.now())
    } as Transaction;
  });

  // Solve N+1 for items
  const itemIds = [...new Set(transactions.map(t => t.item_id).filter(Boolean))];
  const items: Record<string, any> = {};

  if (itemIds.length > 0) {
    for (let i = 0; i < itemIds.length; i += 30) {
      const chunk = itemIds.slice(i, i + 30);
      const itemsSnapshot = await getDocs(query(collection(db, 'items'), where('__name__', 'in', chunk)));
      itemsSnapshot.forEach(itemDoc => {
        items[itemDoc.id] = { id: itemDoc.id, ...itemDoc.data() };
      });
    }
  }

  // Attach items to transactions
  transactions.forEach(t => {
    if (t.item_id && items[t.item_id]) {
      t.item = items[t.item_id];
    }
  });

  return transactions;
}