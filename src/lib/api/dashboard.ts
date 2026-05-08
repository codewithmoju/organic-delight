import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { TimePeriod } from '../../components/dashboard/TimePeriodFilter';
import { getDateRangeForPeriod } from '../utils/dateFilters';
import { DashboardMetrics } from '../types';
import { requireCurrentUserId } from './userScope';
import { getOrgScopeFilter } from './orgScope';
import { useEntityStore } from '../store/entities';

// Simple TTL cache for dashboard data (period-specific queries don't fit entity store)
const dashboardCacheMap = new Map<string, { data: any; at: number }>();
const DASHBOARD_STALE_MS = 5 * 60 * 1000;

function getCached(key: string): any | null {
  const entry = dashboardCacheMap.get(key);
  if (!entry) return null;
  if (Date.now() - entry.at > DASHBOARD_STALE_MS) { dashboardCacheMap.delete(key); return null; }
  return entry.data;
}
function setCache(key: string, data: any) {
  dashboardCacheMap.set(key, { data, at: Date.now() });
}

/**
 * Fetches transactions once and derives both metrics + trend data from the
 * same snapshot, halving the number of Firestore reads.
 */
export async function getDashboardMetricsAndTrends(period: TimePeriod): Promise<{
  metrics: DashboardMetrics;
  trends: ReturnType<typeof buildTrends>;
}> {
  const userId = requireCurrentUserId();
  const cacheKey = `dashboard-combined-${userId}-${period}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const { start, end } = getDateRangeForPeriod(period);

  const scope = getOrgScopeFilter();
  const q = query(
    collection(db, 'transactions'),
    where(scope.field, '==', scope.value),
    where('transaction_date', '>=', Timestamp.fromDate(start)),
    where('transaction_date', '<=', Timestamp.fromDate(end)),
    orderBy('transaction_date', 'desc')
  );

  const snapshot = await getDocs(q);

  let totalStockIn = 0;
  let totalStockOut = 0;
  let revenueSpentOnStockIn = 0;
  let revenueEarnedFromStockOut = 0;
  const trendData: Record<string, { period: string; stockIn: number; stockOut: number; revenueIn: number; revenueOut: number }> = {};

  snapshot.docs.forEach(doc => {
    const t = doc.data();

    // Metrics
    if (t.type === 'stock_in') {
      totalStockIn += t.quantity;
      revenueSpentOnStockIn += t.total_value;
    } else if (t.type === 'stock_out') {
      totalStockOut += t.quantity;
      revenueEarnedFromStockOut += t.total_value;
    }

    // Trends
    const date = t.transaction_date?.toDate ? t.transaction_date.toDate() : new Date(t.transaction_date || Date.now());
    const key = buildPeriodKey(date, period);
    if (!trendData[key]) {
      trendData[key] = { period: key, stockIn: 0, stockOut: 0, revenueIn: 0, revenueOut: 0 };
    }
    if (t.type === 'stock_in') {
      trendData[key].stockIn += t.quantity;
      trendData[key].revenueIn += t.total_value;
    } else {
      trendData[key].stockOut += t.quantity;
      trendData[key].revenueOut += t.total_value;
    }
  });

  const result = {
    metrics: { totalStockIn, totalStockOut, revenueSpentOnStockIn, revenueEarnedFromStockOut },
    trends: Object.values(trendData),
  };

  setCache(cacheKey, result);
  return result;
}

function buildPeriodKey(date: Date, period: TimePeriod): string {
  switch (period) {
    case 'today': return date.getHours().toString().padStart(2, '0') + ':00';
    case 'this-week': return date.toLocaleDateString('en-US', { weekday: 'short' });
    case 'this-month':
    case 'previous-month': return `${date.getDate()}`;
    default: return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}

type TrendItem = { period: string; stockIn: number; stockOut: number; revenueIn: number; revenueOut: number };
function buildTrends(_: TrendItem[]): TrendItem[] { return _; } // type helper only

// Keep legacy exports for backward compat — they now delegate to the combined fetch
export async function getDashboardMetrics(period: TimePeriod): Promise<DashboardMetrics> {
  return (await getDashboardMetricsAndTrends(period)).metrics;
}

export async function getInventoryTrends(period: TimePeriod) {
  return (await getDashboardMetricsAndTrends(period)).trends;
}

export async function getStockLevels() {
  // Read from entity store — zero network calls
  const storeItems = useEntityStore.getState().items.data;

  const stockLevels = storeItems
    .filter(item => item.is_archived !== true)
    .map(item => ({
      item_id: item.id,
      current_quantity: item.current_quantity ?? 0,
      total_value: (item.current_quantity ?? 0) * (item.selling_price || item.unit_price || 0),
      item,
    }));

  return stockLevels.sort((a, b) => b.total_value - a.total_value);
}

export function clearDashboardCache() {
  dashboardCacheMap.clear();
}

/**
 * Fetch all data needed for the new dashboard widgets in one call.
 * Returns profit/loss figures, cash flow, expense breakdown, vendors, and customers.
 */
export async function getDashboardWidgetData(period: TimePeriod) {
  const userId = requireCurrentUserId();
  const cacheKey = `dashboard-widgets-${userId}-${period}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const { start, end } = getDateRangeForPeriod(period);

  // ── Parallel fetches ──────────────────────────────────────────────────
  const scope = getOrgScopeFilter();
  const [expensesSnap, purchasesSnap, vendorsSnap, customersSnap] = await Promise.all([
    getDocs(query(
      collection(db, 'expenses'),
      where(scope.field, '==', scope.value),
      where('expense_date', '>=', Timestamp.fromDate(start)),
      where('expense_date', '<=', Timestamp.fromDate(end))
    )),
    getDocs(query(
      collection(db, 'purchases'),
      where(scope.field, '==', scope.value),
      where('purchase_date', '>=', Timestamp.fromDate(start)),
      where('purchase_date', '<=', Timestamp.fromDate(end))
    )),
    getDocs(query(collection(db, 'vendors'), where(scope.field, '==', scope.value), orderBy('outstanding_balance', 'desc'))),
    getDocs(query(collection(db, 'customers'), where(scope.field, '==', scope.value), orderBy('outstanding_balance', 'desc'))),
  ]);

  // ── Expenses ──────────────────────────────────────────────────────────
  const categoryMap: Record<string, number> = {};
  let totalExpenses = 0;
  let cashExpenses = 0;

  expensesSnap.docs.forEach(d => {
    const e = d.data();
    totalExpenses += e.amount || 0;
    if (e.payment_method === 'cash') cashExpenses += e.amount || 0;
    categoryMap[e.category] = (categoryMap[e.category] || 0) + (e.amount || 0);
  });

  const expenseBreakdown = Object.entries(categoryMap)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);

  // ── Purchases ─────────────────────────────────────────────────────────
  let totalPurchases = 0;
  let vendorPaymentsOut = 0;
  purchasesSnap.docs.forEach(d => {
    const p = d.data();
    totalPurchases += p.total_amount || 0;
    vendorPaymentsOut += p.paid_amount || 0;
  });

  // ── Vendors ───────────────────────────────────────────────────────────
  const vendors = vendorsSnap.docs
    .map(d => ({ id: d.id, ...d.data(), created_at: d.data().created_at?.toDate?.() || new Date(), updated_at: d.data().updated_at?.toDate?.() || new Date() }))
    .filter((v: any) => v.is_active !== false);

  // ── Customers ─────────────────────────────────────────────────────────
  const customers = customersSnap.docs
    .map(d => ({ id: d.id, ...d.data(), created_at: d.data().created_at?.toDate?.() || new Date(), updated_at: d.data().updated_at?.toDate?.() || new Date() }))
    .filter((c: any) => c.is_active !== false);

  const result = {
    totalExpenses,
    cashExpenses,
    totalPurchases,
    vendorPaymentsOut,
    expenseBreakdown,
    vendors,
    customers,
  };

  setCache(cacheKey, result);
  return result;
}