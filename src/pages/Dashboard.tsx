import { useEffect, useState, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Package, DollarSign, TrendingUp, ArrowUp, ArrowDown, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { getItems } from '../lib/api/items';
import { getPOSTransactions } from '../lib/api/pos';
import { getDashboardMetricsAndTrends } from '../lib/api/dashboard';
import StatCard from '../components/ui/StatCard';
import RecentTransactions from '../components/dashboard/RecentTransactions';
import TopProductCard from '../components/dashboard/TopProductCard';
import { TimePeriod } from '../components/dashboard/TimePeriodFilter';
import { POSTransaction, DashboardMetrics } from '../lib/types';
import { formatCurrency } from '../lib/utils/notifications';
import { useTranslation } from 'react-i18next';
import ContextualLoader from '../components/ui/ContextualLoader';
import DashboardSkeleton from '../components/skeletons/DashboardSkeleton';

// Lazy-load the chart — it's below the fold and pulls in recharts (~400KB)
const MetricsChart = lazy(() => import('../components/dashboard/MetricsChart'));

const LS_SUMMARY = 'dashboard_summary_cache';
const LS_TRANSACTIONS = 'dashboard_transactions_cache';
const LS_METRICS = 'dashboard_metrics_cache';

function readCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function writeCache(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota */ }
}

export default function Dashboard() {
  const { t } = useTranslation();
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('this-month');

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(() => readCache(LS_METRICS));
  const [chartData, setChartData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(() => readCache(LS_SUMMARY));
  const [transactions, setTransactions] = useState<POSTransaction[]>(() => readCache<POSTransaction[]>(LS_TRANSACTIONS) ?? []);
  const [topProduct, setTopProduct] = useState<any>(null);

  const [isLoading, setIsLoading] = useState(() => !localStorage.getItem(LS_SUMMARY));
  const [isMetricsLoading, setIsMetricsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load static data (items + recent sales) once on mount
  useEffect(() => {
    const hasCache = !!summary;
    loadInitialData(!hasCache);
  }, []);

  // Load metrics + trends whenever period changes
  useEffect(() => {
    loadMetricsData();
  }, [selectedPeriod]);

  async function loadInitialData(showLoading = true) {
    if (showLoading) setIsLoading(true);
    try {
      // Two parallel fetches instead of three — items gives us summary,
      // POS transactions gives us the recent orders list.
      const [itemsResult, recentSales] = await Promise.all([
        getItems(),
        getPOSTransactions(5),
      ]);

      const items = itemsResult.items || [];

      // Summary stats derived client-side — no extra query needed
      const totalValue = items.reduce((acc: number, item: any) =>
        acc + ((item.current_quantity || 0) * (item.unit_price || 0)), 0);
      const lowStock = items.filter((item: any) =>
        (item.current_quantity || 0) <= (item.low_stock_threshold || 0));

      // Top product: highest stock value as a fast proxy (no extra query)
      const topItem = items.length > 0
        ? items.reduce((prev: any, cur: any) =>
            ((cur.current_quantity || 0) * (cur.unit_price || 0)) >
            ((prev.current_quantity || 0) * (prev.unit_price || 0)) ? cur : prev)
        : null;

      const newSummary = {
        totalItems: items.length,
        totalValue,
        lowStockCount: lowStock.length,
        outOfStockCount: items.filter((i: any) => (i.current_quantity || 0) === 0).length,
      };

      setSummary(newSummary);
      setTransactions(recentSales);
      setTopProduct(topItem ? { name: topItem.name, count: topItem.current_quantity || 0, price: topItem.unit_price || 0 } : null);
      setError(null);

      // Persist to localStorage so next visit is instant
      writeCache(LS_SUMMARY, newSummary);
      writeCache(LS_TRANSACTIONS, recentSales);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError(t('dashboard.errors.generic'));
      toast.error(t('dashboard.errors.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  }

  async function loadMetricsData() {
    setIsMetricsLoading(true);
    try {
      // Single Firestore query — derives both metrics and chart data
      const { metrics: m, trends } = await getDashboardMetricsAndTrends(selectedPeriod);
      setMetrics(m);
      setChartData(trends);
      writeCache(LS_METRICS, m);
    } catch (err) {
      console.error('Error loading metrics:', err);
      toast.error(t('dashboard.errors.metricsFailed'));
    } finally {
      setIsMetricsLoading(false);
    }
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center h-full min-h-[60vh]"
      >
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-error-500 mx-auto mb-4" />
          <div className="text-error-400 text-lg font-medium mb-2">{t('common.error')}</div>
          <div className="text-muted-foreground">{error}</div>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      {/* Skeleton for initial load */}
      {isLoading && <DashboardSkeleton />}

      {/* Main Content (only show when not loading) */}
      {!isLoading && (
        <div className="relative">
          {/* Contextual loader for metrics updates */}
          <ContextualLoader
            isLoading={isMetricsLoading}
            context="dashboard"
            variant="overlay"
          />

          {/* Main Layout Grid */}
          <div className="space-y-6 sm:space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">

              {/* Left Column - Metrics & Recent Orders (66%) */}
              <div className="lg:col-span-2 space-y-6 sm:space-y-8">

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6" data-tour="dashboard-stats">
                  {/* Featured Card - Revenue Earned */}
                  <StatCard
                    label={t('dashboard.metrics.revenueEarned')}
                    value={formatCurrency(metrics?.revenueEarnedFromStockOut || 0)}
                    icon={TrendingUp}
                    variant="primary"
                    isLoading={isMetricsLoading}
                    onClick={() => setSelectedPeriod('this-month')}
                  />

                  {/* Secondary Metrics */}
                  <div className="grid grid-cols-1 gap-4 sm:gap-6">
                    <StatCard
                      label={t('dashboard.metrics.totalStockIn')}
                      value={metrics?.totalStockIn || 0}
                      icon={ArrowUp}
                      isLoading={isMetricsLoading}
                    />
                    <StatCard
                      label={t('dashboard.metrics.totalStockOut')}
                      value={metrics?.totalStockOut || 0}
                      icon={ArrowDown}
                      isLoading={isMetricsLoading}
                    />
                  </div>
                </div>

                {/* Additional Metrics Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <StatCard
                    label={t('dashboard.metrics.revenueSpent')}
                    value={formatCurrency(metrics?.revenueSpentOnStockIn || 0)}
                    icon={DollarSign}
                    isLoading={isMetricsLoading}
                  />
                  <StatCard
                    label={t('dashboard.metrics.totalItems')}
                    value={summary?.totalItems || 0}
                    icon={Package}
                    isLoading={isLoading}
                  />
                </div>

                {/* Recent Orders Table */}
                <div>
                  <RecentTransactions transactions={transactions} />
                </div>
              </div>

              {/* Right Column - Analytics & Top Product (33%) */}
              <div className="lg:col-span-1 space-y-6 sm:space-y-8">
                {/* Sales Analytics — lazy loaded, below the fold */}
                <Suspense fallback={
                  <div className="card-theme p-4 sm:p-6 h-[350px] animate-pulse">
                    <div className="h-6 bg-secondary rounded w-1/3 mb-6" />
                    <div className="h-64 bg-secondary rounded" />
                  </div>
                }>
                  <MetricsChart
                    data={chartData}
                    type="bar"
                    title="Sales Analytics"
                    isLoading={isMetricsLoading}
                  />
                </Suspense>

                {/* Highest Selling Product */}
                <div className="max-h-[300px]">
                  <TopProductCard
                    product={topProduct ? {
                      name: topProduct.name,
                      soldToday: topProduct.count,
                      price: topProduct.price
                    } : undefined}
                    isLoading={isLoading}
                  />
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
}