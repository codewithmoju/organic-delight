import { collection, getDocs, doc, writeBatch, setDoc } from 'firebase/firestore';
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
        const snapshot = await getDocs(unitsRef);

        // Build a map of Firestore units keyed by symbol (lowercase) for deduplication
        const firestoreMap = new Map<string, Unit>();
        snapshot.docs.forEach(d => {
            const unit = { id: d.id, ...d.data() } as Unit;
            firestoreMap.set(unit.symbol.toLowerCase(), unit);
        });

        // Always start with the full defaults list, then overlay any Firestore versions
        // and append any custom units that aren't in the defaults
        const defaultSymbols = new Set(DEFAULT_UNITS.map(u => u.symbol.toLowerCase()));
        const merged: Unit[] = DEFAULT_UNITS.map(u => {
            const key = u.symbol.toLowerCase();
            // Prefer Firestore version if it exists (may have been updated)
            return firestoreMap.get(key) ?? { id: key, ...u };
        });

        // Append custom units not in the defaults list
        firestoreMap.forEach((unit, key) => {
            if (!defaultSymbols.has(key)) {
                merged.push(unit);
            }
        });

        // Sort: defaults by order, custom units at the end alphabetically
        return merged.sort((a, b) => {
            const orderA = a.order ?? 999;
            const orderB = b.order ?? 999;
            if (orderA !== orderB) return orderA - orderB;
            return a.name.localeCompare(b.name);
        });
    } catch (error) {
        console.error('Error fetching units:', error);
        return DEFAULT_UNITS.map(unit => ({ id: unit.symbol.toLowerCase(), ...unit }));
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
