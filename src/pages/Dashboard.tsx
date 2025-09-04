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
import LoadingSpinner from '../components/ui/LoadingSpinner';
import AnimatedCard from '../components/ui/AnimatedCard';
import { Item, Transaction, DashboardMetrics } from '../lib/types';
import { formatCurrency } from '../lib/utils/notifications';

export default function Dashboard() {
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

  useEffect(() => {
    loadDashboardData();
    loadMetricsData();
  }, []);

  useEffect(() => {
    loadMetricsData();
  }, [selectedPeriod]);

  async function loadDashboardData() {
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
        items: items.slice(0, 10) // Top 10 items for chart
      });
      setLowStockItems(lowStock);
      setTransactions(recentTransactions);
      setError(null);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Unable to load dashboard data. Please try again later.');
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  }

  async function loadMetricsData() {
    setIsMetricsLoading(true);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
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
          <div className="text-error-400 text-lg font-medium mb-2">Error</div>
          <div className="text-gray-400">{error}</div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center sm:text-left"
      >
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gradient mb-2">
          Dashboard Overview
        </h1>
        <p className="text-gray-400 text-base sm:text-lg">
          Welcome back! Here's what's happening with your inventory.
        </p>
      </motion.div>

      {/* Time Period Filter */}
      <TimePeriodFilter
        selectedPeriod={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
        isLoading={isMetricsLoading}
      />

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6" data-tour="dashboard-stats">
        <MetricsCard
          title="Total Stock In"
          value={metrics?.totalStockIn || 0}
          icon={ArrowUp}
          color="success"
          delay={0.1}
          isLoading={isMetricsLoading}
        />
        <MetricsCard
          title="Total Stock Out"
          value={metrics?.totalStockOut || 0}
          icon={ArrowDown}
          color="error"
          delay={0.2}
          isLoading={isMetricsLoading}
        />
        <MetricsCard
          title="Revenue Spent (Stock In)"
          value={formatCurrency(metrics?.revenueSpentOnStockIn || 0)}
          icon={DollarSign}
          color="warning"
          delay={0.3}
          isLoading={isMetricsLoading}
        />
        <MetricsCard
          title="Revenue Earned (Stock Out)"
          value={formatCurrency(metrics?.revenueEarnedFromStockOut || 0)}
          icon={TrendingUp}
          color="primary"
          delay={0.4}
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
          delay={0.6}
        />
        <StatsCard
          title="Low Stock Items"
          value={summary?.lowStockCount || 0}
          icon={<ShoppingCart className="h-6 w-6" />}
          delay={0.7}
        />
        <StatsCard
          title="Out of Stock"
          value={summary?.outOfStockCount || 0}
          icon={<AlertTriangle className="h-6 w-6" />}
          delay={0.8}
        />
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.9 }}
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
        <AnimatedCard delay={1.0}>
          <InventoryChart
            data={summary?.items?.map((item: any) => ({
              name: item.name.length > 10 ? item.name.substring(0, 10) + '...' : item.name,
              quantity: item.quantity,
            })) || []}
          />
        </AnimatedCard>
        
        <AnimatedCard delay={1.1}>
          <RecentTransactions transactions={transactions} />
        </AnimatedCard>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
      >
        <TourTrigger variant="card" />
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/inventory/categories')}
          className="btn-primary p-4 sm:p-6 rounded-xl text-center flex flex-col items-center gap-2 sm:gap-3 min-h-[120px] sm:min-h-[140px]"
        >
          <FolderOpen className="w-6 h-6 sm:w-8 sm:h-8" />
          <span className="text-base sm:text-lg font-semibold">Manage Categories</span>
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/transactions')}
          className="btn-secondary p-4 sm:p-6 rounded-xl text-center flex flex-col items-center gap-2 sm:gap-3 min-h-[120px] sm:min-h-[140px]"
        >
          <ArrowUpDown className="w-6 h-6 sm:w-8 sm:h-8" />
          <span className="text-base sm:text-lg font-semibold">Record Transaction</span>
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/stock-levels')}
          className="btn-secondary p-4 sm:p-6 rounded-xl text-center flex flex-col items-center gap-2 sm:gap-3 min-h-[120px] sm:min-h-[140px] sm:col-span-2 lg:col-span-1"
        >
          <Layers className="w-6 h-6 sm:w-8 sm:h-8" />
          <span className="text-base sm:text-lg font-semibold">View Stock Levels</span>
        </motion.button>
      </motion.div>
    </div>
  );
}