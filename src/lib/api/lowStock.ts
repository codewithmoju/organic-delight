import {
    collection,
    getDocs,
    query,
    where,
    doc,
    getDoc,
    updateDoc,
    Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { Item, EnhancedItem } from '../types';
import { requireCurrentUserId } from './userScope';
import { getOrgScopeFilter } from './orgScope';

/**
 * Get all items where current stock is at or below the threshold.
 * Fetches items + all transactions in parallel, builds stock map in memory.
 * Reduces N+1 queries to 2 total.
 */
export async function getLowStockItems(): Promise<EnhancedItem[]> {
    const scope = getOrgScopeFilter();

    // Fetch items and all transactions in parallel
    const [itemsSnap, txSnap] = await Promise.all([
        getDocs(query(
            collection(db, 'items'),
            where(scope.field, '==', scope.value),
            where('is_archived', '!=', true)
        )),
        getDocs(query(
            collection(db, 'transactions'),
            where(scope.field, '==', scope.value)
        )),
    ]);

    // Build stock map from transactions
    const stockMap: Record<string, number> = {};
    txSnap.forEach((txDoc) => {
        const t = txDoc.data();
        const id = t.item_id;
        if (!stockMap[id]) stockMap[id] = 0;
        if (t.type === 'stock_in') stockMap[id] += t.quantity;
        if (t.type === 'stock_out') stockMap[id] -= t.quantity;
    });

    // Filter items by stock threshold
    const lowStockItems: EnhancedItem[] = [];
    itemsSnap.forEach((itemDoc) => {
        const data = itemDoc.data() as Item;
        const threshold = data.low_stock_threshold || 10;
        const currentStock = Math.max(0, stockMap[itemDoc.id] || 0);

        if (currentStock <= threshold) {
            lowStockItems.push({
                ...data,
                id: itemDoc.id,
                current_quantity: currentStock
            } as EnhancedItem);
        }
    });

    return lowStockItems;
}

/**
 * Helper to get current stock for an item
 */
async function getItemCurrentStock(itemId: string): Promise<number> {
    const scope = getOrgScopeFilter();
    const transactionsRef = collection(db, 'transactions');
    const q = query(
        transactionsRef,
        where(scope.field, '==', scope.value),
        where('item_id', '==', itemId)
    );
    const snapshot = await getDocs(q);

    let stock = 0;
    snapshot.docs.forEach(doc => {
        const t = doc.data();
        if (t.type === 'stock_in') stock += t.quantity;
        if (t.type === 'stock_out') stock -= t.quantity;
    });

    return Math.max(0, stock);
}

/**
 * Update the low stock threshold for an item
 */
export async function updateLowStockThreshold(itemId: string, threshold: number): Promise<void> {
    const userId = requireCurrentUserId();
    const itemRef = doc(db, 'items', itemId);
    const itemSnap = await getDoc(itemRef);
    if (!itemSnap.exists() || itemSnap.data().created_by !== userId) {
        throw new Error('Item not found');
    }
    await updateDoc(itemRef, {
        low_stock_threshold: threshold,
        updated_at: Timestamp.fromDate(new Date())
    });
}
