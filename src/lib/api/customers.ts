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
import { Customer, CustomerPayment } from '../types';
// ============================================
// CUSTOMER CRUD OPERATIONS
// ============================================

/**
 * Get all active customers
 */
export async function getCustomers(): Promise<Customer[]> {
    try {
        const customersRef = collection(db, 'customers');
        // Simplified query to avoid index requirement
        const q = query(customersRef, orderBy('name'));
        const snapshot = await getDocs(q);

        const customers = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            created_at: doc.data().created_at?.toDate ? doc.data().created_at.toDate() : new Date(),
            updated_at: doc.data().updated_at?.toDate ? doc.data().updated_at.toDate() : new Date()
        })) as Customer[];

        return customers.filter(c => c.is_active !== false);
    } catch (error: any) {
        console.error('Firestore getCustomers error:', error);
        if (error.message?.includes('index')) {
            console.info('To fix this index error, visit: https://console.firebase.google.com/project/organic-delight-inventory-db/firestore/indexes');
        }
        throw error;
    }
}

/**
 * Get all customers including inactive
 */
export async function getAllCustomers(): Promise<Customer[]> {
    const customersRef = collection(db, 'customers');
    const q = query(customersRef, orderBy('name'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate() || new Date(),
        updated_at: doc.data().updated_at?.toDate() || new Date()
    })) as Customer[];
}

/**
 * Get a single customer by ID
 */
export async function getCustomerById(customerId: string): Promise<Customer | null> {
    const customerDoc = await getDoc(doc(db, 'customers', customerId));

    if (!customerDoc.exists()) {
        return null;
    }

    const data = customerDoc.data();
    return {
        id: customerDoc.id,
        ...data,
        created_at: data.created_at?.toDate() || new Date(),
        updated_at: data.updated_at?.toDate() || new Date()
    } as Customer;
}

/**
 * Create a new customer
 */
export async function createCustomer(customerData: {
    name: string;
    phone: string;
    email?: string;
    address?: string;
    created_by: string;
}): Promise<Customer> {
    const customersRef = collection(db, 'customers');

    const newCustomer = {
        ...customerData,
        outstanding_balance: 0,
        total_purchases: 0,
        is_active: true,
        created_at: Timestamp.fromDate(new Date()),
        updated_at: Timestamp.fromDate(new Date())
    };

    const docRef = await addDoc(customersRef, newCustomer);

    return {
        id: docRef.id,
        ...customerData,
        outstanding_balance: 0,
        total_purchases: 0,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
    };
}

/**
 * Update customer information
 */
export async function updateCustomer(
    customerId: string,
    updates: Partial<Omit<Customer, 'id' | 'created_at' | 'created_by'>>
): Promise<void> {
    const customerRef = doc(db, 'customers', customerId);
    await updateDoc(customerRef, {
        ...updates,
        updated_at: Timestamp.fromDate(new Date())
    });
}

/**
 * Deactivate a customer (soft delete)
 */
export async function deactivateCustomer(customerId: string): Promise<void> {
    const customerRef = doc(db, 'customers', customerId);
    await updateDoc(customerRef, {
        is_active: false,
        updated_at: Timestamp.fromDate(new Date())
    });
}

// ============================================
// CUSTOMER CREDIT (UDHAAR) OPERATIONS
// ============================================

/**
 * Get customer payment history (ledger)
 */
export async function getCustomerLedger(customerId: string): Promise<CustomerPayment[]> {
    const paymentsRef = collection(db, 'customer_payments');
    const q = query(
        paymentsRef,
        where('customer_id', '==', customerId),
        orderBy('payment_date', 'desc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        payment_date: doc.data().payment_date?.toDate() || new Date(),
        created_at: doc.data().created_at?.toDate() || new Date()
    })) as CustomerPayment[];
}

/**
 * Record a payment from a customer
 * Reduces customer's outstanding balance
 */
export async function recordCustomerPayment(paymentData: {
    customer_id: string;
    amount: number;
    payment_method: 'cash' | 'bank_transfer' | 'digital';
    reference_number?: string;
    notes?: string;
    payment_date: Date;
    created_by: string;
}): Promise<CustomerPayment> {
    return await runTransaction(db, async (transaction) => {
        // Get current customer data
        const customerRef = doc(db, 'customers', paymentData.customer_id);
        const customerDoc = await transaction.get(customerRef);

        if (!customerDoc.exists()) {
            throw new Error('Customer not found');
        }

        const customerData = customerDoc.data();
        const newBalance = (customerData.outstanding_balance || 0) - paymentData.amount;

        // Update customer balance (no limit, can go to 0 or negative for overpayment)
        transaction.update(customerRef, {
            outstanding_balance: newBalance,
            updated_at: Timestamp.fromDate(new Date())
        });

        // Create payment record
        const paymentRef = doc(collection(db, 'customer_payments'));
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
 * Update customer balance after a credit sale
 * Called from POS transaction creation
 */
export async function updateCustomerBalanceForSale(
    customerId: string,
    saleAmount: number
): Promise<void> {
    const customerRef = doc(db, 'customers', customerId);

    await runTransaction(db, async (transaction) => {
        const customerDoc = await transaction.get(customerRef);

        if (!customerDoc.exists()) {
            throw new Error('Customer not found');
        }

        const customerData = customerDoc.data();

        // No credit limit - just add to balance
        transaction.update(customerRef, {
            outstanding_balance: (customerData.outstanding_balance || 0) + saleAmount,
            total_purchases: (customerData.total_purchases || 0) + saleAmount,
            updated_at: Timestamp.fromDate(new Date())
        });
    });
}

/**
 * Search customers by name or phone
 */
export async function searchCustomers(searchQuery: string): Promise<Customer[]> {
    const customers = await getCustomers();
    const query = searchQuery.toLowerCase();

    return customers.filter(customer =>
        customer.name.toLowerCase().includes(query) ||
        customer.phone.includes(query) ||
        customer.email?.toLowerCase().includes(query)
    );
}

/**
 * Get customers with outstanding balance (Udhaar)
 */
export async function getCustomersWithBalance(): Promise<Customer[]> {
    const customers = await getCustomers();
    return customers.filter(customer => customer.outstanding_balance > 0);
}

/**
 * Get customer balance summary
 */
export async function getCustomerBalanceSummary(customerId: string) {
    const customer = await getCustomerById(customerId);
    const payments = await getCustomerLedger(customerId);

    if (!customer) {
        throw new Error('Customer not found');
    }

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

    return {
        customer,
        outstanding_balance: customer.outstanding_balance,
        total_purchases: customer.total_purchases,
        total_paid: totalPaid,
        payment_history: payments
    };
}

/**
 * Get credit sales for a customer
 */
export async function getCustomerCreditSales(customerId: string) {
    const transactionsRef = collection(db, 'pos_transactions');
    const q = query(
        transactionsRef,
        where('customer_id', '==', customerId),
        where('is_credit_sale', '==', true),
        orderBy('created_at', 'desc')
    );

    try {
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            created_at: doc.data().created_at?.toDate() || new Date()
        }));
    } catch (error) {
        console.warn('Error fetching credit sales:', error);
        return [];
    }
}
