import { collection, getDocs, doc, writeBatch, query, orderBy, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export interface Unit {
    id: string;
    name: string;      // e.g., 'Kilogram'
    symbol: string;    // e.g., 'kg'
    active: boolean;
    order: number;
}

export const DEFAULT_UNITS: Omit<Unit, 'id'>[] = [
    { name: 'Pieces', symbol: 'pcs', active: true, order: 1 },
    { name: 'Kilogram', symbol: 'kg', active: true, order: 2 },
    { name: 'Gram', symbol: 'g', active: true, order: 3 },
    { name: 'Liter', symbol: 'L', active: true, order: 4 },
    { name: 'Milliliter', symbol: 'mL', active: true, order: 5 },
    { name: 'Dozen', symbol: 'dz', active: true, order: 6 },
    { name: 'Box', symbol: 'box', active: true, order: 7 },
    { name: 'Pack', symbol: 'pack', active: true, order: 8 },
    { name: 'Meter', symbol: 'm', active: true, order: 9 },
    { name: 'Foot', symbol: 'ft', active: true, order: 10 },
];

export async function getUnits(): Promise<Unit[]> {
    try {
        const unitsRef = collection(db, 'units');
        const q = query(unitsRef, orderBy('order', 'asc'));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            return await seedUnits();
        }

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Unit));
    } catch (error) {
        console.error('Error fetching units:', error);
        return [];
    }
}

export async function seedUnits(): Promise<Unit[]> {
    try {
        const batch = writeBatch(db);
        const unitsRef = collection(db, 'units');
        const createdUnits: Unit[] = [];

        DEFAULT_UNITS.forEach((unit) => {
            const docRef = doc(unitsRef, unit.symbol.toLowerCase()); // Use symbol as ID for easy lookup
            batch.set(docRef, unit);
            createdUnits.push({ id: unit.symbol.toLowerCase(), ...unit });
        });

        await batch.commit();
        return createdUnits;
    } catch (error) {
        console.error('Error seeding units:', error);
        return [];
    }
}

export async function createUnit(name: string): Promise<Unit> {
    try {
        const symbol = name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const unitId = symbol; // Use symbol as ID

        const unit: Unit = {
            id: unitId,
            name: name,
            symbol: symbol,
            active: true,
            order: 100 // High number to put at end of list
        };

        const docRef = doc(db, 'units', unitId);
        await setDoc(docRef, unit); // Use setDoc to overwrite if exists or create new

        return unit;
    } catch (error) {
        console.error('Error creating unit:', error);
        throw error;
    }
}
