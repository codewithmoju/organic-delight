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
import { Purchase, PurchaseItem } from '../types';
import { updateVendorBalanceForPurchase, generatePurchaseNumber } from './vendors';

// ============================================
// PURCHASE CRUD OPERATIONS
// ============================================

/**
 * Create a new purchase from vendor
 * Automatically updates inventory and vendor balance
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

    return await runTransaction(db, async (transaction) => {
        // Create purchase record
        const purchaseRef = doc(collection(db, 'purchases'));

        const items: PurchaseItem[] = purchaseData.items.map(item => ({
            ...item,
            id: Math.random().toString(36).substr(2, 9)
        }));

        const pendingAmount = purchaseData.total_amount - purchaseData.paid_amount;

        const purchase: Omit<Purchase, 'id'> = {
            purchase_number: purchaseNumber,
            bill_number: purchaseData.bill_number,
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
            notes: purchaseData.notes
        };

        transaction.set(purchaseRef, {
            ...purchase,
            purchase_date: Timestamp.fromDate(purchaseData.purchase_date),
            created_at: Timestamp.fromDate(new Date())
        });

        // Create stock_in transactions for each item
        for (const item of items) {
            const inventoryTransactionRef = doc(collection(db, 'transactions'));
            transaction.set(inventoryTransactionRef, {
                item_id: item.item_id,
                type: 'stock_in',
                quantity: item.quantity,
                unit_price: item.purchase_rate,
                total_value: item.line_total,
                transaction_date: Timestamp.fromDate(purchaseData.purchase_date),
                supplier_customer: purchaseData.vendor_name,
                reference_number: purchaseData.bill_number || purchaseNumber,
                notes: `Purchase from ${purchaseData.vendor_name}${item.expiry_date ? ` (Exp: ${item.expiry_date.toLocaleDateString()})` : ''}`,
                created_by: purchaseData.created_by,
                created_at: Timestamp.fromDate(new Date()),
                purchase_id: purchaseRef.id,
                expiry_date: item.expiry_date ? Timestamp.fromDate(item.expiry_date) : null,
                shelf_location: item.shelf_location || null
            });

            // Update item's last purchase rate
            const itemRef = doc(db, 'items', item.item_id);
            transaction.update(itemRef, {
                last_purchase_rate: item.purchase_rate,
                updated_at: Timestamp.fromDate(new Date())
            });
        }

        return {
            id: purchaseRef.id,
            ...purchase
        };
    });
}

/**
 * Get all purchases with optional filters
 */
export async function getPurchases(filters?: {
    vendor_id?: string;
    start_date?: Date;
    end_date?: Date;
    payment_status?: 'paid' | 'partial' | 'unpaid';
}): Promise<Purchase[]> {
    const purchasesRef = collection(db, 'purchases');
    let q = query(purchasesRef, orderBy('purchase_date', 'desc'));

    // Note: Firestore doesn't support multiple inequality filters
    // Client-side filtering for complex queries

    const snapshot = await getDocs(q);

    let purchases = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        purchase_date: doc.data().purchase_date?.toDate() || new Date(),
        created_at: doc.data().created_at?.toDate() || new Date()
    })) as Purchase[];

    // Apply filters
    if (filters) {
        if (filters.vendor_id) {
            purchases = purchases.filter(p => p.vendor_id === filters.vendor_id);
        }
        if (filters.start_date) {
            purchases = purchases.filter(p => p.purchase_date >= filters.start_date!);
        }
        if (filters.end_date) {
            purchases = purchases.filter(p => p.purchase_date <= filters.end_date!);
        }
        if (filters.payment_status) {
            purchases = purchases.filter(p => p.payment_status === filters.payment_status);
        }
    }

    return purchases;
}

/**
 * Get purchases by vendor
 */
export async function getPurchasesByVendor(vendorId: string): Promise<Purchase[]> {
    return getPurchases({ vendor_id: vendorId });
}

/**
 * Get single purchase by ID
 */
export async function getPurchaseById(purchaseId: string): Promise<Purchase | null> {
    const purchaseDoc = await getDoc(doc(db, 'purchases', purchaseId));

    if (!purchaseDoc.exists()) {
        return null;
    }

    const data = purchaseDoc.data();
    return {
        id: purchaseDoc.id,
        ...data,
        purchase_date: data.purchase_date?.toDate() || new Date(),
        created_at: data.created_at?.toDate() || new Date()
    } as Purchase;
}

/**
 * Update purchase payment status
 */
export async function updatePurchasePayment(
    purchaseId: string,
    paymentAmount: number,
    vendorId: string
): Promise<void> {
    await runTransaction(db, async (transaction) => {
        const purchaseRef = doc(db, 'purchases', purchaseId);
        const purchaseDoc = await transaction.get(purchaseRef);

        if (!purchaseDoc.exists()) {
            throw new Error('Purchase not found');
        }

        const purchaseData = purchaseDoc.data();
        const newPaidAmount = (purchaseData.paid_amount || 0) + paymentAmount;
        const newPendingAmount = purchaseData.total_amount - newPaidAmount;

        let newPaymentStatus: 'paid' | 'partial' | 'unpaid' = 'unpaid';
        if (newPendingAmount <= 0) {
            newPaymentStatus = 'paid';
        } else if (newPaidAmount > 0) {
            newPaymentStatus = 'partial';
        }

        transaction.update(purchaseRef, {
            paid_amount: newPaidAmount,
            pending_amount: Math.max(0, newPendingAmount),
            payment_status: newPaymentStatus,
            updated_at: Timestamp.fromDate(new Date())
        });
    });
}

/**
 * Get last purchase rate for an item
 */
export async function getLastPurchaseRate(itemId: string): Promise<number | null> {
    const transactionsRef = collection(db, 'transactions');
    const q = query(
        transactionsRef,
        where('item_id', '==', itemId),
        where('type', '==', 'stock_in'),
        orderBy('transaction_date', 'desc')
    );

    try {
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            return null;
        }

        return snapshot.docs[0].data().unit_price;
    } catch (error) {
        console.warn('Error fetching last purchase rate:', error);
        return null;
    }
}

/**
 * Search purchases by item name or vendor
 */
export async function searchPurchases(searchQuery: string): Promise<Purchase[]> {
    const purchases = await getPurchases();
    const query = searchQuery.toLowerCase();

    return purchases.filter(purchase =>
        purchase.vendor_name.toLowerCase().includes(query) ||
        purchase.purchase_number.toLowerCase().includes(query) ||
        purchase.items.some(item => item.item_name.toLowerCase().includes(query))
    );
}

/**
 * Get purchase analytics for a date range
 */
export async function getPurchaseAnalytics(startDate: Date, endDate: Date) {
    const purchases = await getPurchases({ start_date: startDate, end_date: endDate });

    const vendorBreakdown: { [vendorId: string]: { name: string; total: number; count: number } } = {};
    const itemBreakdown: { [itemName: string]: { quantity: number; total: number } } = {};

    let totalPurchases = 0;
    let totalPaid = 0;
    let totalPending = 0;

    for (const purchase of purchases) {
        totalPurchases += purchase.total_amount;
        totalPaid += purchase.paid_amount;
        totalPending += purchase.pending_amount;

        // Vendor breakdown
        if (!vendorBreakdown[purchase.vendor_id]) {
            vendorBreakdown[purchase.vendor_id] = {
                name: purchase.vendor_name,
                total: 0,
                count: 0
            };
        }
        vendorBreakdown[purchase.vendor_id].total += purchase.total_amount;
        vendorBreakdown[purchase.vendor_id].count++;

        // Item breakdown
        for (const item of purchase.items) {
            if (!itemBreakdown[item.item_name]) {
                itemBreakdown[item.item_name] = { quantity: 0, total: 0 };
            }
            itemBreakdown[item.item_name].quantity += item.quantity;
            itemBreakdown[item.item_name].total += item.line_total;
        }
    }

    return {
        totalPurchases,
        totalPaid,
        totalPending,
        purchaseCount: purchases.length,
        vendorBreakdown: Object.values(vendorBreakdown).sort((a, b) => b.total - a.total),
        itemBreakdown: Object.entries(itemBreakdown)
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.total - a.total)
    };
}
