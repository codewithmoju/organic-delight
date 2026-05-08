import {
  collection,
  doc,
  getDocs,
  query,
  where,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import { Item } from '../types';
import { requireCurrentUserId } from './userScope';
import { stampOrgId, getOrgScopeFilter, stripUndefined } from './orgScope';
import { useEntityStore } from '../store/entities';

export async function createItemWithInitialStock(itemData: {
  name: string;
  description: string;
  category_id: string;
  unit?: string;
  unit_price?: number;
  selling_price?: number;
  base_price?: number;
  sale_rate?: number;
  purchase_rate?: number;
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
  const scope = getOrgScopeFilter();
  const existingSnapshot = await getDocs(query(itemsRef, where(scope.field, '==', scope.value)));

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

  const basePrice = Number(itemData.base_price ?? itemData.purchase_rate ?? 0) || 0;
  const sellingPrice = Number(itemData.selling_price ?? itemData.unit_price ?? itemData.sale_rate ?? 0) || 0;

  const now = new Date();
  const itemRef = doc(collection(db, 'items'));
  const itemDoc = {
    ...stripUndefined(itemData),
    created_by: userId,
    name: itemData.name.trim(),
    unit: itemData.unit || 'pcs',
    is_archived: false,
    base_price: basePrice,
    selling_price: sellingPrice,
    purchase_rate: basePrice,
    sale_rate: sellingPrice,
    unit_price: sellingPrice,
    created_at: Timestamp.fromDate(now),
    updated_at: Timestamp.fromDate(now),
    current_quantity: initialStock || 0,
    total_value: (initialStock || 0) * sellingPrice,
    ...stampOrgId({}),
  };

  const batch = writeBatch(db);
  batch.set(itemRef, itemDoc);

  if (initialStock > 0) {
    const transactionRef = doc(collection(db, 'transactions'));
    batch.set(transactionRef, {
      item_id: itemRef.id,
      type: 'stock_in',
      quantity: initialStock,
      unit_price: basePrice,
      total_value: initialStock * basePrice,
      transaction_date: Timestamp.fromDate(now),
      supplier_customer: itemData.supplier || 'Initial Stock',
      reference_number: `INIT-${itemRef.id.slice(-6).toUpperCase()}`,
      notes: 'Initial stock entry during product creation',
      created_by: userId,
      created_at: Timestamp.fromDate(now),
      ...stampOrgId({})
    });
  }

  await batch.commit();

  const result = {
    id: itemRef.id,
    ...itemDoc,
    created_at: now as any,
    updated_at: now as any
  } as Item;

  // Update entity store
  useEntityStore.getState().addItem(result);

  return result;
}

export async function getItemByBarcode(barcode: string): Promise<Item | null> {
  // Search from entity store — zero network calls
  const storeItems = useEntityStore.getState().items.data;
  const normalizedBarcode = barcode.trim().toLowerCase();
  const found = storeItems.find(item =>
    item.barcode?.trim().toLowerCase() === normalizedBarcode &&
    item.is_archived !== true
  );
  return (found as Item) || null;
}

export async function getItemByProductId(productId: string): Promise<Item | null> {
  // Search from entity store — zero network calls
  const storeItems = useEntityStore.getState().items.data;
  const normalizedSku = productId.trim().toLowerCase();
  const found = storeItems.find(item =>
    item.sku?.trim().toLowerCase() === normalizedSku &&
    item.is_archived !== true
  );
  return (found as Item) || null;
}

export async function searchItemsEnhanced(searchQuery: string, searchType: 'name' | 'barcode' | 'sku' = 'name'): Promise<Item[]> {
  // Read from entity store — zero network calls, no N+1 category fetches
  const storeItems = useEntityStore.getState().items.data;
  const term = searchQuery.toLowerCase();

  const items = storeItems.filter(item => {
    if (item.is_archived === true) return false;

    switch (searchType) {
      case 'name':
        return item.name.toLowerCase().includes(term) ||
          item.description?.toLowerCase().includes(term);
      case 'barcode':
        return item.barcode?.toLowerCase().includes(term) || false;
      case 'sku':
        return item.sku?.toLowerCase().includes(term) || false;
      default:
        return false;
    }
  });

  return items.slice(0, 20) as Item[];
}