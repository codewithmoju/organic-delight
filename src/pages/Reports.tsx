import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { getTransactions } from '../lib/api/transactions';
import { getItems } from '../lib/api/items';
import AnimatedCard from '../components/ui/AnimatedCard';
import { formatCurrency } from '../lib/utils/notifications';
import ContextualLoader from '../components/ui/ContextualLoader';

export default function Reports() {
  const { t } = useTranslation();
  const [monthlyTransactions, setMonthlyTransactions] = useState<any[]>(() => {
    try {
      const cached = localStorage.getItem('reports_monthly_cache');
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });
  const [topItems, setTopItems] = useState<any[]>(() => {
    try {
      const cached = localStorage.getItem('reports_top_items_cache');
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });
  const [categoryDistribution, setCategoryDistribution] = useState<any[]>(() => {
    try {
      const cached = localStorage.getItem('reports_category_dist_cache');
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });
  const [isLoading, setIsLoading] = useState(() => !localStorage.getItem('reports_monthly_cache'));

  const COLORS = ['#3b82f6', '#d946ef', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  useEffect(() => {
    const hasCache = monthlyTransactions.length > 0;
    loadReportData(!hasCache);
  }, []);

  async function loadReportData(showLoading = true) {
    if (showLoading) setIsLoading(true);
    try {
      const [transactionsResult, itemsResult] = await Promise.all([
        getTransactions(),
        getItems()
      ]);

      const transactions = transactionsResult.transactions || transactionsResult;
      const items = itemsResult.items || itemsResult;

      // Process monthly transactions
      const monthlyData = transactions.reduce((acc: any, transaction: any) => {
        const date = transaction.created_at?.toDate ? transaction.created_at.toDate() : new Date(transaction.created_at);
        const month = date.toLocaleString('default', { month: 'short' });
        const value = transaction.type === 'out' ? Math.abs(transaction.quantity_changed) : 0;

        if (!acc[month]) {
          acc[month] = { name: month, value: 0, revenue: 0 };
        }
        acc[month].value += value;
        acc[month].revenue += value * (transaction.cost_per_unit || 0);
        return acc;
      }, {});

      // Process top items
      const itemsData = transactions.reduce((acc: any, transaction: any) => {
        if (transaction.type === 'out' && transaction.item) {
          const { name } = transaction.item;
          if (!acc[name]) {
            acc[name] = { name, quantity: 0, revenue: 0 };
          }
          acc[name].quantity += Math.abs(transaction.quantity_changed);
          acc[name].revenue += Math.abs(transaction.quantity_changed) * (transaction.cost_per_unit || 0);
        }
        return acc;
      }, {});

      // Process category distribution
      const categoryData = items.reduce((acc: any, item: any) => {
        const categoryName = item.category?.name || 'Uncategorized';
        if (!acc[categoryName]) {
          acc[categoryName] = { name: categoryName, value: 0, count: 0 };
        }
        acc[categoryName].value += item.quantity * item.unit_price;
        acc[categoryName].count += 1;
        return acc;
      }, {});

      const processedMonthly = Object.values(monthlyData);
      const processedTopItems = Object.values(itemsData).sort((a: any, b: any) => b.quantity - a.quantity).slice(0, 5);
      const processedCategory = Object.values(categoryData);

      setMonthlyTransactions(processedMonthly);
      setTopItems(processedTopItems);
      setCategoryDistribution(processedCategory);

      localStorage.setItem('reports_monthly_cache', JSON.stringify(processedMonthly));
      localStorage.setItem('reports_top_items_cache', JSON.stringify(processedTopItems));
      localStorage.setItem('reports_category_dist_cache', JSON.stringify(processedCategory));

    } catch (error) {
      toast.error(t('reports.messages.loadError'));
      console.error(error);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-effect p-3 rounded-lg border border-dark-600/50">
          <p className="text-gray-200 font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-primary-400">
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="relative">
      <ContextualLoader
        isLoading={isLoading}
        context="reports"
        variant="overlay"
      />

      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-gradient mb-2">{t('reports.title')}</h1>
          <p className="text-gray-400 text-sm sm:text-base">
            {t('reports.subtitle')}
          </p>
        </motion.div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8" data-tour="reports-charts">
          {/* Monthly Transactions */}
          <AnimatedCard delay={0.1}>
            <div className="p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-6 flex items-center">
                <div className="w-2 h-6 bg-gradient-to-b from-primary-500 to-accent-500 rounded-full mr-3" />
                {t('reports.charts.monthlyTransactions')}
              </h3>
              <div className="h-64 sm:h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyTransactions}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                    <XAxis dataKey="name" stroke="#9CA3AF" fontSize={10} />
                    <YAxis stroke="#9CA3AF" fontSize={10} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" fill="url(#colorGradient)" radius={[4, 4, 0, 0]} />
                    <defs>
                      <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#d946ef" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </AnimatedCard>

          {/* Category Distribution */}
          <AnimatedCard delay={0.2}>
            <div className="p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-6 flex items-center">
                <div className="w-2 h-6 bg-gradient-to-b from-success-500 to-warning-500 rounded-full mr-3" />
                {t('reports.charts.categoryDistribution')}
              </h3>
              <div className="h-64 sm:h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius="80%"
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {categoryDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </AnimatedCard>
        </div>

        {/* Top Items Table */}
        <AnimatedCard delay={0.3}>
          <div className="p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-6 flex items-center">
              <div className="w-2 h-6 bg-gradient-to-b from-warning-500 to-error-500 rounded-full mr-3" />
              {t('reports.charts.topItems')}
            </h3>

            <div className="overflow-x-auto rounded-xl border border-dark-700/50">
              <table className="w-full min-w-full divide-y divide-dark-700/50">
                <thead className="bg-dark-800/50">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      {t('reports.table.itemName')}
                    </th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      {t('reports.table.quantitySold')}
                    </th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      {t('reports.table.revenue')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-700/30">
                  {topItems.map((item, index) => (
                    <motion.tr
                      key={item.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="hover:bg-dark-700/30 transition-colors duration-200"
                    >
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm font-medium text-white">
                        <div className="truncate max-w-[150px] sm:max-w-none">
                          {item.name}
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-300">
                        {item.quantity}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-primary-400 font-semibold">
                        {formatCurrency(item.revenue)}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </AnimatedCard>
      </div>
    </div>
  );
}