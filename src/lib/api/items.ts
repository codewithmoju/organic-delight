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
  DocumentSnapshot,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import { Item, StockLevel } from '../types';

// Simple cache for frequently accessed data
const itemsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

export function invalidateItemsCache() {
  itemsCache.clear();
}

function isCacheValid(timestamp: number): boolean {
  return Date.now() - timestamp < CACHE_DURATION;
}
export async function getItems(limitCount?: number, lastDoc?: DocumentSnapshot) {
  const cacheKey = `items-${limitCount || 'all'}-${lastDoc?.id || 'start'}`;
  const cached = itemsCache.get(cacheKey);

  if (cached && isCacheValid(cached.timestamp)) {
    return cached.data;
  }

  try {
    const itemsRef = collection(db, 'items');
    let q = query(itemsRef, where('is_archived', '!=', true), orderBy('name'));

    if (limitCount) {
      q = query(q, limit(limitCount));
    }

    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const snapshot = await getDocs(q);

    const items = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Map persistent stock fields
        current_quantity: data.current_quantity ?? 0,
        average_unit_cost: data.average_unit_cost ?? 0,
        total_value: (data.current_quantity ?? 0) * (data.average_unit_cost ?? 0),
        created_at: data.created_at?.toDate ? data.created_at.toDate() : new Date(data.created_at || Date.now()),
        updated_at: data.updated_at?.toDate ? data.updated_at.toDate() : new Date(data.updated_at || Date.now())
      } as Item;
    });

    // Solve N+1 for categories
    const categoryIds = [...new Set(items.map(item => item.category_id).filter(Boolean))];
    const categories: Record<string, any> = {};

    if (categoryIds.length > 0) {
      for (let i = 0; i < categoryIds.length; i += 30) {
        const chunk = categoryIds.slice(i, i + 30);
        const categoriesRef = collection(db, 'categories');
        const catQuery = query(categoriesRef, where('__name__', 'in', chunk));
        const catSnapshot = await getDocs(catQuery);
        catSnapshot.forEach(catDoc => {
          categories[catDoc.id] = { id: catDoc.id, ...catDoc.data() };
        });
      }
    }

    // Attach categories to items
    items.forEach(item => {
      if (item.category_id && categories[item.category_id]) {
        item.category = categories[item.category_id];
      }
    });

    const result = { items, lastDoc: snapshot.docs[snapshot.docs.length - 1] };

    // Cache the result
    itemsCache.set(cacheKey, { data: result, timestamp: Date.now() });

    return result;
  } catch (error: any) {
    console.error('Firestore getItems error:', error);
    if (error.message?.includes('index')) {
      console.info('To fix this index error, visit: https://console.firebase.google.com/project/organic-delight-inventory-db/firestore/indexes');
    }
    throw error;
  }
}

export async function getItemsByCategory(categoryId: string): Promise<Item[]> {
  const itemsRef = collection(db, 'items');
  const q = query(itemsRef, where('category_id', '==', categoryId), where('is_archived', '!=', true), orderBy('name'));
  const snapshot = await getDocs(q);

  const items = snapshot.docs.map(docSnapshot => {
    const itemData = docSnapshot.data();
    return {
      id: docSnapshot.id,
      ...itemData,
      current_quantity: itemData.current_quantity ?? 0,
      average_unit_cost: itemData.average_unit_cost ?? 0,
      total_value: (itemData.current_quantity ?? 0) * (itemData.average_unit_cost ?? 0),
      created_at: itemData.created_at?.toDate ? itemData.created_at.toDate() : new Date(itemData.created_at || Date.now()),
      updated_at: itemData.updated_at?.toDate ? itemData.updated_at.toDate() : new Date(itemData.updated_at || Date.now())
    } as Item;
  });

  return items;
}

export async function getItem(id: string): Promise<Item> {
  const docRef = doc(db, 'items', id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error('Item not found');
  }

  const itemData = docSnap.data();
  const item = {
    id: docSnap.id,
    ...itemData,
    created_at: itemData.created_at?.toDate ? itemData.created_at.toDate() : new Date(itemData.created_at || Date.now()),
    updated_at: itemData.updated_at?.toDate ? itemData.updated_at.toDate() : new Date(itemData.updated_at || Date.now())
  } as Item;

  // Get category data
  if (item.category_id) {
    const categoryDoc = await getDoc(doc(db, 'categories', item.category_id));
    if (categoryDoc.exists()) {
      const catData = categoryDoc.data();
      item.category = {
        id: categoryDoc.id,
        ...catData,
        created_at: catData.created_at?.toDate ? catData.created_at.toDate() : new Date(),
        updated_at: catData.updated_at?.toDate ? catData.updated_at.toDate() : new Date()
      } as any;
    }
  }

  // Get stock level data
  const stockData = await getItemStockLevel(item.id);
  if (stockData) {
    item.current_quantity = stockData.current_quantity;
    item.average_unit_cost = stockData.average_unit_cost;
    item.last_transaction_date = stockData.last_transaction_date;
    item.total_value = stockData.total_value;
  }

  return item;
}

export async function createItem(itemData: {
  name: string;
  description: string;
  category_id: string;
  unit?: string;
  unit_price?: number;
  barcode?: string;
  sku?: string;
  supplier?: string;
  location?: string;
  reorder_point?: number;
  purchase_rate?: number;
  sale_rate?: number;
  created_by: string;
}): Promise<Item> {
  console.log('Creating item in database:', itemData);

  // Check for duplicate item names within the same category
  const itemsRef = collection(db, 'items');
  const existingQuery = query(
    itemsRef,
    where('category_id', '==', itemData.category_id),
    where('name', '==', itemData.name.trim())
  );
  const existingSnapshot = await getDocs(existingQuery);

  if (!existingSnapshot.empty) {
    throw new Error('An item with this name already exists in this category');
  }

  const docRef = await addDoc(collection(db, 'items'), {
    ...itemData,
    name: itemData.name.trim(),
    unit: itemData.unit || 'pcs',
    unit_price: itemData.unit_price || itemData.sale_rate || 0,
    barcode: itemData.barcode || null,
    sku: itemData.sku || null,
    supplier: itemData.supplier || null,
    location: itemData.location || null,
    reorder_point: itemData.reorder_point || 10,
    purchase_rate: itemData.purchase_rate || 0,
    sale_rate: itemData.sale_rate || 0,
    is_archived: false,
    created_at: Timestamp.fromDate(new Date()),
    updated_at: Timestamp.fromDate(new Date())
  });

  console.log('Item created with ID:', docRef.id);
  // Invalidate cache
  itemsCache.clear();
  return getItem(docRef.id);
}

export async function updateItem(id: string, itemData: {
  name?: string;
  description?: string;
  category_id?: string;
  unit?: string;
  unit_price?: number;
  barcode?: string;
  sku?: string;
  supplier?: string;
  location?: string;
  reorder_point?: number;
  purchase_rate?: number;
  sale_rate?: number;
}): Promise<Item> {
  // Check for duplicate item names if name or category is being updated
  if (itemData.name || itemData.category_id) {
    const currentItem = await getItem(id);
    const newName = itemData.name?.trim() || currentItem.name;
    const newCategoryId = itemData.category_id || currentItem.category_id;

    const itemsRef = collection(db, 'items');
    const existingQuery = query(
      itemsRef,
      where('category_id', '==', newCategoryId),
      where('name', '==', newName)
    );
    const existingSnapshot = await getDocs(existingQuery);

    // Check if any existing item has this name in this category (excluding current item)
    const duplicateExists = existingSnapshot.docs.some(doc => doc.id !== id);
    if (duplicateExists) {
      throw new Error('An item with this name already exists in this category');
    }
  }

  const docRef = doc(db, 'items', id);
  const updateData = {
    ...itemData,
    ...(itemData.name && { name: itemData.name.trim() }),
    updated_at: Timestamp.fromDate(new Date())
  };

  await updateDoc(docRef, updateData);
  // Invalidate cache
  itemsCache.clear();
  return getItem(id);
}

export async function deleteItem(id: string): Promise<void> {
  // Check if item has transactions
  const transactionsRef = collection(db, 'transactions');
  const transactionsQuery = query(transactionsRef, where('item_id', '==', id));
  const transactionsSnapshot = await getDocs(transactionsQuery);

  if (!transactionsSnapshot.empty) {
    // Archive the item instead of deleting it
    const docRef = doc(db, 'items', id);
    await updateDoc(docRef, {
      is_archived: true,
      updated_at: Timestamp.fromDate(new Date())
    });
    // Invalidate cache
    itemsCache.clear();
    return;
  }

  await deleteDoc(doc(db, 'items', id));
  // Invalidate cache
  itemsCache.clear();
}

export async function getItemStockLevel(itemId: string): Promise<StockLevel | null> {
  const transactionsRef = collection(db, 'transactions');
  const q = query(transactionsRef, where('item_id', '==', itemId));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return {
      item_id: itemId,
      current_quantity: 0,
      average_unit_cost: 0,
      last_transaction_date: new Date(),
      total_value: 0
    };
  }

  let currentQuantity = 0;
  let totalCost = 0;
  let totalQuantityIn = 0;
  let lastTransactionDate = new Date(0);

  // Sort transactions by date in memory (newest first)
  const sortedDocs = snapshot.docs.sort((a, b) => {
    const dateA = a.data().transaction_date?.toDate ?
      a.data().transaction_date?.toDate() :
      new Date(a.data().transaction_date);
    const dateB = b.data().transaction_date?.toDate ?
      b.data().transaction_date?.toDate() :
      new Date(b.data().transaction_date);
    return dateB.getTime() - dateA.getTime();
  });

  sortedDocs.forEach(doc => {
    const transaction = doc.data();
    const transactionDate = transaction.transaction_date?.toDate ?
      transaction.transaction_date.toDate() :
      new Date(transaction.transaction_date || Date.now());

    if (transactionDate > lastTransactionDate) {
      lastTransactionDate = transactionDate;
    }

    if (transaction.type === 'stock_in') {
      currentQuantity += transaction.quantity;
      totalCost += transaction.total_value;
      totalQuantityIn += transaction.quantity;
    } else {
      currentQuantity -= transaction.quantity;
    }
  });

  const averageUnitCost = totalQuantityIn > 0 ? totalCost / totalQuantityIn : 0;
  const totalValue = currentQuantity * averageUnitCost;

  return {
    item_id: itemId,
    current_quantity: Math.max(0, currentQuantity),
    average_unit_cost: averageUnitCost,
    last_transaction_date: lastTransactionDate,
    total_value: totalValue
  };
}

export async function searchItems(searchQuery: string, categoryId?: string): Promise<Item[]> {
  const itemsRef = collection(db, 'items');
  let q = query(itemsRef, where('is_archived', '!=', true), orderBy('name'));

  if (categoryId) {
    q = query(itemsRef, where('category_id', '==', categoryId), where('is_archived', '!=', true), orderBy('name'));
  }

  const snapshot = await getDocs(q);

  let items = snapshot.docs.map(docSnapshot => {
    const itemData = docSnapshot.data();
    return {
      id: docSnapshot.id,
      ...itemData,
      current_quantity: itemData.current_quantity ?? 0,
      average_unit_cost: itemData.average_unit_cost ?? 0,
      total_value: (itemData.current_quantity ?? 0) * (itemData.average_unit_cost ?? 0),
      created_at: itemData.created_at?.toDate ? itemData.created_at.toDate() : new Date(itemData.created_at || Date.now()),
      updated_at: itemData.updated_at?.toDate ? itemData.updated_at.toDate() : new Date(itemData.updated_at || Date.now())
    } as Item;
  });

  // Client-side filtering for search (Firestore search is limited)
  if (searchQuery) {
    const term = searchQuery.toLowerCase();
    items = items.filter(item =>
      item.name.toLowerCase().includes(term) ||
      item.description?.toLowerCase().includes(term)
    );
  }

  // Solve N+1 for categories
  const categoryIds = [...new Set(items.map(item => item.category_id).filter(Boolean))];
  const categories: Record<string, any> = {};

  if (categoryIds.length > 0) {
    for (let i = 0; i < categoryIds.length; i += 30) {
      const chunk = categoryIds.slice(i, i + 30);
      const categoriesRef = collection(db, 'categories');
      const catQuery = query(categoriesRef, where('__name__', 'in', chunk));
      const catSnapshot = await getDocs(catQuery);
      catSnapshot.forEach(catDoc => {
        categories[catDoc.id] = { id: catDoc.id, ...catDoc.data() };
      });
    }
  }

  items.forEach(item => {
    if (item.category_id && categories[item.category_id]) {
      item.category = categories[item.category_id];
    }
  });

  return items;
}
export async function reconcileAllItemsStock(): Promise<{ updated: number; failed: number }> {
  try {
    const itemsRef = collection(db, 'items');
    const snapshot = await getDocs(itemsRef);
    let updatedCount = 0;
    let failedCount = 0;

    // Process items in batches of 500 (Firestore limit)
    const batches = [];
    let currentBatch = writeBatch(db);
    let countInBatch = 0;

    for (const itemDoc of snapshot.docs) {
      try {
        const stockLevel = await getItemStockLevel(itemDoc.id);
        if (stockLevel) {
          currentBatch.update(doc(db, 'items', itemDoc.id), {
            current_quantity: stockLevel.current_quantity,
            average_unit_cost: stockLevel.average_unit_cost,
            updated_at: Timestamp.fromDate(new Date())
          });
          countInBatch++;
          updatedCount++;

          if (countInBatch === 500) {
            batches.push(currentBatch.commit());
            currentBatch = writeBatch(db);
            countInBatch = 0;
          }
        }
      } catch (e) {
        console.error(`Failed to reconcile item ${itemDoc.id}:`, e);
        failedCount++;
      }
    }

    if (countInBatch > 0) {
      batches.push(currentBatch.commit());
    }

    await Promise.all(batches);
    invalidateItemsCache();
    return { updated: updatedCount, failed: failedCount };
  } catch (error) {
    console.error('Error in reconcileAllItemsStock:', error);
    throw error;
  }
}
