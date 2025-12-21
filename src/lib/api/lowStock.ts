import {
    collection,
    getDocs,
    query,
    where,
    doc,
    updateDoc,
    Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { Item, EnhancedItem } from '../types';

/**
 * Get all items where current stock is at or below the threshold
 */
export async function getLowStockItems(): Promise<EnhancedItem[]> {
    const itemsRef = collection(db, 'items');
    const q = query(itemsRef, where('is_archived', '!=', true));
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
    const transactionsRef = collection(db, 'transactions');
    const q = query(transactionsRef, where('item_id', '==', itemId));
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
    const itemRef = doc(db, 'items', itemId);
    await updateDoc(itemRef, {
        low_stock_threshold: threshold,
        updated_at: Timestamp.fromDate(new Date())
    });
}
