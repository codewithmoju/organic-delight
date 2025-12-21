import {
    collection,
    getDocs,
    query,
    where,
    Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { POSTransaction } from '../types';

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
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const transactionsRef = collection(db, 'pos_transactions');
    const q = query(
        transactionsRef,
        where('status', '==', 'completed'),
        where('created_at', '>=', Timestamp.fromDate(startDate))
    );

    const snapshot = await getDocs(q);
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
