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
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import { Item } from '../types';
import { invalidateItemsCache } from './items';
import { requireCurrentUserId } from './userScope';

export async function createItemWithInitialStock(itemData: {
  name: string;
  description: string;
  category_id: string;
  unit?: string;
  unit_price: number;
  barcode?: string;
  sku?: string;
  supplier?: string;
  location?: string;
  reorder_point: number;
  created_by: string;
}, initialStock: number): Promise<Item> {
  const userId = requireCurrentUserId();

  // Check for duplicates only within current user's scope.
  const itemsRef = collection(db, 'items');
  const existingSnapshot = await getDocs(query(itemsRef, where('created_by', '==', userId)));

  const normalizedName = itemData.name.trim().toLowerCase();
  const normalizedBarcode = (itemData.barcode || '').trim();
  const normalizedSku = (itemData.sku || '').trim().toLowerCase();

  const duplicateName = existingSnapshot.docs.some((docSnap) => {
    const data = docSnap.data() as any;
    return (
      String(data.category_id || '') === String(itemData.category_id || '') &&
      String(data.name || '').trim().toLowerCase() === normalizedName
    );
  });

  if (duplicateName) {
    throw new Error('An item with this name already exists in this category');
  }

  if (normalizedBarcode) {
    const duplicateBarcode = existingSnapshot.docs.some((docSnap) => {
      const data = docSnap.data() as any;
      return String(data.barcode || '').trim() === normalizedBarcode;
    });

    if (duplicateBarcode) {
      throw new Error('An item with this barcode already exists');
    }
  }

  if (normalizedSku) {
    const duplicateSku = existingSnapshot.docs.some((docSnap) => {
      const data = docSnap.data() as any;
      return String(data.sku || '').trim().toLowerCase() === normalizedSku;
    });

    if (duplicateSku) {
      throw new Error('An item with this SKU already exists');
    }
  }

  const now = new Date();
  const itemRef = doc(collection(db, 'items'));
  const itemDoc = {
    ...itemData,
    created_by: userId,
    name: itemData.name.trim(),
    unit: itemData.unit || 'pcs',
    is_archived: false,
    created_at: Timestamp.fromDate(now),
    updated_at: Timestamp.fromDate(now),
    current_quantity: initialStock || 0,
    total_value: (initialStock || 0) * itemData.unit_price
  };

  const batch = writeBatch(db);
  batch.set(itemRef, itemDoc);

  if (initialStock > 0) {
    const transactionRef = doc(collection(db, 'transactions'));
    batch.set(transactionRef, {
      item_id: itemRef.id,
      type: 'stock_in',
      quantity: initialStock,
      unit_price: itemData.unit_price,
      total_value: initialStock * itemData.unit_price,
      transaction_date: Timestamp.fromDate(now),
      supplier_customer: itemData.supplier || 'Initial Stock',
      reference_number: `INIT-${itemRef.id.slice(-6).toUpperCase()}`,
      notes: 'Initial stock entry during product creation',
      created_by: userId,
      created_at: Timestamp.fromDate(now)
    });
  }

  await batch.commit();

  const result = {
    id: itemRef.id,
    ...itemDoc,
    created_at: now as any,
    updated_at: now as any
  } as Item;

  // Invalidate items cache
  invalidateItemsCache();

  return result;
}

export async function getItemByBarcode(barcode: string): Promise<Item | null> {
  const userId = requireCurrentUserId();
  try {
    const itemsRef = collection(db, 'items');
    const q = query(itemsRef, where('created_by', '==', userId), where('barcode', '==', barcode));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const itemDoc = snapshot.docs.find((docSnap) => {
      const data = docSnap.data() as any;
      return data.created_by === userId && data.is_archived !== true;
    });
    if (!itemDoc) {
      return null;
    }
    const itemData = itemDoc.data();

    return {
      id: itemDoc.id,
      ...itemData,
      created_at: itemData.created_at?.toDate ? itemData.created_at.toDate() : new Date(itemData.created_at || Date.now()),
      updated_at: itemData.updated_at?.toDate ? itemData.updated_at.toDate() : new Date(itemData.updated_at || Date.now())
    } as Item;
  } catch (error) {
    console.error('Error fetching item by barcode:', error);
    return null;
  }
}

export async function getItemByProductId(productId: string): Promise<Item | null> {
  const userId = requireCurrentUserId();
  try {
    const itemsRef = collection(db, 'items');
    const q = query(itemsRef, where('created_by', '==', userId), where('sku', '==', productId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const itemDoc = snapshot.docs.find((docSnap) => {
      const data = docSnap.data() as any;
      return data.created_by === userId && data.is_archived !== true;
    });
    if (!itemDoc) {
      return null;
    }
    const itemData = itemDoc.data();

    return {
      id: itemDoc.id,
      ...itemData,
      created_at: itemData.created_at?.toDate ? itemData.created_at.toDate() : new Date(itemData.created_at || Date.now()),
      updated_at: itemData.updated_at?.toDate ? itemData.updated_at.toDate() : new Date(itemData.updated_at || Date.now())
    } as Item;
  } catch (error) {
    console.error('Error fetching item by product ID:', error);
    return null;
  }
}

export async function searchItemsEnhanced(searchQuery: string, searchType: 'name' | 'barcode' | 'sku' = 'name'): Promise<Item[]> {
  const userId = requireCurrentUserId();
  try {
    const itemsRef = collection(db, 'items');
    const q = query(itemsRef, where('created_by', '==', userId), orderBy('name'));

    const snapshot = await getDocs(q);

    const items = [];
    for (const docSnapshot of snapshot.docs) {
      const itemData = docSnapshot.data();
      if ((itemData as any).is_archived === true || (itemData as any).created_by !== userId) {
        continue;
      }
      const item = {
        id: docSnapshot.id,
        ...itemData,
        created_at: itemData.created_at?.toDate ? itemData.created_at.toDate() : new Date(itemData.created_at || Date.now()),
        updated_at: itemData.updated_at?.toDate ? itemData.updated_at.toDate() : new Date(itemData.updated_at || Date.now())
      } as Item;

      // Client-side filtering based on search type
      let matches = false;
      const query = searchQuery.toLowerCase();

      switch (searchType) {
        case 'name':
          matches = item.name.toLowerCase().includes(query) ||
            item.description?.toLowerCase().includes(query);
          break;
        case 'barcode':
          matches = item.barcode?.toLowerCase().includes(query) || false;
          break;
        case 'sku':
          matches = item.sku?.toLowerCase().includes(query) || false;
          break;
      }

      if (matches) {
        // Get category data
        if (item.category_id) {
          const categoryDoc = await getDoc(doc(db, 'categories', item.category_id));
          if (categoryDoc.exists()) {
            item.category = { id: categoryDoc.id, ...categoryDoc.data() };
          }
        }

        items.push(item);
      }
    }

    return items.slice(0, 20); // Limit results for performance
  } catch (error) {
    console.error('Error searching items:', error);
    return [];
  }
}