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
import { Vendor, VendorPayment } from '../types';

// ============================================
// VENDOR CRUD OPERATIONS
// ============================================

/**
 * Get all vendors with their outstanding balances
 */
export async function getVendors(): Promise<Vendor[]> {
    try {
        const vendorsRef = collection(db, 'vendors');
        // Simplified query: remove 'is_active' filter from server query to avoid index requirement
        // We'll filter client-side instead.
        const q = query(vendorsRef, orderBy('name'));
        const snapshot = await getDocs(q);

        const vendors = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            created_at: doc.data().created_at?.toDate() || new Date(),
            updated_at: doc.data().updated_at?.toDate() || new Date()
        })) as Vendor[];

        return vendors.filter(v => v.is_active !== false);
    } catch (error: any) {
        console.error('Firestore getVendors error:', error);
        if (error.message?.includes('index')) {
            console.info('To fix this index error, visit: https://console.firebase.google.com/project/organic-delight-inventory-db/firestore/indexes');
        }
        throw error;
    }
}

/**
 * Get all vendors including inactive ones
 */
export async function getAllVendors(): Promise<Vendor[]> {
    const vendorsRef = collection(db, 'vendors');
    const q = query(vendorsRef, orderBy('name'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate() || new Date(),
        updated_at: doc.data().updated_at?.toDate() || new Date()
    })) as Vendor[];
}

/**
 * Get a single vendor by ID
 */
export async function getVendorById(vendorId: string): Promise<Vendor | null> {
    const vendorDoc = await getDoc(doc(db, 'vendors', vendorId));

    if (!vendorDoc.exists()) {
        return null;
    }

    const data = vendorDoc.data();
    return {
        id: vendorDoc.id,
        ...data,
        created_at: data.created_at?.toDate() || new Date(),
        updated_at: data.updated_at?.toDate() || new Date()
    } as Vendor;
}

/**
 * Create a new vendor
 */
export async function createVendor(vendorData: {
    name: string;
    company: string;
    phone: string;
    email?: string;
    address?: string;
    gst_number?: string;
    created_by: string;
}): Promise<Vendor> {
    const vendorsRef = collection(db, 'vendors');

    const newVendor = {
        ...vendorData,
        outstanding_balance: 0,
        total_purchases: 0,
        is_active: true,
        created_at: Timestamp.fromDate(new Date()),
        updated_at: Timestamp.fromDate(new Date())
    };

    const docRef = await addDoc(vendorsRef, newVendor);

    return {
        id: docRef.id,
        ...vendorData,
        outstanding_balance: 0,
        total_purchases: 0,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
    };
}

/**
 * Update vendor information
 */
export async function updateVendor(
    vendorId: string,
    updates: Partial<Omit<Vendor, 'id' | 'created_at' | 'created_by'>>
): Promise<void> {
    const vendorRef = doc(db, 'vendors', vendorId);
    await updateDoc(vendorRef, {
        ...updates,
        updated_at: Timestamp.fromDate(new Date())
    });
}

/**
 * Deactivate a vendor (soft delete)
 */
export async function deactivateVendor(vendorId: string): Promise<void> {
    const vendorRef = doc(db, 'vendors', vendorId);
    await updateDoc(vendorRef, {
        is_active: false,
        updated_at: Timestamp.fromDate(new Date())
    });
}

/**
 * Delete a vendor (hard delete)
 * Will fail if vendor has outstanding balance
 */
export async function deleteVendor(vendorId: string): Promise<void> {
    const vendorRef = doc(db, 'vendors', vendorId);
    const vendorDoc = await getDoc(vendorRef);

    if (!vendorDoc.exists()) {
        throw new Error('Vendor not found');
    }

    const vendorData = vendorDoc.data();

    // Prevent deletion if there's an outstanding balance
    // Prevent deletion if there's an outstanding balance
    // Double check with actual ledger validation because stored balance might be out of sync
    if (vendorData.outstanding_balance && Math.abs(vendorData.outstanding_balance) > 1) {
        // Dynamic import to avoid circular dependency (purchases.ts imports vendors.ts)
        const { getPurchasesByVendor } = await import('./purchases');

        // Calculate real balance from transactions to be sure
        const [payments, purchases] = await Promise.all([
            getVendorLedger(vendorId),
            getPurchasesByVendor(vendorId)
        ]);

        const totalPurchases = purchases.reduce((sum: number, p: any) => sum + (p.total_amount || 0), 0);
        const totalPayments = payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
        const realBalance = totalPurchases - totalPayments;

        // Allow some float precision error
        if (Math.abs(realBalance) > 1) {
            throw new Error(`Cannot delete vendor with outstanding balance (${realBalance.toFixed(2)}). Please clear the balance first.`);
        }

        // If real balance is 0 but stored balance was wrong, we proceed with deletion
    }

    // Import deleteDoc dynamically to avoid circular issues
    const { deleteDoc } = await import('firebase/firestore');
    await deleteDoc(vendorRef);
}

// ============================================
// VENDOR LEDGER & PAYMENT OPERATIONS
// ============================================

/**
 * Get vendor payment history (ledger)
 */
export async function getVendorLedger(vendorId: string): Promise<VendorPayment[]> {
    const paymentsRef = collection(db, 'vendor_payments');
    const q = query(
        paymentsRef,
        where('vendor_id', '==', vendorId),
        orderBy('payment_date', 'desc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        payment_date: doc.data().payment_date?.toDate() || new Date(),
        created_at: doc.data().created_at?.toDate() || new Date()
    })) as VendorPayment[];
}

/**
 * Record a payment to a vendor
 * Updates vendor's outstanding balance
 */
export async function recordVendorPayment(paymentData: {
    vendor_id: string;
    amount: number;
    payment_method: 'cash' | 'bank_transfer' | 'cheque';
    reference_number?: string;
    notes?: string;
    payment_date: Date;
    created_by: string;
}): Promise<VendorPayment> {
    return await runTransaction(db, async (transaction) => {
        // Get current vendor data
        const vendorRef = doc(db, 'vendors', paymentData.vendor_id);
        const vendorDoc = await transaction.get(vendorRef);

        if (!vendorDoc.exists()) {
            throw new Error('Vendor not found');
        }

        const vendorData = vendorDoc.data();
        const newBalance = (vendorData.outstanding_balance || 0) - paymentData.amount;

        // Update vendor balance
        transaction.update(vendorRef, {
            outstanding_balance: newBalance,
            updated_at: Timestamp.fromDate(new Date())
        });

        // Create payment record
        const paymentRef = doc(collection(db, 'vendor_payments'));
        const paymentRecord = {
            ...paymentData,
            payment_date: Timestamp.fromDate(paymentData.payment_date),
            created_at: Timestamp.fromDate(new Date())
        };

        transaction.set(paymentRef, paymentRecord);

        return {
            id: paymentRef.id,
            ...paymentData,
            created_at: new Date()
        };
    });
}

/**
 * Update vendor balance after a purchase
 * Called from purchase creation
 */
export async function updateVendorBalanceForPurchase(
    vendorId: string,
    purchaseAmount: number
): Promise<void> {
    const vendorRef = doc(db, 'vendors', vendorId);

    await runTransaction(db, async (transaction) => {
        const vendorDoc = await transaction.get(vendorRef);

        if (!vendorDoc.exists()) {
            throw new Error('Vendor not found');
        }

        const vendorData = vendorDoc.data();

        transaction.update(vendorRef, {
            outstanding_balance: (vendorData.outstanding_balance || 0) + purchaseAmount,
            total_purchases: (vendorData.total_purchases || 0) + purchaseAmount,
            updated_at: Timestamp.fromDate(new Date())
        });
    });
}

/**
 * Search vendors by name or company
 */
export async function searchVendors(searchQuery: string): Promise<Vendor[]> {
    const vendors = await getVendors();
    const query = searchQuery.toLowerCase();

    return vendors.filter(vendor =>
        vendor.name.toLowerCase().includes(query) ||
        vendor.company.toLowerCase().includes(query) ||
        vendor.phone.includes(query)
    );
}

/**
 * Get vendors with outstanding balance
 */
export async function getVendorsWithBalance(): Promise<Vendor[]> {
    const vendors = await getVendors();
    return vendors.filter(vendor => vendor.outstanding_balance > 0);
}

/**
 * Generate purchase number
 */
export function generatePurchaseNumber(): string {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const time = now.getTime().toString().slice(-6);

    return `PUR${year}${month}${day}${time}`;
}
