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

// In-memory cache for dashboard data
const dashboardCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function getCacheKey(period: TimePeriod): string {
  const userId = requireCurrentUserId();
  return `dashboard-metrics-${userId}-${period}`;
}

function isCacheValid(timestamp: number): boolean {
  return Date.now() - timestamp < CACHE_DURATION;
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

  const { start, end } = getDateRangeForPeriod(period);

  const q = query(
    collection(db, 'transactions'),
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
    if (t.created_by !== userId) return;

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

  const itemsSnapshot = await getDocs(collection(db, 'items'));

  const stockLevels: any[] = [];
  for (const itemDoc of itemsSnapshot.docs) {
    const data = itemDoc.data();
    if (data.created_by !== userId) continue;
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
  return result;
}

export function clearDashboardCache() {
  dashboardCache.clear();
}