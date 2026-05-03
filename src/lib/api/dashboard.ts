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
import { readScopedJSON, writeScopedJSON, removeScopedKey } from '../utils/storageScope';

// In-memory cache for dashboard data
const dashboardCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const DASHBOARD_READ_MODEL_KEY = 'dashboard_read_model_cache';

function getCacheKey(period: TimePeriod): string {
  const userId = requireCurrentUserId();
  return `dashboard-metrics-${userId}-${period}`;
}

function isCacheValid(timestamp: number): boolean {
  return Date.now() - timestamp < CACHE_DURATION;
}

type PersistedReadModel = Record<string, { data: any; timestamp: number }>;

function readPersistedCache(cacheKey: string) {
  const model = readScopedJSON<PersistedReadModel>(DASHBOARD_READ_MODEL_KEY, {}, undefined, DASHBOARD_READ_MODEL_KEY);
  const entry = model[cacheKey];
  if (!entry || !isCacheValid(entry.timestamp)) return null;
  return entry.data;
}

function writePersistedCache(cacheKey: string, data: any) {
  const model = readScopedJSON<PersistedReadModel>(DASHBOARD_READ_MODEL_KEY, {}, undefined, DASHBOARD_READ_MODEL_KEY);
  model[cacheKey] = { data, timestamp: Date.now() };
  writeScopedJSON(DASHBOARD_READ_MODEL_KEY, model);
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
  const cached = dashboardCache.get(cacheKey);

  if (cached && isCacheValid(cached.timestamp)) {
    return cached.data;
  }
  const persisted = readPersistedCache(cacheKey);
  if (persisted) {
    dashboardCache.set(cacheKey, { data: persisted, timestamp: Date.now() });
    return persisted;
  }

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

  dashboardCache.set(cacheKey, { data: result, timestamp: Date.now() });
  writePersistedCache(cacheKey, result);
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
  const userId = requireCurrentUserId();
  const cacheKey = `stock-levels-${userId}`;
  const cached = dashboardCache.get(cacheKey);

  if (cached && isCacheValid(cached.timestamp)) {
    return cached.data;
  }
  const persisted = readPersistedCache(cacheKey);
  if (persisted) {
    dashboardCache.set(cacheKey, { data: persisted, timestamp: Date.now() });
    return persisted;
  }

  const scope = getOrgScopeFilter();
  const itemsSnapshot = await getDocs(query(collection(db, 'items'), where(scope.field, '==', scope.value)));

  const stockLevels: any[] = [];
  for (const itemDoc of itemsSnapshot.docs) {
    const data = itemDoc.data();
    const current_quantity = data.current_quantity ?? 0;
    stockLevels.push({
      item_id: itemDoc.id,
      current_quantity,
      total_value: current_quantity * (data.unit_price || 0),
      item: { id: itemDoc.id, ...data }
    });
  }

  const result = stockLevels.sort((a, b) => b.total_value - a.total_value);
  dashboardCache.set(cacheKey, { data: result, timestamp: Date.now() });
  writePersistedCache(cacheKey, result);
  return result;
}

export function clearDashboardCache() {
  dashboardCache.clear();
  removeScopedKey(DASHBOARD_READ_MODEL_KEY);
}

/**
 * Fetch all data needed for the new dashboard widgets in one call.
 * Returns profit/loss figures, cash flow, expense breakdown, vendors, and customers.
 */
export async function getDashboardWidgetData(period: TimePeriod) {
  const userId = requireCurrentUserId();
  const cacheKey = `dashboard-widgets-${userId}-${period}`;
  const cached = dashboardCache.get(cacheKey);
  if (cached && isCacheValid(cached.timestamp)) return cached.data;
  const persisted = readPersistedCache(cacheKey);
  if (persisted) {
    dashboardCache.set(cacheKey, { data: persisted, timestamp: Date.now() });
    return persisted;
  }

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

  dashboardCache.set(cacheKey, { data: result, timestamp: Date.now() });
  writePersistedCache(cacheKey, result);
  return result;
}