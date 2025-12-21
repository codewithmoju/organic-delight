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

// ============================================
// DAILY OPERATIONS REPORT
// ============================================

/**
 * Generate daily operations report
 * Aggregates all financial data for a given date
 */
export async function generateDailyReport(date: Date): Promise<DailyOperationsReport> {
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
            where('status', '==', 'completed'),
            orderBy('created_at', 'desc')
        );
        posSnapshot = await getDocs(q);
    } catch (error) {
        console.warn('Error querying POS transactions:', error);
        posSnapshot = { docs: [] };
    }

    // Filter by date client-side
    const dayTransactions = posSnapshot.docs
        .map(doc => ({
            ...doc.data(),
            created_at: doc.data().created_at?.toDate() || new Date()
        }))
        .filter(t => {
            const txDate = new Date(t.created_at);
            return txDate >= startOfDay && txDate <= endOfDay;
        });

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

    try {
        const returnsSnapshot = await getDocs(query(returnsRef, orderBy('created_at', 'desc')));
        const dayReturns = returnsSnapshot.docs
            .map(doc => ({
                ...doc.data(),
                created_at: doc.data().created_at?.toDate() || new Date()
            }))
            .filter(r => {
                const rDate = new Date(r.created_at);
                return rDate >= startOfDay && rDate <= endOfDay;
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
    const purchases = await getPurchases({ start_date: startOfDay, end_date: endOfDay });
    const totalPurchases = purchases.reduce((sum, p) => sum + p.total_amount, 0);

    // Get vendor payments for the day
    let vendorPayments = 0;
    try {
        const vendorPaymentsRef = collection(db, 'vendor_payments');
        const vpSnapshot = await getDocs(query(vendorPaymentsRef, orderBy('payment_date', 'desc')));
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
        const cpSnapshot = await getDocs(query(customerPaymentsRef, orderBy('payment_date', 'desc')));
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
 * Get weekly report summary
 */
export async function getWeeklyReportSummary(endDate: Date) {
    const reports: DailyOperationsReport[] = [];

    for (let i = 6; i >= 0; i--) {
        const date = new Date(endDate);
        date.setDate(date.getDate() - i);
        const report = await generateDailyReport(date);
        reports.push(report);
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
