import {
    collection,
    doc,
    getDocs,
    getDoc,
    query,
    where,
    orderBy,
    Timestamp,
    runTransaction,
    writeBatch,
    increment
} from 'firebase/firestore';
import { db } from '../firebase';
import { Purchase, PurchaseItem } from '../types';
import { generatePurchaseNumber } from './vendors';

// ============================================
// PURCHASE CRUD OPERATIONS
// ============================================

/**
 * Create a new purchase from vendor
 * Automatically updates inventory and vendor balance
 * Supports Offline Mode via WriteBatch fallback
 */
export async function createPurchase(purchaseData: {
    vendor_id: string;
    vendor_name: string;
    bill_number?: string;
    items: Omit<PurchaseItem, 'id'>[];
    subtotal: number;
    tax_amount: number;
    discount_amount: number;
    total_amount: number;
    payment_status: 'paid' | 'partial' | 'unpaid';
    paid_amount: number;
    purchase_date: Date;
    created_by: string;
    notes?: string;
}): Promise<Purchase> {
    const purchaseNumber = generatePurchaseNumber();

    const items: PurchaseItem[] = purchaseData.items.map(item => ({
        ...item,
        id: Math.random().toString(36).substr(2, 9),
        expiry_date: item.expiry_date || null,
        shelf_location: item.shelf_location || null,
        barcode: item.barcode || null
    }));

    const pendingAmount = purchaseData.total_amount - purchaseData.paid_amount;

    // Helper to construct purchase object (reused)
    const constructPurchase = (id: string): Purchase => ({
        id,
        purchase_number: purchaseNumber,
        bill_number: purchaseData.bill_number || null,
        vendor_id: purchaseData.vendor_id,
        vendor_name: purchaseData.vendor_name,
        items,
        subtotal: purchaseData.subtotal,
        tax_amount: purchaseData.tax_amount,
        discount_amount: purchaseData.discount_amount,
        total_amount: purchaseData.total_amount,
        payment_status: purchaseData.payment_status,
        paid_amount: purchaseData.paid_amount,
        pending_amount: pendingAmount,
        purchase_date: purchaseData.purchase_date,
        created_at: new Date(),
        created_by: purchaseData.created_by,
        notes: purchaseData.notes || null
    });

    try {
        return await runTransaction(db, async (transaction) => {
            // 1. Perform ALL Reads First
            const itemReads = await Promise.all(items.map(async (item) => {
                const itemRef = doc(db, 'items', item.item_id);
                const itemDoc = await transaction.get(itemRef);
                return {
                    ref: itemRef,
                    doc: itemDoc,
                    data: item,
                    currentStock: itemDoc.exists() ? (itemDoc.data().current_quantity || 0) : 0,
                    purchase_rate: item.purchase_rate,
                    sale_rate: item.sale_rate
                };
            }));

            const vendorRef = doc(db, 'vendors', purchaseData.vendor_id);
            const vendorDoc = await transaction.get(vendorRef);

            // 2. Perform ALL Writes
            const purchaseRef = doc(collection(db, 'purchases'));
            const purchase = constructPurchase(purchaseRef.id);
            // exclude id from data
            const { id, ...purchaseDataSave } = purchase;

            transaction.set(purchaseRef, {
                ...purchaseDataSave,
                purchase_date: Timestamp.fromDate(purchaseData.purchase_date),
                created_at: Timestamp.fromDate(new Date())
            });

            // Process Items (Transactions & Updates)
            for (const { ref, data, currentStock, purchase_rate } of itemReads) {
                // Create stock_in transaction
                const inventoryTransactionRef = doc(collection(db, 'transactions'));
                transaction.set(inventoryTransactionRef, {
                    item_id: data.item_id,
                    type: 'stock_in',
                    quantity: data.quantity,
                    unit_price: purchase_rate,
                    total_value: data.line_total,
                    transaction_date: Timestamp.fromDate(purchaseData.purchase_date),
                    supplier_customer: purchaseData.vendor_name,
                    reference_number: purchaseData.bill_number || purchaseNumber,
                    notes: `Purchase from ${purchaseData.vendor_name}${data.expiry_date ? ` (Exp: ${data.expiry_date.toLocaleDateString()})` : ''}`,
                    created_by: purchaseData.created_by,
                    created_at: Timestamp.fromDate(new Date()),
                    purchase_id: purchaseRef.id,
                    expiry_date: data.expiry_date ? Timestamp.fromDate(data.expiry_date) : null,
                    shelf_location: data.shelf_location || null
                });

                // Update item
                transaction.update(ref, {
                    last_purchase_rate: purchase_rate,
                    purchase_rate: purchase_rate,
                    current_quantity: currentStock + data.quantity,
                    updated_at: Timestamp.fromDate(new Date())
                });
            }

            // Update Vendor
            if (vendorDoc.exists()) {
                const vendorData = vendorDoc.data();
                transaction.update(vendorRef, {
                    outstanding_balance: (vendorData.outstanding_balance || 0) + pendingAmount,
                    total_purchases: (vendorData.total_purchases || 0) + purchaseData.total_amount,
                    updated_at: Timestamp.fromDate(new Date())
                });
            }

            return purchase;
        });

    } catch (error: any) {
        // OFFLINE FALLBACK: Use WriteBatch
        // Check if error is related to offline/unavailable
        if (error.code === 'unavailable' || error.message?.includes('offline') || !navigator.onLine) {
            console.warn('Purchase Transaction failed (offline), falling back to WriteBatch');

            const batch = writeBatch(db);

            const purchaseRef = doc(collection(db, 'purchases'));
            const purchase = constructPurchase(purchaseRef.id);
            const { id, ...purchaseDataSave } = purchase;

            batch.set(purchaseRef, {
                ...purchaseDataSave,
                purchase_date: Timestamp.fromDate(purchaseData.purchase_date),
                created_at: Timestamp.fromDate(new Date())
            });

            for (const item of items) {
                const itemRef = doc(db, 'items', item.item_id);
                // We use increment() since we can't read current stock reliably
                batch.update(itemRef, {
                    current_quantity: increment(item.quantity),
                    purchase_rate: item.purchase_rate,
                    last_purchase_rate: item.purchase_rate,
                    updated_at: Timestamp.fromDate(new Date())
                });

                const inventoryTransactionRef = doc(collection(db, 'transactions'));
                batch.set(inventoryTransactionRef, {
                    item_id: item.item_id,
                    type: 'stock_in',
                    quantity: item.quantity,
                    unit_price: item.purchase_rate,
                    total_value: item.line_total,
                    transaction_date: Timestamp.fromDate(purchaseData.purchase_date),
                    supplier_customer: purchaseData.vendor_name,
                    reference_number: purchaseData.bill_number || purchaseNumber,
                    notes: `Purchase from ${purchaseData.vendor_name} (Descoked)`,
                    created_by: purchaseData.created_by,
                    created_at: Timestamp.fromDate(new Date()),
                    purchase_id: purchaseRef.id,
                    expiry_date: item.expiry_date ? Timestamp.fromDate(item.expiry_date) : null,
                    shelf_location: item.shelf_location || null
                });
            }

            // Update Vendor
            const vendorRef = doc(db, 'vendors', purchaseData.vendor_id);
            batch.update(vendorRef, {
                outstanding_balance: increment(pendingAmount),
                total_purchases: increment(purchaseData.total_amount),
                updated_at: Timestamp.fromDate(new Date())
            });

            await batch.commit();
            return purchase;
        }
        throw error;
    }
}

/**
 * Get expenses for a date range
 * (Note: Function name says getExpenses but return type says Promise<Expense[]>. 
 * Wait, the file is purchases.ts, so it should be getPurchases? 
 * Looking at previous file content, it seemed to have getPurchases. 
 * I will implement getPurchases matching the file purpose)
 */
export async function getPurchases(startDate?: Date, endDate?: Date): Promise<Purchase[]> {
    const purchasesRef = collection(db, 'purchases');
    let q = query(purchasesRef, orderBy('purchase_date', 'desc'));

    if (startDate) {
        q = query(q, where('purchase_date', '>=', Timestamp.fromDate(startDate)));
    }
    if (endDate) {
        q = query(q, where('purchase_date', '<=', Timestamp.fromDate(endDate)));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        purchase_date: doc.data().purchase_date?.toDate() || new Date(),
        created_at: doc.data().created_at?.toDate() || new Date()
    })) as Purchase[];
}

export async function getPurchase(id: string): Promise<Purchase | null> {
    const docRef = doc(db, 'purchases', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return {
            id: docSnap.id,
            ...docSnap.data(),
            purchase_date: docSnap.data().purchase_date?.toDate(),
            created_at: docSnap.data().created_at?.toDate()
        } as Purchase;
    } else {
        return null;
    }
}

export async function getPurchasesByVendor(vendorId: string): Promise<Purchase[]> {
    const purchasesRef = collection(db, 'purchases');
    const q = query(purchasesRef, where('vendor_id', '==', vendorId), orderBy('purchase_date', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        purchase_date: doc.data().purchase_date?.toDate() || new Date(),
        created_at: doc.data().created_at?.toDate() || new Date()
    })) as Purchase[];
}
