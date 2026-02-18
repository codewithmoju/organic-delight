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
    cashier_id: transactionData.cashier_id,
    customer_name: transactionData.customer_name || 'Walk-in Customer',
    customer_phone: transactionData.customer_phone || null,
    created_at: new Date(),
    status: 'completed',
    receipt_printed: false,
    notes: transactionData.notes || null,
    bill_type: transactionData.bill_type?.code || 'regular',
    affects_inventory: affectsInventory,
    affects_accounting: affectsAccounting,
    is_return: transactionData.is_return || false
  });

  try {
    return await runTransaction(db, async (transaction) => {
      if (affectsInventory) {
        for (const cartItem of transactionData.items) {
          const itemRef = doc(db, 'items', cartItem.item_id);
          const itemDoc = await transaction.get(itemRef);

          if (!itemDoc.exists()) {
            throw new Error(`Item ${cartItem.name} not found`);
          }

          const itemData = itemDoc.data();
          const currentStock = itemData.current_quantity ?? 0;

          if (currentStock < cartItem.quantity && !transactionData.is_return) {
            throw new Error(`Insufficient stock for ${cartItem.name}. Available: ${currentStock}`);
          }

          const qtyChange = transactionData.is_return ? cartItem.quantity : -cartItem.quantity;
          transaction.update(itemRef, {
            current_quantity: currentStock + qtyChange,
            updated_at: Timestamp.fromDate(new Date())
          });
        }
      }

      const posTransactionRef = doc(collection(db, 'pos_transactions'));
      const posTransaction = constructTransaction(posTransactionRef.id);
      const { id, ...posDataSave } = posTransaction;

      transaction.set(posTransactionRef, {
        ...posDataSave,
        created_at: Timestamp.fromDate(new Date())
      });

      if (affectsInventory) {
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
            created_at: Timestamp.fromDate(new Date())
          });
        }
      }

      return posTransaction;
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
            created_at: Timestamp.fromDate(new Date())
          });
        }
      }

      await batch.commit();
      return posTransaction;
    }
    throw error;
  }
}

// Transaction History
export async function getPOSTransactions(limitCount?: number): Promise<POSTransaction[]> {
  const transactionsRef = collection(db, 'pos_transactions');
  let q = query(transactionsRef, orderBy('created_at', 'desc'));

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
  await runTransaction(db, async (transaction) => {
    const posTransactionRef = doc(db, 'pos_transactions', transactionId);
    const posTransactionDoc = await transaction.get(posTransactionRef);

    if (!posTransactionDoc.exists()) {
      throw new Error('Transaction not found');
    }

    const posTransaction = posTransactionDoc.data() as POSTransaction;

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
        created_at: Timestamp.fromDate(new Date()),
        pos_transaction_id: transactionId
      });

      if (posTransaction.affects_inventory !== false) {
        transaction.update(itemRef, {
          current_quantity: increment(item.quantity),
          updated_at: Timestamp.fromDate(new Date())
        });
      }
    }
  });
}

// Barcode Product Lookup
export async function getProductByBarcode(barcode: string): Promise<BarcodeProduct | null> {
  try {
    const itemsRef = collection(db, 'items');
    const q = query(itemsRef, where('barcode', '==', barcode), where('is_archived', '!=', true));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const itemDoc = snapshot.docs[0];
    const itemData = itemDoc.data();
    const currentStock = itemData.current_quantity ?? 0;

    return {
      id: itemDoc.id,
      name: itemData.name,
      barcode: itemData.barcode,
      price: itemData.unit_price || itemData.sale_rate || 0,
      stock: currentStock,
      category: itemData.category?.name
    };
  } catch (error) {
    console.error('Error fetching product by barcode:', error);
    return null;
  }
}

// Get current stock level
export async function getItemCurrentStock(itemId: string): Promise<number> {
  try {
    const itemDoc = await getDoc(doc(db, 'items', itemId));
    if (!itemDoc.exists()) return 0;
    return itemDoc.data().current_quantity ?? 0;
  } catch (error) {
    console.error('Error fetching current stock:', error);
    return 0;
  }
}

// Search products
export async function searchProducts(searchQuery: string): Promise<BarcodeProduct[]> {
  const itemsRef = collection(db, 'items');
  const q = query(itemsRef, where('is_archived', '!=', true), orderBy('name'));
  const snapshot = await getDocs(q);

  const products: BarcodeProduct[] = [];
  const searchTerm = searchQuery.toLowerCase();

  for (const itemDoc of snapshot.docs) {
    const itemData = itemDoc.data() as any;
    if (itemData.name.toLowerCase().includes(searchTerm) ||
      itemData.description?.toLowerCase().includes(searchTerm) ||
      itemData.barcode?.includes(searchQuery)) {

      products.push({
        id: itemDoc.id,
        name: itemData.name,
        barcode: itemData.barcode || '',
        price: itemData.unit_price || itemData.sale_rate || 0,
        stock: itemData.current_quantity ?? 0,
        category: itemData.category?.name
      });
    }
  }
  return products.slice(0, 20);
}

// POS Settings
export async function getPOSSettings(): Promise<POSSettings> {
  const settingsRef = doc(db, 'pos_settings', 'default');
  const docSnap = await getDoc(settingsRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as unknown as POSSettings;
  } else {
    return DEFAULT_POS_SETTINGS;
  }
}

export async function updatePOSSettings(settings: Partial<POSSettings>): Promise<void> {
  const settingsRef = doc(db, 'pos_settings', 'default');
  await setDoc(settingsRef, {
    ...settings,
    updated_at: Timestamp.fromDate(new Date())
  }, { merge: true });
}

// Quick Access Products
export async function getQuickAccessProducts(itemIds: string[]): Promise<BarcodeProduct[]> {
  if (!itemIds || itemIds.length === 0) return [];

  try {
    const productPromises = itemIds.map(async (id) => {
      const docRef = doc(db, 'items', id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        return {
          id: snap.id,
          name: data.name,
          barcode: data.barcode,
          price: data.unit_price || data.sale_rate || 0,
          stock: data.current_quantity || 0,
          category: data.category_id
        } as BarcodeProduct;
      }
      return null;
    });

    const results = await Promise.all(productPromises);
    return results.filter((p): p is BarcodeProduct => p !== null);
  } catch (error) {
    console.error('Error fetching quick access products:', error);
    return [];
  }
}

// Toggle Quick Access Item
export async function toggleQuickAccessItem(itemId: string): Promise<string[]> {
  const settingsRef = doc(db, 'pos_settings', 'default');
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
  const q = query(collection(db, 'bill_types'), where('active', '==', true));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BillType));
}

// Sales Report helper
export async function getDailySalesReport(date: Date, cashierId?: string): Promise<SalesReport> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  let q = query(
    collection(db, 'pos_transactions'),
    where('created_at', '>=', Timestamp.fromDate(startOfDay)),
    where('created_at', '<=', Timestamp.fromDate(endOfDay))
  );

  if (cashierId) {
    q = query(q, where('cashier_id', '==', cashierId));
  }

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
  await updateDoc(doc(db, 'items', itemId), {
    barcode,
    updated_at: Timestamp.fromDate(new Date())
  });
}

// Get items with barcodes
export async function getItemsWithBarcodes(): Promise<BarcodeProduct[]> {
  const itemsRef = collection(db, 'items');
  const q = query(itemsRef, where('barcode', '!=', null));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      barcode: data.barcode,
      price: data.unit_price || data.sale_rate || 0,
      stock: data.current_quantity || 0,
      category: data.category_id
    };
  }) as BarcodeProduct[];
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