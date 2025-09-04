import { useEffect, useState, useMemo, useCallback } from 'react';
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
import { createOptimizedDebounce, PERFORMANCE_CONFIG } from '../lib/utils/performance';

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

  // Debounced metrics loading to prevent rapid API calls
  const debouncedLoadMetrics = useCallback(
    createOptimizedDebounce(async (period: TimePeriod) => {
      setIsMetricsLoading(true);
      try {
        const [metricsData, trendsData] = await Promise.all([
          getDashboardMetrics(period),
          getInventoryTrends(period)
        ]);
        
        setMetrics(metricsData);
        setChartData(trendsData);
      } catch (error) {
        console.error('Error loading metrics:', error);
        toast.error('Failed to load metrics data');
      } finally {
        setIsMetricsLoading(false);
      }
    }, PERFORMANCE_CONFIG.DEBOUNCE_DELAY.SEARCH),
    []
  );

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    debouncedLoadMetrics(selectedPeriod);
  }, [selectedPeriod, debouncedLoadMetrics]);

  async function loadInitialData() {
    try {
      const [itemsResult, recentTransactions] = await Promise.all([
        getItems(),
        getRecentTransactions(5),
      ]);

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
        items: items.slice(0, 10)
      });
      setLowStockItems(lowStock);
      setTransactions(recentTransactions);
      setError(null);
      
      // Load initial metrics
      await debouncedLoadMetrics(selectedPeriod);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Unable to load dashboard data. Please try again later.');
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  }

  const handlePeriodChange = useCallback((period: TimePeriod) => {
    setSelectedPeriod(period);
  }, []);

  // Memoize expensive calculations
  const memoizedChartData = useMemo(() => {
    return summary?.items?.map((item: any) => ({
      name: item.name.length > 10 ? item.name.substring(0, 10) + '...' : item.name,
      quantity: item.quantity,
    })) || [];
  }, [summary?.items]);

  // Single loading state for entire dashboard
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-dark-900/95 backdrop-blur-sm flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-3 border-primary-500/30 border-t-primary-500 rounded-full mx-auto mb-4"
          />
          <h3 className="text-xl font-semibold text-white mb-2">Loading Dashboard</h3>
          <p className="text-gray-400">Fetching your inventory data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 sm:space-y-8"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
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
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
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
          delay={0.3}
          isLoading={isMetricsLoading}
        />
        <MetricsCard
          title={t('dashboard.metrics.totalStockOut')}
          value={metrics?.totalStockOut || 0}
          icon={ArrowDown}
          color="error"
          delay={0.35}
          isLoading={isMetricsLoading}
        />
        <MetricsCard
          title={t('dashboard.metrics.revenueSpent')}
          value={formatCurrency(metrics?.revenueSpentOnStockIn || 0)}
          icon={DollarSign}
          color="warning"
          delay={0.4}
          isLoading={isMetricsLoading}
        />
        <MetricsCard
          title={t('dashboard.metrics.revenueEarned')}
          value={formatCurrency(metrics?.revenueEarnedFromStockOut || 0)}
          icon={TrendingUp}
          color="primary"
          delay={0.45}
          isLoading={isMetricsLoading}
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
        <StatsCard
          title="Total Items"
          value={summary?.totalItems || 0}
          icon={<Package className="h-6 w-6" />}
          delay={0.5}
        />
        <StatsCard
          title="Total Value"
          value={formatCurrency(summary?.totalValue || 0)}
          icon={<DollarSign className="h-6 w-6" />}
          delay={0.55}
        />
        <StatsCard
          title="Low Stock Items"
          value={summary?.lowStockCount || 0}
          icon={<ShoppingCart className="h-6 w-6" />}
          delay={0.6}
        />
        <StatsCard
          title="Out of Stock"
          value={summary?.outOfStockCount || 0}
          icon={<AlertTriangle className="h-6 w-6" />}
          delay={0.65}
        />
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7, duration: 0.3 }}
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
        <AnimatedCard delay={0.75}>
          <InventoryChart data={memoizedChartData} />
        </AnimatedCard>
        
        <AnimatedCard delay={0.8}>
          <RecentTransactions transactions={transactions} />
        </AnimatedCard>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.85, duration: 0.3 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
      >
        <TourTrigger variant="card" />
        
        <motion.button
          whileHover={{ scale: 1.01, y: -1 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => navigate('/inventory/categories')}
          transition={{ duration: 0.2 }}
          className="btn-primary p-4 sm:p-6 rounded-xl text-center flex flex-col items-center gap-2 sm:gap-3 min-h-[120px] sm:min-h-[140px]"
        >
          <FolderOpen className="w-6 h-6 sm:w-8 sm:h-8" />
          <span className="text-base sm:text-lg font-semibold">Manage Categories</span>
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.01, y: -1 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => navigate('/transactions')}
          transition={{ duration: 0.2 }}
          className="btn-secondary p-4 sm:p-6 rounded-xl text-center flex flex-col items-center gap-2 sm:gap-3 min-h-[120px] sm:min-h-[140px]"
        >
          <ArrowUpDown className="w-6 h-6 sm:w-8 sm:h-8" />
          <span className="text-base sm:text-lg font-semibold">Record Transaction</span>
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.01, y: -1 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => navigate('/stock-levels')}
          transition={{ duration: 0.2 }}
          className="btn-secondary p-4 sm:p-6 rounded-xl text-center flex flex-col items-center gap-2 sm:gap-3 min-h-[120px] sm:min-h-[140px] sm:col-span-2 lg:col-span-1"
        >
          <Layers className="w-6 h-6 sm:w-8 sm:h-8" />
          <span className="text-base sm:text-lg font-semibold">View Stock Levels</span>
        </motion.button>
      </motion.div>
    </motion.div>
  );
}