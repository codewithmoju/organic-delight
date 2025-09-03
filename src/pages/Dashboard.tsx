import { useEffect, useState } from 'react';
import { Package, DollarSign, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { getItems } from '../lib/api/items';
import { getRecentTransactions } from '../lib/api/transactions';
import StatsCard from '../components/dashboard/StatsCard';
import InventoryChart from '../components/dashboard/InventoryChart';
import LowStockAlert from '../components/dashboard/LowStockAlert';
import RecentTransactions from '../components/dashboard/RecentTransactions';
import { Item, Transaction } from '../lib/types';

export default function Dashboard() {
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
        
        console.log('Dashboard data loaded:', { items, lowStock, recentTransactions });

        setSummary({
          totalItems: items.length,
          totalValue: totalValue,
          lowStockCount: lowStock.length,
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-[#964B00]">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 text-lg font-medium mb-2">Error</div>
          <div className="text-[#4B2600]">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title="Total Items"
          value={summary.totalItems}
          icon={<Package className="h-6 w-6" />}
        />
        <StatsCard
          title="Total Value"
          value={`$${summary.totalValue.toFixed(2)}`}
          icon={<DollarSign className="h-6 w-6" />}
        />
        <StatsCard
          title="Low Stock Items"
          value={summary.lowStockCount}
          icon={<ShoppingCart className="h-6 w-6" />}
        />
      </div>

      {lowStockItems.length > 0 && (
        <LowStockAlert items={lowStockItems} />
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <InventoryChart
          data={summary.items?.map((item: any) => ({
            name: item.name,
            quantity: item.quantity,
          }))}
        />
        <RecentTransactions transactions={transactions} />
      </div>
    </div>
  );
}