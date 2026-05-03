import {
    collection,
    getDocs,
    query,
    where,
    Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { POSTransaction } from '../types';
import { requireCurrentUserId } from './userScope';

export interface ProductRanking {
    name: string;
    quantity: number;
    revenue: number;
    profit: number;
    margin: number;
}

/**
 * Get product performance metrics over a date range
 */
export async function getProductPerformance(days: number = 30): Promise<ProductRanking[]> {
    const userId = requireCurrentUserId();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const transactionsRef = collection(db, 'pos_transactions');
    let snapshot;

    try {
        const q = query(
            transactionsRef,
            where('cashier_id', '==', userId),
            where('status', '==', 'completed'),
            where('created_at', '>=', Timestamp.fromDate(startDate))
        );
        snapshot = await getDocs(q);
    } catch (error: any) {
        // Fallback while composite index is missing/building: fetch completed and filter date in memory.
        if (!error?.message?.includes('index')) {
            throw error;
        }

        const fallbackQuery = query(
            transactionsRef,
            where('cashier_id', '==', userId),
            where('status', '==', 'completed')
        );
        const fallbackSnapshot = await getDocs(fallbackQuery);
        const minTime = startDate.getTime();

        const filteredDocs = fallbackSnapshot.docs.filter((doc) => {
            const data = doc.data() as any;
            const createdAt = data.created_at?.toDate ? data.created_at.toDate() : new Date(data.created_at || 0);
            return createdAt.getTime() >= minTime;
        });

        snapshot = { docs: filteredDocs } as typeof fallbackSnapshot;
    }

    const performance: { [key: string]: { qty: number, revenue: number, cost: number } } = {};

    snapshot.docs.forEach(doc => {
        const t = doc.data() as POSTransaction;
        t.items.forEach(item => {
            if (!performance[item.item_name]) {
                performance[item.item_name] = { qty: 0, revenue: 0, cost: 0 };
            }

            performance[item.item_name].qty += item.quantity;
            performance[item.item_name].revenue += item.line_total;

            // Calculate cost (using purchase_rate if available, fallback to unit_price * 0.7 as estimate if missing)
            // Ideal integration: POS stores cost_at_sale
            const costRate = item.purchase_rate || (item.unit_price * 0.7);
            performance[item.item_name].cost += (item.quantity * costRate);
        });
    });

    return Object.entries(performance).map(([name, stats]) => {
        const profit = stats.revenue - stats.cost;
        return {
            name,
            quantity: stats.qty,
            revenue: stats.revenue,
            profit: profit,
            margin: stats.revenue > 0 ? (profit / stats.revenue) * 100 : 0
        };
    }).sort((a, b) => b.profit - a.profit);
}
