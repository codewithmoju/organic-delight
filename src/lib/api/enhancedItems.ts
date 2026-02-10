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
  runTransaction
} from 'firebase/firestore';
import { db } from '../firebase';
import { Item } from '../types';
import { invalidateItemsCache } from './items';

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

  // Use Firestore transaction to ensure data consistency
  const result = await runTransaction(db, async (transaction) => {
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

    // Check for duplicate barcode if provided
    if (itemData.barcode) {
      const barcodeQuery = query(itemsRef, where('barcode', '==', itemData.barcode));
      const barcodeSnapshot = await getDocs(barcodeQuery);

      if (!barcodeSnapshot.empty) {
        throw new Error('An item with this barcode already exists');
      }
    }

    // Check for duplicate SKU if provided
    if (itemData.sku) {
      const skuQuery = query(itemsRef, where('sku', '==', itemData.sku));
      const skuSnapshot = await getDocs(skuQuery);

      if (!skuSnapshot.empty) {
        throw new Error('An item with this SKU already exists');
      }
    }

    // Create the item
    const itemRef = doc(collection(db, 'items'));
    const itemDoc = {
      ...itemData,
      name: itemData.name.trim(),
      unit: itemData.unit || 'pcs',
      is_archived: false,
      created_at: Timestamp.fromDate(new Date()),
      updated_at: Timestamp.fromDate(new Date())
    };

    transaction.set(itemRef, itemDoc);

    // Create initial stock transaction if stock > 0
    if (initialStock > 0) {
      const transactionRef = doc(collection(db, 'transactions'));
      transaction.set(transactionRef, {
        item_id: itemRef.id,
        type: 'stock_in',
        quantity: initialStock,
        unit_price: itemData.unit_price,
        total_value: initialStock * itemData.unit_price,
        transaction_date: Timestamp.fromDate(new Date()),
        supplier_customer: itemData.supplier || 'Initial Stock',
        reference_number: `INIT-${itemRef.id.slice(-6).toUpperCase()}`,
        notes: 'Initial stock entry during product creation',
        created_by: itemData.created_by,
        created_at: Timestamp.fromDate(new Date())
      });
    }

    return {
      id: itemRef.id,
      ...itemDoc,
      created_at: new Date() as any,
      updated_at: new Date() as any
    };
  });

  // Invalidate items cache
  invalidateItemsCache();

  return result;
}

export async function getItemByBarcode(barcode: string): Promise<Item | null> {
  try {
    const itemsRef = collection(db, 'items');
    const q = query(itemsRef, where('barcode', '==', barcode), where('is_archived', '!=', true));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const itemDoc = snapshot.docs[0];
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
  try {
    const itemsRef = collection(db, 'items');
    const q = query(itemsRef, where('sku', '==', productId), where('is_archived', '!=', true));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const itemDoc = snapshot.docs[0];
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
  try {
    const itemsRef = collection(db, 'items');
    let q = query(itemsRef, where('is_archived', '!=', true), orderBy('name'));

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