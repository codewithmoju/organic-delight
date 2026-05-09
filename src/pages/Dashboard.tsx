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
// Lazy-load the chart — it's below the fold and pulls in recharts (~400KB)
const MetricsChart = lazy(() => import('../components/dashboard/MetricsChart'));

export default function Dashboard() {
  const { t } = useTranslation();
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('this-month');

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [transactions, setTransactions] = useState<POSTransaction[]>([]);
  const [topProduct, setTopProduct] = useState<any>(null);

  // Widget data
  const [widgetData, setWidgetData] = useState<any>(null);
  const [isWidgetsLoading, setIsWidgetsLoading] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
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
      console.error('[Dashboard] widgets FAILED:', err);
    } finally {
      setIsWidgetsLoading(false);
    }
  }

  async function loadInitialData(showLoading = true) {
    if (showLoading) setIsLoading(true);
    try {
      let itemsResult: any = { items: [] };
      let recentSales: any[] = [];

      try {
        itemsResult = await getItems();
      } catch (e) {
        console.error('[Dashboard] getItems FAILED:', e);
      }

      try {
        recentSales = await getPOSTransactions(5);
      } catch (e) {
        console.error('[Dashboard] getPOSTransactions FAILED:', e);
      }

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
      const { metrics: m, trends } = await getDashboardMetricsAndTrends(selectedPeriod);
      setMetrics(m);
      setChartData(trends);
    } catch (err) {
      console.error('[Dashboard] metrics FAILED:', err);
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
        <div className="relative min-h-screen">
          {/* Subtle gradient mesh background */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
            <div className="absolute top-1/2 -left-32 w-80 h-80 rounded-full bg-accent/5 blur-3xl" />
            <div className="absolute -bottom-16 right-1/3 w-72 h-72 rounded-full bg-primary/3 blur-3xl" />
          </div>

          {/* Main Layout Grid */}
          <div className="relative z-10 space-y-5 sm:space-y-7">

            {/* Hero header row */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center justify-between gap-3 flex-wrap"
            >
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                  {t('dashboard.title', 'Dashboard')}
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  Business overview & analytics
                </p>
              </div>
              <TimePeriodFilter
                selectedPeriod={selectedPeriod}
                onPeriodChange={setSelectedPeriod}
                isLoading={isMetricsLoading}
              />
            </motion.div>

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
                    delay={0}
                  />

                  {/* Secondary Metrics */}
                  <div className="grid grid-cols-1 gap-3 sm:gap-4">
                    <StatCard
                      label={t('dashboard.metrics.totalStockIn')}
                      value={metrics?.totalStockIn || 0}
                      icon={ArrowUp}
                      isLoading={isMetricsLoading}
                      delay={0.05}
                    />
                    <StatCard
                      label={t('dashboard.metrics.totalStockOut')}
                      value={metrics?.totalStockOut || 0}
                      icon={ArrowDown}
                      isLoading={isMetricsLoading}
                      delay={0.1}
                    />
                  </div>
                </div>

                {/* Additional Metrics Row */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                  className="grid grid-cols-2 sm:grid-cols-2 gap-3 sm:gap-4"
                >
                  <StatCard
                    label={t('dashboard.metrics.revenueSpent')}
                    value={formatCurrency(metrics?.revenueSpentOnStockIn || 0)}
                    icon={DollarSign}
                    isLoading={isMetricsLoading}
                    delay={0.2}
                  />
                  <StatCard
                    label={t('dashboard.metrics.totalItems')}
                    value={summary?.totalItems || 0}
                    icon={Package}
                    isLoading={isLoading}
                    delay={0.25}
                  />
                </motion.div>

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