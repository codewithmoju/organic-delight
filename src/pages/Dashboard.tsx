import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Package, DollarSign, TrendingUp, ArrowUp, ArrowDown, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { getItems } from '../lib/api/items';
import { getRecentTransactions } from '../lib/api/transactions';
import { getPOSTransactions } from '../lib/api/pos';
import { getDashboardMetrics, getInventoryTrends } from '../lib/api/dashboard';
import StatCard from '../components/ui/StatCard';
import RecentTransactions from '../components/dashboard/RecentTransactions';
import TopProductCard from '../components/dashboard/TopProductCard';
import { TimePeriod } from '../components/dashboard/TimePeriodFilter';
import MetricsChart from '../components/dashboard/MetricsChart';
import { POSTransaction, DashboardMetrics } from '../lib/types';
import { formatCurrency } from '../lib/utils/notifications';
import { useTranslation } from 'react-i18next';
import ContextualLoader from '../components/ui/ContextualLoader';
import DashboardSkeleton from '../components/skeletons/DashboardSkeleton';

export default function Dashboard() {
  const { t } = useTranslation();
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('this-month');
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(() => {
    try {
      const cached = localStorage.getItem('dashboard_metrics_cache');
      return cached ? JSON.parse(cached) : null;
    } catch { return null; }
  });
  const [chartData, setChartData] = useState<any[]>([]); // Chart data is derived, we can cache or just let it re-derive
  const [summary, setSummary] = useState<any>(() => {
    try {
      const cached = localStorage.getItem('dashboard_summary_cache');
      return cached ? JSON.parse(cached) : null;
    } catch { return null; }
  });
  const [transactions, setTransactions] = useState<POSTransaction[]>(() => {
    try {
      const cached = localStorage.getItem('dashboard_transactions_cache');
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });
  const [isLoading, setIsLoading] = useState(() => !localStorage.getItem('dashboard_summary_cache'));
  const [isMetricsLoading, setIsMetricsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [topProduct, setTopProduct] = useState<any>(() => {
    // Try to re-calculate or just start null and let it load. 
    // For simplicity, we can trust the previous run or just wait for the silent update
    return null;
  });

  useEffect(() => {
    const hasCache = !!summary;
    loadInitialData(!hasCache);
  }, []);

  useEffect(() => {
    loadMetricsData();
  }, [selectedPeriod]);

  async function loadInitialData(showLoading = true) {
    if (showLoading) setIsLoading(true);
    try {
      // Fetch more transactions to better determine top selling product
      const [itemsResult, recentSales, allTransactions] = await Promise.all([
        getItems(),
        getPOSTransactions(5), // Fetch POS transactions for the list
        getRecentTransactions(20) // Keep fetching inventory transactions for Top Product calc
      ]);

      const items = itemsResult.items || [];

      // Calculate summary data
      const totalValue = items.reduce((acc: number, item: any) => acc + ((item.current_quantity || 0) * (item.unit_price || 0)), 0);
      const lowStock = items.filter((item: any) => (item.current_quantity || 0) <= (item.low_stock_threshold || 0));
      const outOfStock = items.filter((item: any) => (item.current_quantity || 0) === 0);

      // Calculate Top Product based on recent sales (stock_out)
      const productSales: Record<string, { name: string, count: number, price: number }> = {};

      allTransactions.forEach(t => {
        if (t.type === 'stock_out' && t.item) {
          if (!productSales[t.item_id]) {
            productSales[t.item_id] = {
              name: t.item.name,
              count: 0,
              price: t.item.unit_price || 0
            };
          }
          productSales[t.item_id].count += t.quantity;
        }
      });

      const productSalesIds = Object.keys(productSales);
      const bestSellerId = productSalesIds.length > 0
        ? productSalesIds.reduce((a, b) => productSales[a].count > productSales[b].count ? a : b)
        : null;

      let bestSeller = bestSellerId ? productSales[bestSellerId] : null;

      // Fallback if no sales data, pick highest priced item
      if (!bestSeller && items.length > 0) {
        const expensiveItem = items.reduce((prev: any, current: any) =>
          ((prev.unit_price || 0) > (current.unit_price || 0)) ? prev : current
        );
        bestSeller = {
          name: expensiveItem.name,
          count: 0,
          price: expensiveItem.unit_price
        };
      }

      setTopProduct(bestSeller);

      setSummary({
        totalItems: items.length,
        totalValue: totalValue,
        lowStockCount: lowStock.length,
        outOfStockCount: outOfStock.length,
        items: items.slice(0, 10) // Top 10 items for chart
      });
      setTransactions(recentSales);
      setError(null);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError(t('dashboard.errors.generic'));
      toast.error(t('dashboard.errors.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  }

  async function loadMetricsData() {
    if (!isLoading) {
      setIsMetricsLoading(true);
    }
    try {
      const [metricsData, trendsData] = await Promise.all([
        getDashboardMetrics(selectedPeriod),
        getInventoryTrends(selectedPeriod)
      ]);

      setMetrics(metricsData);
      setChartData(trendsData);
    } catch (error) {
      console.error('Error loading metrics:', error);
      toast.error(t('dashboard.errors.metricsFailed'));
    } finally {
      setIsMetricsLoading(false);
    }
  }

  const handlePeriodChange = (period: TimePeriod) => {
    setSelectedPeriod(period);
  };

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
                    onClick={() => handlePeriodChange('this-month')}
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
                {/* Sales Analytics */}
                <MetricsChart
                  data={chartData}
                  type="bar"
                  title="Sales Analytics"
                  isLoading={isMetricsLoading}
                />

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