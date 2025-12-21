import {
    collection,
    getDocs,
    query,
    where,
    orderBy
} from 'firebase/firestore';
import { db } from '../firebase';
import { Transaction } from '../types';

export interface ValuationBatch {
    quantity: number;
    unit_price: number;
    date: Date;
}

export interface ItemValuation {
    item_id: string;
    item_name: string;
    current_stock: number;
    total_value: number;
    method: 'FIFO' | 'LIFO';
    batches: ValuationBatch[];
}

/**
 * Calculate the total inventory value using FIFO (First-In First-Out)
 * or LIFO (Last-In First-Out) methods.
 */
export async function calculateInventoryValuation(method: 'FIFO' | 'LIFO' = 'FIFO') {
    // 1. Get all movements
    const transactionsRef = collection(db, 'transactions');
    const itemsRef = collection(db, 'items');

    const [itemsSnap, transactionsSnap] = await Promise.all([
        getDocs(query(itemsRef, where('is_archived', '!=', true))),
        getDocs(query(transactionsRef, orderBy('transaction_date', 'asc')))
    ]);

    const itemsMap = new Map();
    itemsSnap.docs.forEach(doc => itemsMap.set(doc.id, doc.data().name));

    const inventory: { [key: string]: ValuationBatch[] } = {};

    // Process transactions sequentially to build batches
    transactionsSnap.docs.forEach(doc => {
        const t = doc.data() as Transaction;
        if (!inventory[t.item_id]) inventory[t.item_id] = [];

        if (t.type === 'stock_in') {
            // Add a new batch
            inventory[t.item_id].push({
                quantity: t.quantity,
                unit_price: t.unit_price,
                date: t.transaction_date instanceof Date ? t.transaction_date : (t.transaction_date as any).toDate()
            });
        } else {
            // Stock out: Remove quantity using selected method
            let qtyToRemove = t.quantity;

            while (qtyToRemove > 0 && inventory[t.item_id].length > 0) {
                // FIFO: Remove from start, LIFO: Remove from end
                const batchIndex = method === 'FIFO' ? 0 : inventory[t.item_id].length - 1;
                const batch = inventory[t.item_id][batchIndex];

                if (batch.quantity <= qtyToRemove) {
                    qtyToRemove -= batch.quantity;
                    inventory[t.item_id].splice(batchIndex, 1);
                } else {
                    batch.quantity -= qtyToRemove;
                    qtyToRemove = 0;
                }
            }
        }
    });

    // Calculate finals
    const results: ItemValuation[] = [];
    let totalWarehouseValue = 0;

    for (const [itemId, batches] of Object.entries(inventory)) {
        const stock = batches.reduce((sum, b) => sum + b.quantity, 0);
        const value = batches.reduce((sum, b) => sum + (b.quantity * b.unit_price), 0);

        if (stock > 0) {
            results.push({
                item_id: itemId,
                item_name: itemsMap.get(itemId) || 'Unknown Item',
                current_stock: stock,
                total_value: value,
                method,
                batches
            });
            totalWarehouseValue += value;
        }
    }

    return {
        items: results,
        totalValue: totalWarehouseValue,
        method
    };
}
