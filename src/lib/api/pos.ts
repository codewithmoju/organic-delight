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
  runTransaction
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

  // Use Firestore transaction to ensure data consistency
  return await runTransaction(db, async (transaction) => {
    // Check stock availability for all items if inventory is affected
    if (affectsInventory) {
      for (const cartItem of transactionData.items) {
        const itemRef = doc(db, 'items', cartItem.item_id);
        const itemDoc = await transaction.get(itemRef);

        if (!itemDoc.exists()) {
          throw new Error(`Item ${cartItem.name} not found`);
        }

        const itemData = itemDoc.data();
        const currentStock = itemData.current_quantity ?? 0;

        if (currentStock < cartItem.quantity) {
          throw new Error(`Insufficient stock for ${cartItem.name}. Available: ${currentStock}`);
        }

        // Update item stock atomically
        transaction.update(itemRef, {
          current_quantity: currentStock - cartItem.quantity,
          updated_at: Timestamp.fromDate(new Date())
        });
      }
    }

    // ... rest of the code for creating pos_transactions and inventory transactions ...
    // (I'll keep the block as is but ensure I handle the cancellation too)

    // Create POS transaction
    const posTransactionRef = doc(collection(db, 'pos_transactions'));
    const posTransactionData: Omit<POSTransaction, 'id'> = {
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
    };

    transaction.set(posTransactionRef, {
      ...posTransactionData,
      created_at: Timestamp.fromDate(new Date())
    });

    // Create inventory transactions for each item ONLY if affects_inventory is true
    if (affectsInventory) {
      for (const cartItem of transactionData.items) {
        const inventoryTransactionRef = doc(collection(db, 'transactions'));
        transaction.set(inventoryTransactionRef, {
          item_id: cartItem.item_id,
          type: 'stock_out',
          quantity: cartItem.quantity,
          unit_price: cartItem.unit_price,
          total_value: cartItem.line_total,
          transaction_date: Timestamp.fromDate(new Date()),
          supplier_customer: transactionData.customer_name || 'Walk-in Customer',
          reference_number: transactionNumber,
          notes: `POS Sale - Transaction #${transactionNumber}`,
          created_by: transactionData.cashier_id,
          created_at: Timestamp.fromDate(new Date()),
          pos_transaction_id: posTransactionRef.id
        });
      }
    }

    return {
      id: posTransactionRef.id,
      ...posTransactionData
    };
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

    // Get current stock level
    const currentStock = await getItemCurrentStock(itemDoc.id);

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

// Get current stock level for an item
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

// Search products for manual entry
// Search products for manual entry
export async function searchProducts(searchQuery: string): Promise<BarcodeProduct[]> {
  const itemsRef = collection(db, 'items');
  const q = query(itemsRef, where('is_archived', '!=', true), orderBy('name'));
  const snapshot = await getDocs(q);

  const products: BarcodeProduct[] = [];
  const searchTerm = searchQuery.toLowerCase();

  for (const itemDoc of snapshot.docs) {
    const itemData = itemDoc.data() as any;

    // Client-side filtering
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

  return products.slice(0, 20); // Limit results
}

// POS Settings Management
// ... (rest remains unchanged)



// POS Settings Management
export async function getPOSSettings(): Promise<POSSettings> {
  try {
    const settingsDoc = await getDoc(doc(db, 'pos_settings', 'default'));

    if (settingsDoc.exists()) {
      return settingsDoc.data() as POSSettings;
    }

    // Seed default settings if they don't exist
    await setDoc(doc(db, 'pos_settings', 'default'), {
      ...DEFAULT_POS_SETTINGS,
      created_at: Timestamp.fromDate(new Date())
    });

    return DEFAULT_POS_SETTINGS;
  } catch (error) {
    console.warn('Error loading POS settings, using defaults:', error);
    // Return default settings as fallback
    return DEFAULT_POS_SETTINGS;
  }
}

export async function updatePOSSettings(settings: Partial<POSSettings>): Promise<void> {
  await setDoc(doc(db, 'pos_settings', 'default'), {
    ...settings,
    updated_at: Timestamp.fromDate(new Date())
  }, { merge: true });
}

// Sales Reporting
export async function getDailySalesReport(date: Date): Promise<SalesReport> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  try {
    const transactionsRef = collection(db, 'pos_transactions');
    const q = query(
      transactionsRef,
      where('status', '==', 'completed'),
      where('created_at', '>=', Timestamp.fromDate(startOfDay)),
      where('created_at', '<=', Timestamp.fromDate(endOfDay)),
      orderBy('created_at', 'desc')
    );

    const snapshot = await getDocs(q);

    let totalSales = 0;
    let totalTransactions = 0;
    const itemSales: { [key: string]: { quantity: number; revenue: number } } = {};
    const paymentMethods: { [key: string]: { count: number; amount: number } } = {};

    snapshot.docs.forEach(doc => {
      const transaction = doc.data() as POSTransaction;
      totalSales += transaction.total_amount;
      totalTransactions++;

      // Track payment methods
      if (!paymentMethods[transaction.payment_method]) {
        paymentMethods[transaction.payment_method] = { count: 0, amount: 0 };
      }
      paymentMethods[transaction.payment_method].count++;
      paymentMethods[transaction.payment_method].amount += transaction.total_amount;

      // Track item sales
      transaction.items.forEach(item => {
        if (!itemSales[item.item_name]) {
          itemSales[item.item_name] = { quantity: 0, revenue: 0 };
        }
        itemSales[item.item_name].quantity += item.quantity;
        itemSales[item.item_name].revenue += item.line_total;
      });
    });

    const topSellingItems = Object.entries(itemSales)
      .map(([name, data]) => ({
        item_name: name,
        quantity_sold: data.quantity,
        revenue: data.revenue
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    const paymentMethodsArray = Object.entries(paymentMethods)
      .map(([method, data]) => ({
        method,
        count: data.count,
        amount: data.amount
      }));

    return {
      date,
      total_sales: totalSales,
      total_transactions: totalTransactions,
      average_transaction: totalTransactions > 0 ? totalSales / totalTransactions : 0,
      top_selling_items: topSellingItems,
      payment_methods: paymentMethodsArray
    };
  } catch (error) {
    console.warn('Error fetching sales report, returning empty data:', error);
    // Return empty report data if query fails
    return {
      date,
      total_sales: 0,
      total_transactions: 0,
      average_transaction: 0,
      top_selling_items: [],
      payment_methods: []
    };
  }
}

// Transaction History
export async function getPOSTransactions(limitCount?: number) {
  const transactionsRef = collection(db, 'pos_transactions');
  let q = query(transactionsRef, orderBy('created_at', 'desc'));

  if (limitCount) {
    q = query(q, limit(limitCount));
  }

  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    created_at: doc.data().created_at?.toDate ? doc.data().created_at.toDate() : new Date(doc.data().created_at)
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

    // Update POS transaction status
    transaction.update(posTransactionRef, {
      status: 'cancelled',
      cancellation_reason: reason,
      cancelled_at: Timestamp.fromDate(new Date())
    });

    // Create reverse inventory transactions and update stock
    for (const item of posTransaction.items) {
      const itemRef = doc(db, 'items', item.item_id);
      const itemDoc = await transaction.get(itemRef);

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
        created_by: posTransaction.cashier_id,
        created_at: Timestamp.fromDate(new Date()),
        pos_transaction_id: transactionId
      });

      if (posTransaction.affects_inventory !== false) {
        if (itemDoc.exists()) {
          const currentStock = itemDoc.data().current_quantity ?? 0;
          transaction.update(itemRef, {
            current_quantity: currentStock + item.quantity,
            updated_at: Timestamp.fromDate(new Date())
          });
        }
      }
    }
  });
}

// Utility functions
function generateTransactionNumber(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const time = now.getTime().toString().slice(-6);

  return `POS${year}${month}${day}${time}`;
}

function generateItemId(): string {
  return Math.random().toString(36).substr(2, 9);
}

// Add barcode to existing item
export async function addBarcodeToItem(itemId: string, barcode: string): Promise<void> {
  // Check if barcode already exists
  const itemsRef = collection(db, 'items');
  const existingQuery = query(itemsRef, where('barcode', '==', barcode));
  const existingSnapshot = await getDocs(existingQuery);

  if (!existingSnapshot.empty && existingSnapshot.docs[0].id !== itemId) {
    throw new Error('Barcode already exists for another item');
  }

  await updateDoc(doc(db, 'items', itemId), {
    barcode,
    updated_at: Timestamp.fromDate(new Date())
  });
}

// Get all items with barcodes
export async function getItemsWithBarcodes(): Promise<BarcodeProduct[]> {
  const itemsRef = collection(db, 'items');
  const q = query(itemsRef, where('barcode', '!=', null), where('is_archived', '!=', true));
  const snapshot = await getDocs(q);

  const products: BarcodeProduct[] = [];

  for (const itemDoc of snapshot.docs) {
    const itemData = itemDoc.data() as any;

    products.push({
      id: itemDoc.id,
      name: itemData.name,
      barcode: itemData.barcode,
      price: itemData.unit_price || itemData.sale_rate || 0,
      stock: itemData.current_quantity ?? 0,
      category: itemData.category?.name
    });
  }

  return products;
}

// Get Quick Access Products
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
  try {
    const settingsRef = doc(db, 'pos_settings', 'default');
    const settingsSnap = await getDoc(settingsRef);

    let currentItems: string[] = [];

    if (settingsSnap.exists()) {
      const data = settingsSnap.data() as POSSettings;
      currentItems = data.quick_access_items || [];
    }

    const index = currentItems.indexOf(itemId);
    if (index >= 0) {
      currentItems.splice(index, 1); // Remove
    } else {
      currentItems.push(itemId); // Add
    }

    // Update firestore
    if (settingsSnap.exists()) {
      await updateDoc(settingsRef, { quick_access_items: currentItems });
    } else {
      await setDoc(settingsRef, { ...DEFAULT_POS_SETTINGS, quick_access_items: currentItems });
    }

    return currentItems;
  } catch (error) {
    console.error('Error toggling quick access item:', error);
    throw error;
  }
}