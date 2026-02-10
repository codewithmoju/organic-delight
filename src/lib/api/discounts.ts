import {
    collection,
    getDocs,
    query,
    orderBy,
    writeBatch,
    doc
} from 'firebase/firestore';
import { db } from '../firebase';

export interface DiscountType {
    id: string;
    name: string;
    slug: string; // 'profit', 'price', 'employee', etc.
    active: boolean;
    order: number;
}

const COLLECTION_NAME = 'discount_types';

const DEFAULT_DISCOUNT_TYPES = [
    { id: 'profit', name: 'Profit Discount', slug: 'profit', active: true, order: 1 },
    { id: 'price', name: 'Price Discount', slug: 'price', active: true, order: 2 },
    // Future: { id: 'employee', name: 'Employee Discount', slug: 'employee', active: true, order: 3 }
] as const;

export async function getDiscountTypes(): Promise<DiscountType[]> {
    try {
        const typesRef = collection(db, COLLECTION_NAME);
        const q = query(typesRef, orderBy('order'));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            console.log('No discount types found, seeding defaults...');
            await seedDiscountTypes();
            const newSnapshot = await getDocs(q);
            return newSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as DiscountType));
        }

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as DiscountType));
    } catch (error) {
        console.error('Error fetching discount types:', error);
        // Fallback
        return DEFAULT_DISCOUNT_TYPES.map(d => ({ ...d }));
    }
}

export async function seedDiscountTypes(): Promise<void> {
    const batch = writeBatch(db);
    const typesRef = collection(db, COLLECTION_NAME);

    DEFAULT_DISCOUNT_TYPES.forEach(type => {
        const docRef = doc(typesRef, type.id);
        batch.set(docRef, {
            ...type,
            created_at: new Date()
        });
    });

    await batch.commit();
    console.log('Discount types seeded successfully');
}
