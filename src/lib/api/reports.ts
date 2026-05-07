import {
    collection,
    doc,
    getDocs,
    addDoc,
    updateDoc,
    query,
    where,
    orderBy,
    Timestamp,
    runTransaction
} from 'firebase/firestore';
import { db } from '../firebase';
import { DailyOperationsReport } from '../types';
import { getExpenses, getCashExpenses } from './expenses';
import { getPurchases } from './purchases';
import { requireCurrentUserId } from './userScope';
import { getOrgScopeFilter } from './orgScope';

// ============================================
// DAILY OPERATIONS REPORT
// ============================================

/**
 * Generate daily operations report
 * Aggregates all financial data for a given date
 */
export async function generateDailyReport(date: Date): Promise<DailyOperationsReport> {
    const userId = requireCurrentUserId();
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get POS transactions for the day
    const posTransactionsRef = collection(db, 'pos_transactions');
    let posSnapshot;

    try {
        const q = query(
            posTransactionsRef,
            where('cashier_id', '==', userId),
            where('status', '==', 'completed'),
            where('created_at', '>=', Timestamp.fromDate(startOfDay)),
            where('created_at', '<=', Timestamp.fromDate(endOfDay)),
            orderBy('created_at', 'desc')
        );
        posSnapshot = await getDocs(q);
    } catch (error) {
        console.warn('Error querying POS transactions:', error);
        posSnapshot = { docs: [] };
    }

    // Filter by date client-side
    const dayTransactions = posSnapshot.docs.map(doc => ({
        ...doc.data(),
        created_at: doc.data().created_at?.toDate() || new Date()
    }));

    // Calculate sales by payment method
    let cashSales = 0;
    let cardSales = 0;
    let digitalSales = 0;
    let creditSales = 0;
    let totalDiscounts = 0;
    let totalCostOfGoods = 0;

    for (const tx of dayTransactions) {
        const amount = tx.total_amount || 0;

        if (tx.is_credit_sale) {
            creditSales += amount;
        } else {
            switch (tx.payment_method) {
                case 'cash':
                    cashSales += amount;
                    break;
                case 'card':
                    cardSales += amount;
                    break;
                case 'digital':
                    digitalSales += amount;
                    break;
            }
        }

        totalDiscounts += (tx.discount_amount || 0) + (tx.profit_discount || 0) + (tx.price_discount || 0);
        totalCostOfGoods += tx.cost_of_goods || 0;
    }

    const totalSales = cashSales + cardSales + digitalSales + creditSales;

    // Get returns for the day
    const returnsRef = collection(db, 'pos_returns');
    let totalReturns = 0;
    let returnsCount = 0;
    const scope = getOrgScopeFilter();

    try {
        const returnsSnapshot = await getDocs(
            query(returnsRef, where(scope.field, '==', scope.value), orderBy('created_at', 'desc'))
        );
        const dayReturns = returnsSnapshot.docs
            .map(doc => ({
                ...doc.data(),
                created_at: doc.data().created_at?.toDate() || new Date()
            }))
            .filter(r => {
                const rDate = new Date(r.created_at);
                return r.created_by === userId && rDate >= startOfDay && rDate <= endOfDay;
            });

        totalReturns = dayReturns.reduce((sum, r) => sum + (r.total_refund || 0), 0);
        returnsCount = dayReturns.length;
    } catch (error) {
        console.warn('Error fetching returns:', error);
    }

    // Get expenses for the day
    const expenses = await getExpenses(startOfDay, endOfDay);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const cashExpenses = await getCashExpenses(date);

    // Get purchases for the day
    const purchases = await getPurchases(startOfDay, endOfDay);
    const totalPurchases = purchases.reduce((sum, p) => sum + p.total_amount, 0);

    // Get vendor payments for the day
    let vendorPayments = 0;
    try {
        const vendorPaymentsRef = collection(db, 'vendor_payments');
        const vpSnapshot = await getDocs(
            query(vendorPaymentsRef, where(scope.field, '==', scope.value), orderBy('payment_date', 'desc'))
        );
        const dayVP = vpSnapshot.docs
            .map(doc => ({
                ...doc.data(),
                payment_date: doc.data().payment_date?.toDate() || new Date()
            }))
            .filter(vp => {
                const vpDate = new Date(vp.payment_date);
                return vpDate >= startOfDay && vpDate <= endOfDay;
            });
        vendorPayments = dayVP.reduce((sum, vp) => sum + (vp.amount || 0), 0);
    } catch (error) {
        console.warn('Error fetching vendor payments:', error);
    }

    // Get customer collections for the day
    let customerCollections = 0;
    try {
        const customerPaymentsRef = collection(db, 'customer_payments');
        const cpSnapshot = await getDocs(
            query(customerPaymentsRef, where(scope.field, '==', scope.value), orderBy('payment_date', 'desc'))
        );
        const dayCP = cpSnapshot.docs
            .map(doc => ({
                ...doc.data(),
                payment_date: doc.data().payment_date?.toDate() || new Date()
            }))
            .filter(cp => {
                const cpDate = new Date(cp.payment_date);
                return cpDate >= startOfDay && cpDate <= endOfDay;
            });
        customerCollections = dayCP.reduce((sum, cp) => sum + (cp.amount || 0), 0);
    } catch (error) {
        console.warn('Error fetching customer payments:', error);
    }

    // Calculate cash on hand
    // Cash In: Cash sales + Customer collections
    // Cash Out: Cash expenses + Vendor payments (cash only - simplified)
    const cashOnHand = cashSales + customerCollections - cashExpenses - vendorPayments - totalReturns;

    // Calculate profits
    const grossProfit = totalSales - totalCostOfGoods;
    const netProfit = grossProfit - totalExpenses;

    // Average transaction value
    const transactionsCount = dayTransactions.length;
    const averageTransactionValue = transactionsCount > 0 ? totalSales / transactionsCount : 0;

    return {
        date,
        cash_sales: cashSales,
        credit_sales: creditSales,
        card_sales: cardSales,
        digital_sales: digitalSales,
        total_sales: totalSales,
        total_discounts: totalDiscounts,
        total_returns: totalReturns,
        total_expenses: totalExpenses,
        total_purchases: totalPurchases,
        vendor_payments: vendorPayments,
        customer_collections: customerCollections,
        cash_on_hand: cashOnHand,
        gross_profit: grossProfit,
        net_profit: netProfit,
        transactions_count: transactionsCount,
        returns_count: returnsCount,
        average_transaction_value: averageTransactionValue
    };
}

/**
 * Get weekly report summary.
 * Fetches all data for the week in parallel, groups by day client-side.
 * Reduces 49 queries to ~7.
 */
export async function getWeeklyReportSummary(endDate: Date) {
    const userId = requireCurrentUserId();
    const scope = getOrgScopeFilter();

    // Calculate week range
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 6);
    startDate.setHours(0, 0, 0, 0);
    const endOfRange = new Date(endDate);
    endOfRange.setHours(23, 59, 59, 999);

    const startTs = Timestamp.fromDate(startDate);
    const endTs = Timestamp.fromDate(endOfRange);

    // Fetch all data for the week in parallel
    const [posSnap, returnsSnap, vendorPaySnap, customerPaySnap, expenses, purchases] = await Promise.all([
        getDocs(query(
            collection(db, 'pos_transactions'),
            where('cashier_id', '==', userId),
            where('status', '==', 'completed'),
            where('created_at', '>=', startTs),
            where('created_at', '<=', endTs)
        )),
        getDocs(query(
            collection(db, 'pos_returns'),
            where(scope.field, '==', scope.value),
            where('created_at', '>=', startTs),
            where('created_at', '<=', endTs)
        )),
        getDocs(query(
            collection(db, 'vendor_payments'),
            where(scope.field, '==', scope.value),
            where('payment_date', '>=', startTs),
            where('payment_date', '<=', endTs)
        )),
        getDocs(query(
            collection(db, 'customer_payments'),
            where(scope.field, '==', scope.value),
            where('payment_date', '>=', startTs),
            where('payment_date', '<=', endTs)
        )),
        getExpenses(startDate, endOfRange),
        getPurchases(startDate, endOfRange),
    ]);

    // Helper to get day key (YYYY-MM-DD)
    const dayKey = (d: Date) => d.toISOString().slice(0, 10);

    // Initialize per-day buckets
    const dayBuckets: Record<string, {
        posTxs: any[];
        returns: any[];
        vendorPayments: number;
        customerCollections: number;
        expenses: number;
        cashExpenses: number;
        purchases: number;
    }> = {};

    for (let i = 0; i < 7; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        dayBuckets[dayKey(d)] = {
            posTxs: [], returns: [], vendorPayments: 0,
            customerCollections: 0, expenses: 0, cashExpenses: 0, purchases: 0,
        };
    }

    // Distribute POS transactions by day
    posSnap.forEach((doc) => {
        const data = doc.data();
        const date = data.created_at?.toDate?.() || new Date(data.created_at);
        const key = dayKey(date);
        if (dayBuckets[key]) dayBuckets[key].posTxs.push(data);
    });

    // Distribute returns by day
    returnsSnap.forEach((doc) => {
        const data = doc.data();
        if (data.created_by !== userId) return;
        const date = data.created_at?.toDate?.() || new Date(data.created_at);
        const key = dayKey(date);
        if (dayBuckets[key]) dayBuckets[key].returns.push(data);
    });

    // Distribute vendor payments by day
    vendorPaySnap.forEach((doc) => {
        const data = doc.data();
        const date = data.payment_date?.toDate?.() || new Date(data.payment_date);
        const key = dayKey(date);
        if (dayBuckets[key]) dayBuckets[key].vendorPayments += data.amount || 0;
    });

    // Distribute customer payments by day
    customerPaySnap.forEach((doc) => {
        const data = doc.data();
        const date = data.payment_date?.toDate?.() || new Date(data.payment_date);
        const key = dayKey(date);
        if (dayBuckets[key]) dayBuckets[key].customerCollections += data.amount || 0;
    });

    // Distribute expenses by day
    for (const exp of expenses) {
        const key = dayKey(new Date(exp.expense_date || exp.created_at));
        if (dayBuckets[key]) {
            dayBuckets[key].expenses += exp.amount || 0;
            if (exp.payment_method === 'cash') dayBuckets[key].cashExpenses += exp.amount || 0;
        }
    }

    // Distribute purchases by day
    for (const pur of purchases) {
        const key = dayKey(new Date(pur.purchase_date || pur.created_at));
        if (dayBuckets[key]) dayBuckets[key].purchases += pur.total_amount || 0;
    }

    // Build daily reports from buckets
    const reports: DailyOperationsReport[] = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        const bucket = dayBuckets[dayKey(d)];

        let cashSales = 0, cardSales = 0, digitalSales = 0, creditSales = 0;
        let totalDiscounts = 0, totalCostOfGoods = 0;

        for (const tx of bucket.posTxs) {
            const amount = tx.total_amount || 0;
            if (tx.is_credit_sale) { creditSales += amount; }
            else {
                switch (tx.payment_method) {
                    case 'cash': cashSales += amount; break;
                    case 'card': cardSales += amount; break;
                    case 'digital': digitalSales += amount; break;
                }
            }
            totalDiscounts += (tx.discount_amount || 0) + (tx.profit_discount || 0) + (tx.price_discount || 0);
            totalCostOfGoods += tx.cost_of_goods || 0;
        }

        const totalSales = cashSales + cardSales + digitalSales + creditSales;
        const totalReturns = bucket.returns.reduce((sum, r) => sum + (r.total_refund || 0), 0);
        const grossProfit = totalSales - totalCostOfGoods;
        const netProfit = grossProfit - bucket.expenses;
        const cashOnHand = cashSales + bucket.customerCollections - bucket.cashExpenses - bucket.vendorPayments - totalReturns;
        const txCount = bucket.posTxs.length;

        reports.push({
            date: d,
            cash_sales: cashSales,
            credit_sales: creditSales,
            card_sales: cardSales,
            digital_sales: digitalSales,
            total_sales: totalSales,
            total_discounts: totalDiscounts,
            total_returns: totalReturns,
            total_expenses: bucket.expenses,
            total_purchases: bucket.purchases,
            vendor_payments: bucket.vendorPayments,
            customer_collections: bucket.customerCollections,
            cash_on_hand: cashOnHand,
            gross_profit: grossProfit,
            net_profit: netProfit,
            transactions_count: txCount,
            returns_count: bucket.returns.length,
            average_transaction_value: txCount > 0 ? totalSales / txCount : 0,
        });
    }

    const totalSales = reports.reduce((sum, r) => sum + r.total_sales, 0);
    const totalExpenses = reports.reduce((sum, r) => sum + r.total_expenses, 0);
    const totalProfit = reports.reduce((sum, r) => sum + r.net_profit, 0);
    const totalTransactions = reports.reduce((sum, r) => sum + r.transactions_count, 0);

    return {
        reports,
        summary: {
            totalSales,
            totalExpenses,
            totalProfit,
            totalTransactions,
            averageDailySales: totalSales / 7,
            averageDailyProfit: totalProfit / 7
        }
    };
}

/**
 * Get monthly report summary
 */
export async function getMonthlyReportSummary(year: number, month: number) {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0); // Last day of month

    // For monthly, we'll aggregate differently to avoid too many queries
    const report = await generateDailyReport(new Date()); // Today as sample

    return {
        period: `${year}-${(month + 1).toString().padStart(2, '0')}`,
        startDate,
        endDate,
        // Add actual monthly aggregation logic here
    };
}
