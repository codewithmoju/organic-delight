import { collection, getDocs, doc, writeBatch, query } from 'firebase/firestore';
import { db } from '../firebase';
import { BillType } from '../types';

export const DEFAULT_BILL_TYPES: Omit<BillType, 'id'>[] = [
    {
        name: 'Regular Bill',
        code: 'regular',
        affects_inventory: true,
        affects_accounting: true,
        is_default: true,
        description: 'Standard sale that updates inventory and financial records.',
        active: true
    },
    {
        name: 'Quotation / Estimate',
        code: 'quotation',
        affects_inventory: false,
        affects_accounting: false,
        is_default: false,
        description: 'Proforma invoice or estimate. Does not affect inventory or accounts.',
        active: true
    }
];

export async function getBillTypes(): Promise<BillType[]> {
    try {
        const billTypesRef = collection(db, 'bill_types');
        // Order by name or a specific order field if we add one. For now, name is fine or just default order.
        // Let's assume we might want an order, but for now just fetch.
        const q = query(billTypesRef);
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            return await seedBillTypes();
        }

        const types = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as BillType));

        // Sort so default is first, then active ones
        return types.sort((a, _b) => (a.is_default ? -1 : 1));
    } catch (error) {
        console.error('Error fetching bill types:', error);
        return [];
    }
}

export async function seedBillTypes(): Promise<BillType[]> {
    try {
        const batch = writeBatch(db);
        const billTypesRef = collection(db, 'bill_types');
        const createdTypes: BillType[] = [];

        DEFAULT_BILL_TYPES.forEach((type) => {
            const docRef = doc(billTypesRef, type.code); // Use code as ID
            batch.set(docRef, type);
            createdTypes.push({ id: type.code, ...type });
        });

        await batch.commit();
        return createdTypes;
    } catch (error) {
        console.error('Error seeding bill types:', error);
        return [];
    }
}
