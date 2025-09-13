import { 
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  runTransaction,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import { POSTransaction, POSTransactionItem, CartItem, BarcodeProduct, POSSettings, SalesReport } from '../types';

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
}): Promise<POSTransaction> {
  const transactionNumber = generateTransactionNumber();
  
  // Use Firestore transaction to ensure data consistency
  return await runTransaction(db, async (transaction) => {
    // Check stock availability for all items
    for (const cartItem of transactionData.items) {
      const itemRef = doc(db, 'items', cartItem.item_id);
      const itemDoc = await transaction.get(itemRef);
      
      if (!itemDoc.exists()) {
        throw new Error(`Item ${cartItem.name} not found`);
      }
      
      const currentStock = await getItemCurrentStock(cartItem.item_id);
      if (currentStock < cartItem.quantity) {
        throw new Error(`Insufficient stock for ${cartItem.name}. Available: ${currentStock}`);
      }
    }
    
    // Create POS transaction
    const posTransactionRef = doc(collection(db, 'pos_transactions'));
    const posTransactionData: Omit<POSTransaction, 'id'> = {
      transaction_number: transactionNumber,
      items: transactionData.items.map(item => ({
        id: generateItemId(),
        item_id: item.item_id,
        item_name: item.name,
        barcode: item.barcode,
        unit_price: item.unit_price,
        quantity: item.quantity,
        line_total: item.line_total,
        discount_amount: 0,
        tax_rate: 0
      })),
      subtotal: transactionData.subtotal,
      tax_amount: transactionData.tax_amount,
      discount_amount: transactionData.discount_amount,
      total_amount: transactionData.total_amount,
      payment_method: transactionData.payment_method,
      payment_amount: transactionData.payment_amount,
      change_amount: transactionData.change_amount,
      cashier_id: transactionData.cashier_id,
      customer_name: transactionData.customer_name,
      customer_phone: transactionData.customer_phone,
      created_at: new Date(),
      status: 'completed',
      receipt_printed: false,
      notes: transactionData.notes
    };
    
    transaction.set(posTransactionRef, {
      ...posTransactionData,
      created_at: Timestamp.fromDate(new Date())
    });
    
    // Create inventory transactions for each item
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
      price: itemData.unit_price || 0,
      stock: currentStock,
      category: itemData.category?.name
    };
  } catch (error) {
    console.error('Error fetching product by barcode:', error);
    return null;
  }
}

// Get current stock level for an item
async function getItemCurrentStock(itemId: string): Promise<number> {
  const transactionsRef = collection(db, 'transactions');
  const q = query(transactionsRef, where('item_id', '==', itemId));
  const snapshot = await getDocs(q);
  
  let currentStock = 0;
  
  snapshot.docs.forEach(doc => {
    const transaction = doc.data();
    if (transaction.type === 'stock_in') {
      currentStock += transaction.quantity;
    } else if (transaction.type === 'stock_out') {
      currentStock -= transaction.quantity;
    }
  });
  
  return Math.max(0, currentStock);
}

// Search products for manual entry
export async function searchProducts(searchQuery: string): Promise<BarcodeProduct[]> {
  const itemsRef = collection(db, 'items');
  const q = query(itemsRef, where('is_archived', '!=', true), orderBy('name'));
  const snapshot = await getDocs(q);
  
  const products: BarcodeProduct[] = [];
  
  for (const itemDoc of snapshot.docs) {
    const itemData = itemDoc.data();
    
    // Client-side filtering
    if (itemData.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        itemData.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        itemData.barcode?.includes(searchQuery)) {
      
      const currentStock = await getItemCurrentStock(itemDoc.id);
      
      products.push({
        id: itemDoc.id,
        name: itemData.name,
        barcode: itemData.barcode || '',
        price: itemData.unit_price || 0,
        stock: currentStock,
        category: itemData.category?.name
      });
    }
  }
  
  return products.slice(0, 20); // Limit results
}

function getDefaultPOSSettings(): POSSettings {
  return {
    store_name: 'StockSuite Store',
    store_address: '123 Business St, City, State 12345',
    store_phone: '(555) 123-4567',
    tax_rate: 0.08, // 8% tax
    currency: 'USD',
    receipt_footer_message: 'Thank you for your business!',
    auto_print_receipt: true,
    barcode_scanner_enabled: true,
    thermal_printer_enabled: false
  };
}

// POS Settings Management
export async function getPOSSettings(): Promise<POSSettings> {
  try {
    const settingsDoc = await getDoc(doc(db, 'pos_settings', 'default'));
    
    if (settingsDoc.exists()) {
      return settingsDoc.data() as POSSettings;
    }
    
    // Return default settings
    const defaultSettings: POSSettings = {
      store_name: 'StockSuite Store',
      store_address: '123 Business St, City, State 12345',
      store_phone: '(555) 123-4567',
      tax_rate: 0.08, // 8% tax
      currency: 'USD',
      receipt_footer_message: 'Thank you for your business!',
      auto_print_receipt: true,
      barcode_scanner_enabled: true,
      thermal_printer_enabled: false
    };
    
    return defaultSettings;
  } catch (error) {
    console.warn('Error loading POS settings, using defaults:', error);
    // Return default settings as fallback
    return getDefaultPOSSettings();
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
  
  const transactionsRef = collection(db, 'pos_transactions');
  const q = query(
    transactionsRef,
    where('created_at', '>=', Timestamp.fromDate(startOfDay)),
    where('created_at', '<=', Timestamp.fromDate(endOfDay)),
    where('status', '==', 'completed')
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
    
    // Create reverse inventory transactions
    for (const item of posTransaction.items) {
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
    const itemData = itemDoc.data();
    const currentStock = await getItemCurrentStock(itemDoc.id);
    
    products.push({
      id: itemDoc.id,
      name: itemData.name,
      barcode: itemData.barcode,
      price: itemData.unit_price || 0,
      stock: currentStock,
      category: itemData.category?.name
    });
  }
  
  return products;
}