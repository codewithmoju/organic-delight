import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { Package, DollarSign, ShoppingCart, TrendingUp, AlertTriangle, ArrowUpDown } from 'lucide-react';
import { toast } from 'sonner';
import { getItems } from '../lib/api/items';
import { getRecentTransactions } from '../lib/api/transactions';
import StatsCard from '../components/dashboard/StatsCard';
import InventoryChart from '../components/dashboard/InventoryChart';
import LowStockAlert from '../components/dashboard/LowStockAlert';
import RecentTransactions from '../components/dashboard/RecentTransactions';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import AnimatedCard from '../components/ui/AnimatedCard';
import { Item, Transaction } from '../lib/types';
import { formatCurrency } from '../lib/utils/notifications';

export default function Dashboard() {
  const navigate = useNavigate();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<any>(null);
  const [lowStockItems, setLowStockItems] = useState<Item[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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

    loadDashboardData();
  }, []);

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
    <div className="space-y-8 h-full">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center lg:text-left"
      >
        <h1 className="text-3xl lg:text-4xl font-bold text-gradient mb-2">
          Dashboard Overview
        </h1>
        <p className="text-gray-400 text-lg">
          Welcome back! Here's what's happening with your inventory.
        </p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Items"
          value={summary?.totalItems || 0}
          icon={<Package className="h-6 w-6" />}
          delay={0.1}
        />
        <StatsCard
          title="Total Value"
          value={formatCurrency(summary?.totalValue || 0)}
          icon={<DollarSign className="h-6 w-6" />}
          delay={0.2}
        />
        <StatsCard
          title="Low Stock Items"
          value={summary?.lowStockCount || 0}
          icon={<ShoppingCart className="h-6 w-6" />}
          delay={0.3}
        />
        <StatsCard
          title="Out of Stock"
          value={summary?.outOfStockCount || 0}
          icon={<AlertTriangle className="h-6 w-6" />}
          delay={0.4}
        />
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <LowStockAlert items={lowStockItems} />
        </motion.div>
      )}

      {/* Charts and Recent Activity */}
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
        <AnimatedCard delay={0.6}>
          <InventoryChart
            data={summary?.items?.map((item: any) => ({
              name: item.name.length > 10 ? item.name.substring(0, 10) + '...' : item.name,
              quantity: item.quantity,
            })) || []}
          />
        </AnimatedCard>
        
        <AnimatedCard delay={0.7}>
          <RecentTransactions transactions={transactions} />
        </AnimatedCard>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/inventory/items')}
          onClick={() => navigate('/inventory/items')}
          className="btn-primary p-4 rounded-xl text-center"
        >
          <Package className="w-6 h-6 mx-auto mb-2" />
          Add New Item
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/transactions')}
          onClick={() => navigate('/transactions')}
          className="btn-secondary p-4 rounded-xl text-center"
        >
          <ArrowUpDown className="w-6 h-6 mx-auto mb-2" />
          Record Transaction
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/reports')}
          onClick={() => navigate('/reports')}
          className="btn-secondary p-4 rounded-xl text-center"
        >
          <TrendingUp className="w-6 h-6 mx-auto mb-2" />
          View Reports
        </motion.button>
      </motion.div>
    </div>
  );
}