import { useEffect, useState, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Package, DollarSign, TrendingUp, ArrowUp, ArrowDown, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { getItems } from '../lib/api/items';
import { getPOSTransactions } from '../lib/api/pos';
import { getDashboardMetricsAndTrends, getDashboardWidgetData } from '../lib/api/dashboard';
import StatCard from '../components/ui/StatCard';
import RecentTransactions from '../components/dashboard/RecentTransactions';
import TopProductCard from '../components/dashboard/TopProductCard';
import TimePeriodFilter, { TimePeriod } from '../components/dashboard/TimePeriodFilter';
import ProfitLossWidget from '../components/dashboard/ProfitLossWidget';
import CashFlowWidget from '../components/dashboard/CashFlowWidget';
import ExpenseBreakdownWidget from '../components/dashboard/ExpenseBreakdownWidget';
import VendorPaymentAlerts from '../components/dashboard/VendorPaymentAlerts';
import CustomerCreditWidget from '../components/dashboard/CustomerCreditWidget';
import { POSTransaction, DashboardMetrics } from '../lib/types';
import { formatCurrency } from '../lib/utils/notifications';
import { useTranslation } from 'react-i18next';
import DashboardSkeleton from '../components/skeletons/DashboardSkeleton';
import { readScopedJSON, writeScopedJSON } from '../lib/utils/storageScope';

// Lazy-load the chart — it's below the fold and pulls in recharts (~400KB)
const MetricsChart = lazy(() => import('../components/dashboard/MetricsChart'));

const LS_SUMMARY = 'dashboard_summary_cache';
const LS_TRANSACTIONS = 'dashboard_transactions_cache';
const LS_METRICS = 'dashboard_metrics_cache';

function readCache<T>(key: string): T | null {
  return readScopedJSON<T | null>(key, null as T | null, undefined, key);
}

function writeCache(key: string, value: unknown) {
  writeScopedJSON(key, value);
}

export default function Dashboard() {
  const { t } = useTranslation();
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('this-month');

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(() => readCache(LS_METRICS));
  const [chartData, setChartData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(() => readCache(LS_SUMMARY));
  const [transactions, setTransactions] = useState<POSTransaction[]>(() => readCache<POSTransaction[]>(LS_TRANSACTIONS) ?? []);
  const [topProduct, setTopProduct] = useState<any>(null);

  // Widget data
  const [widgetData, setWidgetData] = useState<any>(null);
  const [isWidgetsLoading, setIsWidgetsLoading] = useState(false);

  const [isLoading, setIsLoading] = useState(() => readCache(LS_SUMMARY) == null);
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
    loadWidgetData();
  }, [selectedPeriod]);

  async function loadWidgetData() {
    setIsWidgetsLoading(true);
    try {
      const data = await getDashboardWidgetData(selectedPeriod);
      setWidgetData(data);
    } catch (err) {
      console.error('Error loading widget data:', err);
    } finally {
      setIsWidgetsLoading(false);
    }
  }

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

          {/* Main Layout Grid */}
          <div className="space-y-4 sm:space-y-6">

            {/* Period filter row */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h1 className="text-lg sm:text-xl font-bold text-foreground">
                {t('dashboard.title', 'Dashboard')}
              </h1>
              <TimePeriodFilter
                selectedPeriod={selectedPeriod}
                onPeriodChange={setSelectedPeriod}
                isLoading={isMetricsLoading}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

              {/* Left Column - Metrics & Recent Orders (66%) */}
              <div className="lg:col-span-2 space-y-4 sm:space-y-6">

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 sm:gap-4" data-tour="dashboard-stats">
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
                  <div className="grid grid-cols-1 gap-3 sm:gap-4">
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
                <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 sm:gap-4">
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
              <div className="lg:col-span-1 space-y-4 sm:space-y-6">
                {/* Sales Analytics — lazy loaded, below the fold */}
                <Suspense fallback={
                  <div className="card-theme p-4 sm:p-6 h-[300px] animate-pulse rounded-[2.5rem]">
                    <div className="h-5 bg-secondary/60 rounded w-1/3 mb-4" />
                    <div className="h-52 bg-secondary/30 rounded-xl" />
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

            {/* ── New Widgets Row ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <ProfitLossWidget
                revenue={metrics?.revenueEarnedFromStockOut || 0}
                expenses={widgetData?.totalExpenses || 0}
                purchases={widgetData?.totalPurchases || 0}
                isLoading={isMetricsLoading || isWidgetsLoading}
              />
              <CashFlowWidget
                cashIn={(metrics?.revenueEarnedFromStockOut || 0)}
                cashOut={(widgetData?.totalExpenses || 0) + (widgetData?.vendorPaymentsOut || 0)}
                isLoading={isMetricsLoading || isWidgetsLoading}
              />
              <ExpenseBreakdownWidget
                breakdown={widgetData?.expenseBreakdown || []}
                total={widgetData?.totalExpenses || 0}
                isLoading={isWidgetsLoading}
              />
            </div>

            {/* ── Alerts Row ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <VendorPaymentAlerts
                vendors={widgetData?.vendors || []}
                isLoading={isWidgetsLoading}
              />
              <CustomerCreditWidget
                customers={widgetData?.customers || []}
                isLoading={isWidgetsLoading}
              />
            </div>

          </div>
        </div>
      )}
    </>
  );
}