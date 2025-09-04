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
import AnimatedCard from '../components/ui/AnimatedCard';
import { Item, Transaction, DashboardMetrics } from '../lib/types';
import { formatCurrency } from '../lib/utils/notifications';
import { useTranslation } from 'react-i18next';

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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      loadMetrics();
    }
  }, [selectedPeriod, isLoading]);

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
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Unable to load dashboard data. Please try again later.');
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  }

  async function loadMetrics() {
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
    }
  }

  const handlePeriodChange = (period: TimePeriod) => {
    setSelectedPeriod(period);
  };

  // Simple loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold text-white mb-2">Loading Dashboard</h3>
          <p className="text-gray-400">Fetching your inventory data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-error-500 mx-auto mb-4" />
          <div className="text-error-400 text-lg font-medium mb-2">Error</div>
          <div className="text-gray-400">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gradient mb-2">
            {t('dashboard.title')}
          </h1>
          <p className="text-gray-400 text-base sm:text-lg">
            {t('dashboard.subtitle')}
          </p>
        </div>
        
        <div className="w-full sm:w-auto">
          <TimePeriodFilter
            selectedPeriod={selectedPeriod}
            onPeriodChange={handlePeriodChange}
            isLoading={false}
          />
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6" data-tour="dashboard-stats">
        <MetricsCard
          title={t('dashboard.metrics.totalStockIn')}
          value={metrics?.totalStockIn || 0}
          icon={ArrowUp}
          color="success"
          delay={0}
          isLoading={false}
        />
        <MetricsCard
          title={t('dashboard.metrics.totalStockOut')}
          value={metrics?.totalStockOut || 0}
          icon={ArrowDown}
          color="error"
          delay={0}
          isLoading={false}
        />
        <MetricsCard
          title={t('dashboard.metrics.revenueSpent')}
          value={formatCurrency(metrics?.revenueSpentOnStockIn || 0)}
          icon={DollarSign}
          color="warning"
          delay={0}
          isLoading={false}
        />
        <MetricsCard
          title={t('dashboard.metrics.revenueEarned')}
          value={formatCurrency(metrics?.revenueEarnedFromStockOut || 0)}
          icon={TrendingUp}
          color="primary"
          delay={0}
          isLoading={false}
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
        <StatsCard
          title="Total Items"
          value={summary?.totalItems || 0}
          icon={<Package className="h-6 w-6" />}
          delay={0}
        />
        <StatsCard
          title="Total Value"
          value={formatCurrency(summary?.totalValue || 0)}
          icon={<DollarSign className="h-6 w-6" />}
          delay={0}
        />
        <StatsCard
          title="Low Stock Items"
          value={summary?.lowStockCount || 0}
          icon={<ShoppingCart className="h-6 w-6" />}
          delay={0}
        />
        <StatsCard
          title="Out of Stock"
          value={summary?.outOfStockCount || 0}
          icon={<AlertTriangle className="h-6 w-6" />}
          delay={0}
        />
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <LowStockAlert items={lowStockItems} />
      )}

      {/* Inventory Overview and Recent Activity */}
      <div className="grid grid-cols-1 gap-6 lg:gap-8 xl:grid-cols-2">
        <AnimatedCard delay={0}>
          <InventoryChart data={summary?.items?.map((item: any) => ({
            name: item.name.length > 10 ? item.name.substring(0, 10) + '...' : item.name,
            quantity: item.quantity,
          })) || []} />
        </AnimatedCard>
        
        <AnimatedCard delay={0}>
          <RecentTransactions transactions={transactions} />
        </AnimatedCard>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <TourTrigger variant="card" />
        
        <button
          onClick={() => navigate('/inventory/categories')}
          className="btn-primary p-4 sm:p-6 rounded-xl text-center flex flex-col items-center gap-2 sm:gap-3 min-h-[120px] sm:min-h-[140px]"
        >
          <FolderOpen className="w-6 h-6 sm:w-8 sm:h-8" />
          <span className="text-base sm:text-lg font-semibold">Manage Categories</span>
        </button>
        
        <button
          onClick={() => navigate('/transactions')}
          className="btn-secondary p-4 sm:p-6 rounded-xl text-center flex flex-col items-center gap-2 sm:gap-3 min-h-[120px] sm:min-h-[140px]"
        >
          <ArrowUpDown className="w-6 h-6 sm:w-8 sm:h-8" />
          <span className="text-base sm:text-lg font-semibold">Record Transaction</span>
        </button>
        
        <button
          onClick={() => navigate('/stock-levels')}
          className="btn-secondary p-4 sm:p-6 rounded-xl text-center flex flex-col items-center gap-2 sm:gap-3 min-h-[120px] sm:min-h-[140px] sm:col-span-2 lg:col-span-1"
        >
          <Layers className="w-6 h-6 sm:w-8 sm:h-8" />
          <span className="text-base sm:text-lg font-semibold">View Stock Levels</span>
        </button>
      </div>
    </div>
  );
}