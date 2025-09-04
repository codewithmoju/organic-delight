import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Package, DollarSign, ShoppingCart, TrendingUp, AlertTriangle, ArrowUpDown, ArrowUp, ArrowDown, FolderOpen, Layers } from 'lucide-react';
import { toast } from 'sonner';
import { getItems } from '../lib/api/items';
import { getRecentTransactions } from '../lib/api/transactions';
import { getDashboardMetrics, getInventoryTrends } from '../lib/api/dashboard';
import StatsCard from '../components/dashboard/StatsCard';
import TourTrigger from '../components/tour/TourTrigger';
import InventoryChart from '../components/dashboard/InventoryChart';
import LowStockAlert from '../components/dashboard/LowStockAlert';
import RecentTransactions from '../components/dashboard/RecentTransactions';
import MetricsCard from '../components/dashboard/MetricsCard';
import TimePeriodFilter, { TimePeriod } from '../components/dashboard/TimePeriodFilter';
import MetricsChart from '../components/dashboard/MetricsChart';
import AnimatedCard from '../components/ui/AnimatedCard';
import { Item, Transaction, DashboardMetrics } from '../lib/types';
import { formatCurrency } from '../lib/utils/notifications';
import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('this-month');
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [lowStockItems, setLowStockItems] = useState<Item[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMetricsLoading, setIsMetricsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadMetricsData();
  }, [selectedPeriod]);

  async function loadInitialData() {
    setLoadingProgress(10);
    try {
      setLoadingProgress(30);
      const [itemsResult, recentTransactions] = await Promise.all([
        getItems(),
        getRecentTransactions(5),
      ]);
      setLoadingProgress(60);

      const items = itemsResult.items || [];
      
      // Calculate summary data
      const totalValue = items.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0);
      const lowStock = items.filter(item => item.quantity <= item.reorder_point);
      const outOfStock = items.filter(item => item.quantity === 0);
      
      setSummary({
        totalItems: items.length,
        totalValue: totalValue,
        lowStockCount: lowStock.length,
        outOfStockCount: outOfStock.length,
        items: items.slice(0, 10) // Top 10 items for chart
      });
      setLowStockItems(lowStock);
      setTransactions(recentTransactions);
      setError(null);
      setLoadingProgress(80);
      
      // Load metrics data
      await loadMetricsData();
      setLoadingProgress(100);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Unable to load dashboard data. Please try again later.');
      toast.error('Failed to load dashboard data');
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
      toast.error('Failed to load metrics data');
    } finally {
      setIsMetricsLoading(false);
    }
  }

  const handlePeriodChange = (period: TimePeriod) => {
    setSelectedPeriod(period);
  };

  // Memoize expensive calculations
  const memoizedChartData = useMemo(() => {
    return summary?.items?.map((item: any) => ({
      name: item.name.length > 10 ? item.name.substring(0, 10) + '...' : item.name,
      quantity: item.quantity,
    })) || [];
  }, [summary?.items]);

  // Centralized loading overlay
  const LoadingOverlay = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="fixed inset-0 z-50 bg-dark-900/95 backdrop-blur-sm flex items-center justify-center"
      style={{
        willChange: 'opacity',
        backfaceVisibility: 'hidden'
      }}
    >
      <div className="text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-primary-500/30 border-t-primary-500 rounded-full mx-auto mb-6"
          style={{
            willChange: 'transform',
            backfaceVisibility: 'hidden'
          }}
        />
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <h3 className="text-xl font-semibold text-white mb-2">Loading Dashboard</h3>
          <p className="text-gray-400 mb-4">Fetching your inventory data...</p>
          
          {/* Progress bar */}
          <div className="w-64 bg-dark-700 rounded-full h-2 mx-auto">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${loadingProgress}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="bg-gradient-to-r from-primary-500 to-accent-500 h-2 rounded-full"
              style={{
                willChange: 'width',
                backfaceVisibility: 'hidden'
              }}
            />
          </div>
          <div className="text-primary-400 font-semibold mt-2">
            {loadingProgress}%
          </div>
        </motion.div>
      </div>
    </motion.div>
  );

  if (error) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex items-center justify-center h-full min-h-[60vh]"
      >
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-error-500 mx-auto mb-4" />
          <div className="text-error-400 text-lg font-medium mb-2">Error</div>
          <div className="text-gray-400">{error}</div>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      {/* Centralized loading overlay */}
      {isLoading && <LoadingOverlay />}
      
      {/* Main content with smooth fade-in */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoading ? 0 : 1 }}
        transition={{ duration: 0.4, ease: "easeOut", delay: isLoading ? 0 : 0.1 }}
        className="space-y-6 sm:space-y-8"
        style={{
          willChange: 'opacity',
          backfaceVisibility: 'hidden'
        }}
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut", delay: 0.2 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gradient mb-2">
              {t('dashboard.title')}
            </h1>
            <p className="text-gray-400 text-base sm:text-lg">
              {t('dashboard.subtitle')}
            </p>
          </div>
          
          {/* Time Period Dropdown */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.4, ease: "easeOut" }}
            className="w-full sm:w-auto"
          >
            <TimePeriodFilter
              selectedPeriod={selectedPeriod}
              onPeriodChange={handlePeriodChange}
              isLoading={isMetricsLoading}
            />
          </motion.div>
        </motion.div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6" data-tour="dashboard-stats">
          <MetricsCard
            title={t('dashboard.metrics.totalStockIn')}
            value={metrics?.totalStockIn || 0}
            icon={ArrowUp}
            color="success"
            delay={0.4}
            isLoading={isMetricsLoading}
          />
          <MetricsCard
            title={t('dashboard.metrics.totalStockOut')}
            value={metrics?.totalStockOut || 0}
            icon={ArrowDown}
            color="error"
            delay={0.5}
            isLoading={isMetricsLoading}
          />
          <MetricsCard
            title={t('dashboard.metrics.revenueSpent')}
            value={formatCurrency(metrics?.revenueSpentOnStockIn || 0)}
            icon={DollarSign}
            color="warning"
            delay={0.6}
            isLoading={isMetricsLoading}
          />
          <MetricsCard
            title={t('dashboard.metrics.revenueEarned')}
            value={formatCurrency(metrics?.revenueEarnedFromStockOut || 0)}
            icon={TrendingUp}
            color="primary"
            delay={0.7}
            isLoading={isMetricsLoading}
          />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
          <StatsCard
            title="Total Items"
            value={summary?.totalItems || 0}
            icon={<Package className="h-6 w-6" />}
            delay={0.8}
          />
          <StatsCard
            title="Total Value"
            value={formatCurrency(summary?.totalValue || 0)}
            icon={<DollarSign className="h-6 w-6" />}
            delay={0.9}
          />
          <StatsCard
            title="Low Stock Items"
            value={summary?.lowStockCount || 0}
            icon={<ShoppingCart className="h-6 w-6" />}
            delay={1.0}
          />
          <StatsCard
            title="Out of Stock"
            value={summary?.outOfStockCount || 0}
            icon={<AlertTriangle className="h-6 w-6" />}
            delay={1.1}
          />
        </div>

        {/* Low Stock Alert */}
        {lowStockItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.2, duration: 0.4, ease: "easeOut" }}
          >
            <LowStockAlert items={lowStockItems} />
          </motion.div>
        )}

        {/* Metrics Charts */}
        <div className="grid grid-cols-1 gap-6 lg:gap-8 xl:grid-cols-2">
          <MetricsChart
            data={chartData}
            type="bar"
            title="Stock Movement Trends"
            isLoading={isMetricsLoading}
          />
          
          <MetricsChart
            data={chartData}
            type="line"
            title="Revenue Trends"
            isLoading={isMetricsLoading}
          />
        </div>

        {/* Inventory Overview and Recent Activity */}
        <div className="grid grid-cols-1 gap-6 lg:gap-8 xl:grid-cols-2">
          <AnimatedCard delay={1.3}>
            <InventoryChart
              data={memoizedChartData}
            />
          </AnimatedCard>
          
          <AnimatedCard delay={1.4}>
            <RecentTransactions transactions={transactions} />
          </AnimatedCard>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.4, ease: "easeOut" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
        >
          <TourTrigger variant="card" />
          
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/inventory/categories')}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="btn-primary p-4 sm:p-6 rounded-xl text-center flex flex-col items-center gap-2 sm:gap-3 min-h-[120px] sm:min-h-[140px]"
            style={{
              willChange: 'transform',
              backfaceVisibility: 'hidden'
            }}
          >
            <FolderOpen className="w-6 h-6 sm:w-8 sm:h-8" />
            <span className="text-base sm:text-lg font-semibold">Manage Categories</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/transactions')}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="btn-secondary p-4 sm:p-6 rounded-xl text-center flex flex-col items-center gap-2 sm:gap-3 min-h-[120px] sm:min-h-[140px]"
            style={{
              willChange: 'transform',
              backfaceVisibility: 'hidden'
            }}
          >
            <ArrowUpDown className="w-6 h-6 sm:w-8 sm:h-8" />
            <span className="text-base sm:text-lg font-semibold">Record Transaction</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/stock-levels')}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="btn-secondary p-4 sm:p-6 rounded-xl text-center flex flex-col items-center gap-2 sm:gap-3 min-h-[120px] sm:min-h-[140px] sm:col-span-2 lg:col-span-1"
            style={{
              willChange: 'transform',
              backfaceVisibility: 'hidden'
            }}
          >
            <Layers className="w-6 h-6 sm:w-8 sm:h-8" />
            <span className="text-base sm:text-lg font-semibold">View Stock Levels</span>
          </motion.button>
        </motion.div>
      </motion.div>
    </>
  );
}