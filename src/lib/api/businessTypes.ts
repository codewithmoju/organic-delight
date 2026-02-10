import {
    collection,
    getDocs,
    query,
    orderBy,
    writeBatch,
    doc
} from 'firebase/firestore';
import { db } from '../firebase';
import { BUSINESS_TYPES as STATIC_BUSINESS_TYPES } from '../constants/businessTypes';

export interface BusinessType {
    id: string;
    value: string;
    label: string;
    icon: string;
    active?: boolean;
}

const COLLECTION_NAME = 'business_types';

export async function getBusinessTypes(): Promise<BusinessType[]> {
    try {
        const typesRef = collection(db, COLLECTION_NAME);
        const q = query(typesRef, orderBy('label'));
        const snapshot = await getDocs(q);

        // If no types found, seed them
        if (snapshot.empty) {
            console.log('No business types found, seeding defaults...');
            await seedBusinessTypes();
            // Fetch again after seeding
            const newSnapshot = await getDocs(q);
            return newSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as BusinessType));
        }

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as BusinessType));
    } catch (error) {
        console.error('Error fetching business types:', error);
        // Fallback to static types if DB fails (offline support basic)
        return STATIC_BUSINESS_TYPES.map(t => ({ ...t, id: t.value }));
    }
}

export async function seedBusinessTypes(): Promise<void> {
    const batch = writeBatch(db);
    const typesRef = collection(db, COLLECTION_NAME);

    STATIC_BUSINESS_TYPES.forEach(type => {
        const docRef = doc(typesRef); // Auto-ID
        batch.set(docRef, {
            ...type,
            active: true,
            created_at: new Date()
        });
    });

    await batch.commit();
    console.log('Business types seeded successfully');
}
