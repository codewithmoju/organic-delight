import {
    collection,
    getDocs,
    query,
    orderBy,
    writeBatch,
    doc
} from 'firebase/firestore';
import { db } from '../firebase';

export interface PaymentMethod {
    id: string;
    name: string;
    type: 'cash' | 'card' | 'digital';
    icon?: string;
    active: boolean;
    order: number;
}

const COLLECTION_NAME = 'payment_methods';

const DEFAULT_PAYMENT_METHODS = [
    { id: 'cash', name: 'Cash', type: 'cash', icon: 'Banknote', active: true, order: 1 },
    { id: 'card', name: 'Card', type: 'card', icon: 'CreditCard', active: true, order: 2 },
    { id: 'digital', name: 'Digital', type: 'digital', icon: 'Smartphone', active: true, order: 3 },
    // Examples of other methods that could be added later
    // { id: 'jazzcash', name: 'JazzCash', type: 'digital', icon: 'Smartphone', active: false, order: 4 },
    // { id: 'easypaisa', name: 'EasyPaisa', type: 'digital', icon: 'Smartphone', active: false, order: 5 },
] as const;

export async function getPaymentMethods(): Promise<PaymentMethod[]> {
    try {
        const methodsRef = collection(db, COLLECTION_NAME);
        const q = query(methodsRef, orderBy('order'));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            console.log('No payment methods found, seeding defaults...');
            await seedPaymentMethods();
            const newSnapshot = await getDocs(q);
            return newSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as PaymentMethod));
        }

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as PaymentMethod));
    } catch (error) {
        console.error('Error fetching payment methods:', error);
        // Fallback
        return DEFAULT_PAYMENT_METHODS.map(m => ({ ...m, type: m.type as 'cash' | 'card' | 'digital' }));
    }
}

export async function seedPaymentMethods(): Promise<void> {
    const batch = writeBatch(db);
    const methodsRef = collection(db, COLLECTION_NAME);

    DEFAULT_PAYMENT_METHODS.forEach(method => {
        const docRef = doc(methodsRef, method.id); // Use specific IDs for methods
        batch.set(docRef, {
            ...method,
            created_at: new Date()
        });
    });

    await batch.commit();
    console.log('Payment methods seeded successfully');
}
