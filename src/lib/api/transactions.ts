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
import { requireCurrentUserId } from './userScope';
import { stampOrgId, getOrgScopeFilter, stripUndefined } from './orgScope';
import { cacheFirstRead, STALE_MS } from './_cacheFirst';
import { useEntityStore } from '../store/entities';
export async function getTransactions(limitCount?: number, lastDoc?: DocumentSnapshot) {
  const scope = getOrgScopeFilter();

  const transactions = await cacheFirstRead(
    'transactions',
    () => useEntityStore.getState().transactions.data.length > 0 ? useEntityStore.getState().transactions.data : null,
    () => useEntityStore.getState().transactions.loadedAt,
    (data) => useEntityStore.getState().setTransactions(data),
    async () => {
      const transactionsRef = collection(db, 'transactions');
      let q = query(
        transactionsRef,
        where(scope.field, '==', scope.value),
        orderBy('transaction_date', 'desc')
      );

      if (limitCount) {
        q = query(q, limit(limitCount));
      }

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snapshot = await getDocs(q);

      return snapshot.docs.map(docSnapshot => {
        const data = docSnapshot.data();
        return {
          id: docSnapshot.id,
          ...data,
          transaction_date: data.transaction_date?.toDate ? data.transaction_date.toDate() : new Date(data.transaction_date || Date.now()),
          created_at: data.created_at?.toDate ? data.created_at.toDate() : new Date(data.created_at || Date.now())
        } as Transaction;
      });
    },
    STALE_MS.transactions,
  );

  // Resolve items from entity store (no Firestore fetch needed)
  const storeItems = useEntityStore.getState().items.data;
  const itemsMap: Record<string, any> = {};
  for (const item of storeItems) {
    itemsMap[item.id] = item;
  }

  const enriched = transactions.map(t => {
    const enriched = { ...t } as any;
    if (t.item_id && itemsMap[t.item_id]) {
      enriched.item = itemsMap[t.item_id];
    }
    return enriched;
  });

  return { transactions: enriched, lastDoc: null };
}

export async function getRecentTransactions(limitCount: number = 5): Promise<Transaction[]> {
  const result = await getTransactions(limitCount);
  return result.transactions;
}

// Clear cache when new transactions are created
export function clearTransactionsCache() {
  useEntityStore.getState().markTransactionsStale();
}

export async function getTransactionsByDateRange(startDate: Date, endDate: Date): Promise<Transaction[]> {
  const scope = getOrgScopeFilter();
  const transactionsRef = collection(db, 'transactions');
  const q = query(
    transactionsRef,
    where(scope.field, '==', scope.value),
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

  // Resolve items from entity store (no Firestore fetch needed)
  const storeItems = useEntityStore.getState().items.data;
  const itemsMap: Record<string, any> = {};
  for (const item of storeItems) {
    itemsMap[item.id] = item;
  }

  transactions.forEach(t => {
    if (t.item_id && itemsMap[t.item_id]) {
      (t as any).item = itemsMap[t.item_id];
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
  const userId = requireCurrentUserId();
  // Calculate total value
  const total_value = transactionData.quantity * transactionData.unit_price;

  const itemDocForOwnership = await getDoc(doc(db, 'items', transactionData.item_id));
  if (!itemDocForOwnership.exists() || itemDocForOwnership.data().created_by !== userId) {
    throw new Error('Item not found');
  }

  // Validate stock out doesn't exceed available quantity
  if (transactionData.type === 'stock_out') {
    const stockLevel = await import('./items').then(m => m.getItemStockLevel(transactionData.item_id));
    if (stockLevel && transactionData.quantity > stockLevel.current_quantity) {
      throw new Error(`Insufficient stock. Available: ${stockLevel.current_quantity}`);
    }
  }

  const docRef = await addDoc(collection(db, 'transactions'), {
    ...stripUndefined(transactionData),
    created_by: userId,
    total_value,
    transaction_date: Timestamp.fromDate(transactionData.transaction_date),
    created_at: new Date(),
    ...stampOrgId({}),
  });

  const newTransaction: any = {
    id: docRef.id,
    ...transactionData,
    created_by: userId,
    transaction_date: transactionData.transaction_date,
    created_at: new Date(),
    total_value,
  };

  // Get item data from entity store
  const storeItem = useEntityStore.getState().items.data.find(i => i.id === transactionData.item_id);
  if (storeItem) {
    newTransaction.item = storeItem;
  }

  // Update entity store
  useEntityStore.getState().addTransaction(newTransaction);

  return newTransaction;
}

export async function getTransactionsByItem(itemId: string): Promise<Transaction[]> {
  const scope = getOrgScopeFilter();
  const transactionsRef = collection(db, 'transactions');
  const q = query(
    transactionsRef,
    where(scope.field, '==', scope.value),
    where('item_id', '==', itemId),
    orderBy('transaction_date', 'desc')
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map(docSnapshot => ({
    id: docSnapshot.id,
    ...docSnapshot.data(),
    transaction_date: docSnapshot.data().transaction_date?.toDate ? docSnapshot.data().transaction_date.toDate() : new Date(docSnapshot.data().transaction_date || Date.now()),
    created_at: docSnapshot.data().created_at?.toDate ? docSnapshot.data().created_at.toDate() : new Date(docSnapshot.data().created_at || Date.now())
  })) as Transaction[];
}

export async function getTransactionsForPeriod(startDate: Date, endDate: Date): Promise<Transaction[]> {
  const scope = getOrgScopeFilter();
  const transactionsRef = collection(db, 'transactions');
  const q = query(
    transactionsRef,
    where(scope.field, '==', scope.value),
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

  // Resolve items from entity store (no Firestore fetch needed)
  const storeItems = useEntityStore.getState().items.data;
  const itemsMap: Record<string, any> = {};
  for (const item of storeItems) {
    itemsMap[item.id] = item;
  }

  transactions.forEach(t => {
    if (t.item_id && itemsMap[t.item_id]) {
      (t as any).item = itemsMap[t.item_id];
    }
  });

  return transactions;
}