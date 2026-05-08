import {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  runTransaction,
  writeBatch,
  increment
} from 'firebase/firestore';
import { db } from '../firebase';
import { CartItem, BarcodeProduct, POSTransaction, POSSettings, BillType, SalesReport } from '../types';
import { DEFAULT_POS_SETTINGS } from '../constants/defaults';
import { requireCurrentUserId, assertOwnership } from './userScope';
import { stampOrgId, getOrgScopeFilter } from './orgScope';
import { useEntityStore } from '../store/entities';

// ── POS Settings & Bill Types TTL cache ────────────────────────────────────
const POS_CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const posSettingsCache = new Map<string, { data: POSSettings; at: number }>();
const billTypesCache = new Map<string, { data: BillType[]; at: number }>();

function getCachedPosSettings(key: string): POSSettings | null {
  const hit = posSettingsCache.get(key);
  if (hit && Date.now() - hit.at < POS_CACHE_TTL) return hit.data;
  return null;
}
function setCachedPosSettings(key: string, data: POSSettings) {
  posSettingsCache.set(key, { data, at: Date.now() });
}

function getCachedBillTypes(key: string): BillType[] | null {
  const hit = billTypesCache.get(key);
  if (hit && Date.now() - hit.at < POS_CACHE_TTL) return hit.data;
  return null;
}
function setCachedBillTypes(key: string, data: BillType[]) {
  billTypesCache.set(key, { data, at: Date.now() });
}

function resolveBasePrice(data: any): number {
  return Number(data?.base_price ?? data?.purchase_rate ?? data?.average_unit_cost ?? 0) || 0;
}

function resolveSellingPrice(data: any): number {
  return Number(data?.selling_price ?? data?.unit_price ?? data?.sale_rate ?? 0) || 0;
}

// POS Transaction Management
export async function createPOSTransaction(transactionData: {
  items: CartItem[];
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  payment_method: 'cash' | 'card' | 'digital';
  payment_amount: number;
  change_amount: number;
  cashier_id: string;
  customer_name?: string;
  customer_phone?: string;
  notes?: string;
  bill_type?: BillType;
  is_return?: boolean;
}): Promise<POSTransaction> {
  const userId = requireCurrentUserId();
  const transactionNumber = generateTransactionNumber();
  const affectsInventory = transactionData.bill_type?.affects_inventory ?? true;
  const affectsAccounting = transactionData.bill_type?.affects_accounting ?? true;

  // Helper to construct transaction data
  const constructTransaction = (id: string): POSTransaction => ({
    id,
    transaction_number: transactionNumber,
    items: transactionData.items.map(item => ({
      id: generateItemId(),
      item_id: item.item_id,
      item_name: item.name || 'Unknown Item',
      barcode: item.barcode || null,
      unit_price: item.unit_price || 0,
      quantity: item.quantity || 1,
      line_total: item.line_total || 0,
      discount_amount: 0,
      tax_rate: 0,
      unit: item.unit || 'pcs'
    })),
    subtotal: transactionData.subtotal,
    tax_amount: transactionData.tax_amount,
    discount_amount: transactionData.discount_amount,
    total_amount: transactionData.total_amount,
    payment_method: transactionData.payment_method,
    payment_amount: transactionData.payment_amount,
    change_amount: transactionData.change_amount,
    cashier_id: userId,
    customer_name: transactionData.customer_name || 'Walk-in Customer',
    customer_phone: transactionData.customer_phone || null,
    created_at: new Date(),
    status: 'completed',
    receipt_printed: false,
    notes: transactionData.notes || null,
    bill_type: transactionData.bill_type?.code || 'regular',
    affects_inventory: affectsInventory,
    affects_accounting: affectsAccounting,
    is_return: transactionData.is_return || false,
    ...stampOrgId({}),
  });

  try {
    return await runTransaction(db, async (transaction) => {
      // ── Phase 1: ALL reads first ──────────────────────────────────────────
      const itemReads: Array<{
        cartItem: CartItem;
        itemRef: ReturnType<typeof doc>;
        currentStock: number;
      }> = [];

      if (affectsInventory) {
        for (const cartItem of transactionData.items) {
          const itemRef = doc(db, 'items', cartItem.item_id);
          const itemDoc = await transaction.get(itemRef);

          if (!itemDoc.exists()) {
            throw new Error(`Item ${cartItem.name} not found`);
          }

          const currentStock = itemDoc.data().current_quantity ?? 0;

          if (currentStock < cartItem.quantity && !transactionData.is_return) {
            throw new Error(`Insufficient stock for ${cartItem.name}. Available: ${currentStock}`);
          }

          itemReads.push({ cartItem, itemRef, currentStock });
        }
      }

      // ── Phase 2: ALL writes after all reads ───────────────────────────────
      const posTransactionRef = doc(collection(db, 'pos_transactions'));
      const posTransaction = constructTransaction(posTransactionRef.id);
      const { id, ...posDataSave } = posTransaction;

      transaction.set(posTransactionRef, {
        ...posDataSave,
        created_at: Timestamp.fromDate(new Date())
      });

      if (affectsInventory) {
        for (const { cartItem, itemRef, currentStock } of itemReads) {
          const qtyChange = transactionData.is_return ? cartItem.quantity : -cartItem.quantity;
          transaction.update(itemRef, {
            current_quantity: currentStock + qtyChange,
            updated_at: Timestamp.fromDate(new Date())
          });
        }

        for (const item of posTransaction.items) {
          const invTransRef = doc(collection(db, 'transactions'));
          transaction.set(invTransRef, {
            type: transactionData.is_return ? 'stock_in' : 'stock_out',
            item_id: item.item_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_value: item.line_total,
            transaction_date: Timestamp.fromDate(new Date()),
            reference_id: posTransactionRef.id,
            reference_type: 'pos_sale',
            notes: `POS ${transactionData.is_return ? 'Return' : 'Sale'} - ${transactionNumber}`,
            created_by: userId,
            created_at: Timestamp.fromDate(new Date()),
            ...stampOrgId({}),
          });
        }
      }

      return posTransaction;
    }).then(result => {
      // Update entity store with new stock levels after successful transaction
      if (affectsInventory) {
        for (const cartItem of transactionData.items) {
          const storeItem = useEntityStore.getState().items.data.find(i => i.id === cartItem.item_id);
          if (storeItem) {
            const qtyChange = transactionData.is_return ? cartItem.quantity : -cartItem.quantity;
            useEntityStore.getState().updateItem(cartItem.item_id, {
              current_quantity: (storeItem.current_quantity ?? 0) + qtyChange,
              updated_at: new Date(),
            } as any);
          }
        }
      }
      return result;
    });
  } catch (error: any) {
    if (error.code === 'unavailable' || error.message?.includes('offline') || !navigator.onLine) {
      console.warn('POS Transaction failed (offline), falling back to WriteBatch');
      const batch = writeBatch(db);
      const posTransactionRef = doc(collection(db, 'pos_transactions'));
      const posTransaction = constructTransaction(posTransactionRef.id);
      const { id, ...posDataSave } = posTransaction;

      batch.set(posTransactionRef, {
        ...posDataSave,
        created_at: Timestamp.fromDate(new Date())
      });

      if (affectsInventory) {
        for (const item of posTransaction.items) {
          const itemRef = doc(db, 'items', item.item_id);
          const qtyChange = transactionData.is_return ? item.quantity : -item.quantity;

          batch.update(itemRef, {
            current_quantity: increment(qtyChange),
            updated_at: Timestamp.fromDate(new Date())
          });

          const invTransRef = doc(collection(db, 'transactions'));
          batch.set(invTransRef, {
            type: transactionData.is_return ? 'stock_in' : 'stock_out',
            item_id: item.item_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_value: item.line_total,
            transaction_date: Timestamp.fromDate(new Date()),
            reference_id: posTransactionRef.id,
            reference_type: 'pos_sale',
            notes: `POS ${transactionData.is_return ? 'Return' : 'Sale'} (Offline) - ${transactionNumber}`,
            created_by: userId,
            created_at: Timestamp.fromDate(new Date()),
            ...stampOrgId({}),
          });
        }
      }

      await batch.commit();

      // Update entity store with new stock levels after successful offline write
      if (affectsInventory) {
        for (const item of posTransaction.items) {
          const storeItem = useEntityStore.getState().items.data.find(i => i.id === item.item_id);
          if (storeItem) {
            const qtyChange = transactionData.is_return ? item.quantity : -item.quantity;
            useEntityStore.getState().updateItem(item.item_id, {
              current_quantity: (storeItem.current_quantity ?? 0) + qtyChange,
              updated_at: new Date(),
            } as any);
          }
        }
      }

      return posTransaction;
    }
    throw error;
  }
}

// Transaction History
export async function getPOSTransactions(limitCount?: number): Promise<POSTransaction[]> {
  const userId = requireCurrentUserId();
  const transactionsRef = collection(db, 'pos_transactions');
  let q = query(
    transactionsRef,
    where('cashier_id', '==', userId),
    orderBy('created_at', 'desc')
  );

  if (limitCount) {
    q = query(q, limit(limitCount));
  }

  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    created_at: doc.data().created_at?.toDate() || new Date(doc.data().created_at)
  })) as POSTransaction[];
}

// Cancel/Refund Transaction
export async function cancelPOSTransaction(transactionId: string, reason: string): Promise<void> {
  const userId = requireCurrentUserId();
  let cancelledTransaction: POSTransaction | null = null;

  await runTransaction(db, async (transaction) => {
    const posTransactionRef = doc(db, 'pos_transactions', transactionId);
    const posTransactionDoc = await transaction.get(posTransactionRef);

    if (!posTransactionDoc.exists()) {
      throw new Error('Transaction not found');
    }

    const posTransaction = posTransactionDoc.data() as POSTransaction;
    if (posTransaction.cashier_id !== userId) {
      throw new Error('Transaction not found');
    }

    if (posTransaction.status !== 'completed') {
      throw new Error('Transaction cannot be cancelled');
    }

    transaction.update(posTransactionRef, {
      status: 'cancelled',
      cancellation_reason: reason,
      cancelled_at: Timestamp.fromDate(new Date())
    });

    for (const item of posTransaction.items) {
      const itemRef = doc(db, 'items', item.item_id);

      const inventoryTransactionRef = doc(collection(db, 'transactions'));
      transaction.set(inventoryTransactionRef, {
        item_id: item.item_id,
        type: 'stock_in',
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_value: item.line_total,
        transaction_date: Timestamp.fromDate(new Date()),
        supplier_customer: 'Return/Cancellation',
        reference_number: `CANCEL-${posTransaction.transaction_number}`,
        notes: `Cancelled POS Transaction - ${reason}`,
        created_by: userId,
        created_at: Timestamp.fromDate(new Date()),
        pos_transaction_id: transactionId,
        ...stampOrgId({}),
      });

      if (posTransaction.affects_inventory !== false) {
        transaction.update(itemRef, {
          current_quantity: increment(item.quantity),
          updated_at: Timestamp.fromDate(new Date())
        });
      }
    }

    cancelledTransaction = posTransaction;
  });

  // Update entity store with restored stock levels
  if (cancelledTransaction) {
    const storeItems = useEntityStore.getState().items.data;
    for (const item of cancelledTransaction.items) {
      const storeItem = storeItems.find(i => i.id === item.item_id);
      if (storeItem && cancelledTransaction.affects_inventory !== false) {
        useEntityStore.getState().updateItem(item.item_id, {
          current_quantity: (storeItem.current_quantity ?? 0) + item.quantity,
          updated_at: new Date(),
        } as any);
      }
    }
  }
}

// Barcode Product Lookup — reads from entity store
export async function getProductByBarcode(barcode: string): Promise<BarcodeProduct | null> {
  const storeItems = useEntityStore.getState().items.data;
  const normalizedBarcode = String(barcode).trim();
  const found = storeItems.find(item =>
    item.barcode === normalizedBarcode && item.is_archived !== true
  );
  if (!found) return null;

  return {
    id: found.id,
    name: found.name,
    barcode: found.barcode,
    price: resolveSellingPrice(found),
    selling_price: resolveSellingPrice(found),
    base_price: resolveBasePrice(found),
    stock: found.current_quantity ?? 0,
    category: found.category?.name
  };
}

// Get current stock level — reads from entity store
export async function getItemCurrentStock(itemId: string): Promise<number> {
  const storeItems = useEntityStore.getState().items.data;
  const found = storeItems.find(item => item.id === itemId);
  return found?.current_quantity ?? 0;
}

// Search products — reads from entity store, zero network calls
export async function searchProducts(searchQuery: string): Promise<BarcodeProduct[]> {
  const normalizedQuery = String(searchQuery || '').trim();
  if (!normalizedQuery) {
    return [];
  }

  const storeItems = useEntityStore.getState().items.data;
  const searchTerm = normalizedQuery.toLowerCase();

  // First try exact barcode match
  const barcodeMatches = storeItems
    .filter(item => item.is_archived !== true && item.barcode === normalizedQuery)
    .map(item => ({
      id: item.id,
      name: String(item.name || ''),
      barcode: String(item.barcode || ''),
      price: resolveSellingPrice(item),
      selling_price: resolveSellingPrice(item),
      base_price: resolveBasePrice(item),
      stock: item.current_quantity ?? 0,
      category: item.category?.name
    } as BarcodeProduct));

  if (barcodeMatches.length > 0 || normalizedQuery.length < 2) {
    return barcodeMatches.slice(0, 20);
  }

  // Full text search from store
  const products = storeItems
    .filter(item => {
      if (item.is_archived === true) return false;
      const name = String(item.name || '');
      const description = String(item.description || '');
      const barcode = String(item.barcode || '');
      const sku = String(item.sku || '');
      return name.toLowerCase().includes(searchTerm) ||
        description.toLowerCase().includes(searchTerm) ||
        barcode.includes(normalizedQuery) ||
        sku.toLowerCase().includes(searchTerm);
    })
    .map(item => ({
      id: item.id,
      name: String(item.name || ''),
      barcode: String(item.barcode || ''),
      price: resolveSellingPrice(item),
      selling_price: resolveSellingPrice(item),
      base_price: resolveBasePrice(item),
      stock: item.current_quantity ?? 0,
      category: item.category?.name
    } as BarcodeProduct));

  products.sort((a, b) => a.name.localeCompare(b.name));
  return products.slice(0, 20);
}

// POS Settings
export async function getPOSSettings(): Promise<POSSettings> {
  const userId = requireCurrentUserId();
  const cached = getCachedPosSettings(userId);
  if (cached) return cached;

  const settingsRef = doc(db, 'pos_settings', userId);
  const docSnap = await getDoc(settingsRef);

  const settings = docSnap.exists()
    ? ({ id: docSnap.id, ...docSnap.data() } as unknown as POSSettings)
    : DEFAULT_POS_SETTINGS;

  setCachedPosSettings(userId, settings);
  return settings;
}

export async function updatePOSSettings(settings: Partial<POSSettings>): Promise<void> {
  const userId = requireCurrentUserId();
  const settingsRef = doc(db, 'pos_settings', userId);
  await setDoc(settingsRef, {
    ...settings,
    created_by: userId,
    updated_at: Timestamp.fromDate(new Date())
  }, { merge: true });
}

// Quick Access Products — reads from entity store
export async function getQuickAccessProducts(itemIds: string[]): Promise<BarcodeProduct[]> {
  if (!itemIds || itemIds.length === 0) return [];

  const storeItems = useEntityStore.getState().items.data;
  const idSet = new Set(itemIds);

  return storeItems
    .filter(item => idSet.has(item.id) && item.is_archived !== true)
    .map(item => ({
      id: item.id,
      name: item.name,
      barcode: item.barcode,
      price: resolveSellingPrice(item),
      selling_price: resolveSellingPrice(item),
      base_price: resolveBasePrice(item),
      stock: item.current_quantity || 0,
      category: item.category_id
    } as BarcodeProduct));
}

// Toggle Quick Access Item
export async function toggleQuickAccessItem(itemId: string): Promise<string[]> {
  const userId = requireCurrentUserId();
  const settingsRef = doc(db, 'pos_settings', userId);
  const settingsSnap = await getDoc(settingsRef);

  let currentItems: string[] = [];
  if (settingsSnap.exists()) {
    const data = settingsSnap.data() as POSSettings;
    currentItems = data.quick_access_items || [];
  }

  const index = currentItems.indexOf(itemId);
  if (index >= 0) {
    currentItems.splice(index, 1);
  } else {
    currentItems.push(itemId);
  }

  await setDoc(settingsRef, { quick_access_items: currentItems }, { merge: true });
  return currentItems;
}

// Bill Types
export async function getBillTypes(): Promise<BillType[]> {
  const cacheKey = 'bill_types_active';
  const cached = getCachedBillTypes(cacheKey);
  if (cached) return cached;

  const q = query(collection(db, 'bill_types'), where('active', '==', true));
  const snapshot = await getDocs(q);
  const types = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BillType));
  setCachedBillTypes(cacheKey, types);
  return types;
}

// Sales Report helper
export async function getDailySalesReport(date: Date, cashierId?: string): Promise<SalesReport> {
  const userId = requireCurrentUserId();
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  let q = query(
    collection(db, 'pos_transactions'),
    where('created_at', '>=', Timestamp.fromDate(startOfDay)),
    where('created_at', '<=', Timestamp.fromDate(endOfDay))
  );

  q = query(q, where('cashier_id', '==', cashierId || userId));

  const snapshot = await getDocs(q);
  const transactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as POSTransaction));

  return {
    date: startOfDay,
    total_sales: transactions.reduce((acc, t) => acc + t.total_amount, 0),
    total_transactions: transactions.length,
    average_transaction: transactions.length > 0 ? transactions.reduce((acc, t) => acc + t.total_amount, 0) / transactions.length : 0,
    top_selling_items: [], // Simplified for now
    payment_methods: [] // Simplified for now
  } as unknown as SalesReport;
}

// Add barcode to item
export async function addBarcodeToItem(itemId: string, barcode: string): Promise<void> {
  const itemRef = doc(db, 'items', itemId);
  const itemDoc = await getDoc(itemRef);
  assertOwnership(itemDoc.exists() ? itemDoc.data() : null, 'Item');

  await updateDoc(itemRef, {
    barcode,
    updated_at: Timestamp.fromDate(new Date())
  });
}

// Get items with barcodes — reads from entity store
export async function getItemsWithBarcodes(): Promise<BarcodeProduct[]> {
  const storeItems = useEntityStore.getState().items.data;

  return storeItems
    .filter(item => item.barcode != null && item.is_archived !== true)
    .map(item => ({
      id: item.id,
      name: item.name,
      barcode: item.barcode,
      price: resolveSellingPrice(item),
      selling_price: resolveSellingPrice(item),
      base_price: resolveBasePrice(item),
      stock: item.current_quantity || 0,
      category: item.category_id
    })) as BarcodeProduct[];
}

// Helpers
function generateTransactionNumber() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `TRX-${date}-${random}`;
}

function generateItemId() {
  return Math.random().toString(36).substr(2, 9);
}