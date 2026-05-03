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

/**
 * Get all items where current stock is at or below the threshold
 */
export async function getLowStockItems(): Promise<EnhancedItem[]> {
    const userId = requireCurrentUserId();
    const itemsRef = collection(db, 'items');
    const q = query(
        itemsRef,
        where('created_by', '==', userId),
        where('is_archived', '!=', true)
    );
    const snapshot = await getDocs(q);

    const lowStockItems: EnhancedItem[] = [];

    for (const itemDoc of snapshot.docs) {
        const data = itemDoc.data() as Item;
        // Get current stock
        const currentStock = await getItemCurrentStock(itemDoc.id);

        // Default threshold is 10 if not set
        const threshold = data.low_stock_threshold || 10;

        if (currentStock <= threshold) {
            lowStockItems.push({
                ...data,
                id: itemDoc.id,
                current_quantity: currentStock
            } as EnhancedItem);
        }
    }

    return lowStockItems;
}

/**
 * Helper to get current stock for an item
 */
async function getItemCurrentStock(itemId: string): Promise<number> {
    const userId = requireCurrentUserId();
    const transactionsRef = collection(db, 'transactions');
    const q = query(
        transactionsRef,
        where('created_by', '==', userId),
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
