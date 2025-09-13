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
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { Item, StockLevel } from '../types';

// Simple cache for frequently accessed data
const itemsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

function isCacheValid(timestamp: number): boolean {
  return Date.now() - timestamp < CACHE_DURATION;
}
export async function getItems(limitCount?: number, lastDoc?: DocumentSnapshot) {
  const cacheKey = `items-${limitCount || 'all'}-${lastDoc?.id || 'start'}`;
  const cached = itemsCache.get(cacheKey);
  
  if (cached && isCacheValid(cached.timestamp)) {
    return cached.data;
  }

  const itemsRef = collection(db, 'items');
  let q = query(itemsRef, where('is_archived', '!=', true), orderBy('name'));
  
  if (limitCount) {
    q = query(q, limit(limitCount));
  }
  
  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }
  
  const snapshot = await getDocs(q);
  
  const items = [];
  for (const docSnapshot of snapshot.docs) {
    const itemData = docSnapshot.data();
    const item = { 
      id: docSnapshot.id, 
      ...itemData,
      created_at: itemData.created_at?.toDate ? itemData.created_at.toDate() : new Date(itemData.created_at || Date.now()),
      updated_at: itemData.updated_at?.toDate ? itemData.updated_at.toDate() : new Date(itemData.updated_at || Date.now())
    } as Item;
    
    // Get category data
    if (item.category_id) {
      const categoryDoc = await getDoc(doc(db, 'categories', item.category_id));
      if (categoryDoc.exists()) {
        item.category = { id: categoryDoc.id, ...categoryDoc.data() };
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
    
    items.push(item);
  }
  
  const result = { items, lastDoc: snapshot.docs[snapshot.docs.length - 1] };
  
  // Cache the result
  itemsCache.set(cacheKey, { data: result, timestamp: Date.now() });
  
  return result;
}

export async function getItemsByCategory(categoryId: string): Promise<Item[]> {
  const itemsRef = collection(db, 'items');
  const q = query(itemsRef, where('category_id', '==', categoryId), where('is_archived', '!=', true), orderBy('name'));
  const snapshot = await getDocs(q);
  
  const items = [];
  for (const docSnapshot of snapshot.docs) {
    const itemData = docSnapshot.data();
    const item = { 
      id: docSnapshot.id, 
      ...itemData,
      created_at: itemData.created_at?.toDate ? itemData.created_at.toDate() : new Date(itemData.created_at || Date.now()),
      updated_at: itemData.updated_at?.toDate ? itemData.updated_at.toDate() : new Date(itemData.updated_at || Date.now())
    } as Item;
    
    // Get stock level data
    const stockData = await getItemStockLevel(item.id);
    if (stockData) {
      item.current_quantity = stockData.current_quantity;
      item.average_unit_cost = stockData.average_unit_cost;
      item.last_transaction_date = stockData.last_transaction_date;
      item.total_value = stockData.total_value;
    }
    
    items.push(item);
  }
  
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
      item.category = { id: categoryDoc.id, ...categoryDoc.data() };
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
  unit_price?: number;
  barcode?: string;
  sku?: string;
  supplier?: string;
  location?: string;
  reorder_point?: number;
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
    unit_price: itemData.unit_price || 0,
    barcode: itemData.barcode || null,
    sku: itemData.sku || null,
    supplier: itemData.supplier || null,
    location: itemData.location || null,
    reorder_point: itemData.reorder_point || 10,
    is_archived: false,
    created_at: Timestamp.fromDate(new Date()),
    updated_at: Timestamp.fromDate(new Date())
  });
  
  console.log('Item created with ID:', docRef.id);
  return getItem(docRef.id);
}

export async function updateItem(id: string, itemData: {
  name?: string;
  description?: string;
  category_id?: string;
  unit_price?: number;
  barcode?: string;
  sku?: string;
  supplier?: string;
  location?: string;
  reorder_point?: number;
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
    return;
  }
  
  await deleteDoc(doc(db, 'items', id));
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
  
  const items = [];
  for (const docSnapshot of snapshot.docs) {
    const itemData = docSnapshot.data();
    const item = { 
      id: docSnapshot.id, 
      ...itemData,
      created_at: itemData.created_at?.toDate ? itemData.created_at.toDate() : new Date(itemData.created_at || Date.now()),
      updated_at: itemData.updated_at?.toDate ? itemData.updated_at.toDate() : new Date(itemData.updated_at || Date.now())
    } as Item;
    
    // Client-side filtering for search
    if (searchQuery && 
        !item.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !item.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
      continue;
    }
    
    // Get category data
    if (item.category_id) {
      const categoryDoc = await getDoc(doc(db, 'categories', item.category_id));
      if (categoryDoc.exists()) {
        item.category = { id: categoryDoc.id, ...categoryDoc.data() };
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
    
    items.push(item);
  }
  
  return items;
}