import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Calendar, DollarSign, TrendingUp, Users, Package, CreditCard } from 'lucide-react';
import { getDailySalesReport, getPOSTransactions } from '../../lib/api/pos';
import { SalesReport, POSTransaction } from '../../lib/types';
import { formatCurrency } from '../../lib/utils/notifications';
import LoadingSpinner from '../ui/LoadingSpinner';
import AnimatedCard from '../ui/AnimatedCard';

export default function SalesReports() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<POSTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const CHART_COLORS = ['#3b82f6', '#d946ef', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  useEffect(() => {
    loadReportData();
  }, [selectedDate]);

  const loadReportData = async () => {
    setIsLoading(true);
    try {
      // Load transactions first (simpler query)
      const transactions = await getPOSTransactions(10);
      setRecentTransactions(transactions);
      
      // Try to load sales report, but don't fail if index is missing
      try {
        const report = await getDailySalesReport(new Date(selectedDate));
        setSalesReport(report);
      } catch (reportError) {
        console.warn('Sales report query failed, using fallback data:', reportError);
        // Create fallback report from recent transactions
        const fallbackReport = createFallbackReport(transactions, new Date(selectedDate));
        setSalesReport(fallbackReport);
      }
    } catch (error) {
      console.error('Error loading sales report:', error);
      // Set empty data instead of crashing
      setSalesReport({
        date: new Date(selectedDate),
        total_sales: 0,
        total_transactions: 0,
        average_transaction: 0,
        top_selling_items: [],
        payment_methods: []
      });
      setRecentTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const createFallbackReport = (transactions: POSTransaction[], date: Date): SalesReport => {
    const dayTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.created_at);
      return transactionDate.toDateString() === date.toDateString();
    });

    const totalSales = dayTransactions.reduce((sum, t) => sum + t.total_amount, 0);
    const totalTransactions = dayTransactions.length;

    return {
      date,
      total_sales: totalSales,
      total_transactions: totalTransactions,
      average_transaction: totalTransactions > 0 ? totalSales / totalTransactions : 0,
      top_selling_items: [],
      payment_methods: []
    };
  };

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Loading sales reports..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gradient">Sales Reports</h1>
          <p className="text-gray-400 mt-1">
            Analyze your Point of Sale performance and trends
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Calendar className="w-5 h-5 text-gray-400" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="input-dark"
          />
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <AnimatedCard delay={0.1}>
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Total Sales</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(salesReport?.total_sales || 0)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-success-500/20 text-success-400">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
          </div>
        </AnimatedCard>

        <AnimatedCard delay={0.2}>
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Transactions</p>
                <p className="text-2xl font-bold text-white">
                  {salesReport?.total_transactions || 0}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-primary-500/20 text-primary-400">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </div>
        </AnimatedCard>

        <AnimatedCard delay={0.3}>
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Avg. Transaction</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(salesReport?.average_transaction || 0)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-accent-500/20 text-accent-400">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </div>
        </AnimatedCard>

        <AnimatedCard delay={0.4}>
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Items Sold</p>
                <p className="text-2xl font-bold text-white">
                  {salesReport?.top_selling_items.reduce((sum, item) => sum + item.quantity_sold, 0) || 0}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-warning-500/20 text-warning-400">
                <Package className="w-6 h-6" />
              </div>
            </div>
          </div>
        </AnimatedCard>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Top Selling Items */}
        <AnimatedCard delay={0.5}>
          <div className="p-6">
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
              <div className="w-2 h-6 bg-gradient-to-b from-primary-500 to-accent-500 rounded-full mr-3" />
              Top Selling Items
            </h3>
            
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesReport?.top_selling_items || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                  <XAxis 
                    dataKey="item_name" 
                    stroke="#9CA3AF" 
                    fontSize={10}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis stroke="#9CA3AF" fontSize={10} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="quantity_sold" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </AnimatedCard>

        {/* Payment Methods */}
        <AnimatedCard delay={0.6}>
          <div className="p-6">
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
              <div className="w-2 h-6 bg-gradient-to-b from-success-500 to-warning-500 rounded-full mr-3" />
              Payment Methods
            </h3>
            
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={salesReport?.payment_methods || []}
                    cx="50%"
                    cy="50%"
                    outerRadius="80%"
                    fill="#8884d8"
                    dataKey="amount"
                    label={({ method, percent }) => `${method} ${(percent * 100).toFixed(0)}%`}
                  >
                    {(salesReport?.payment_methods || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </AnimatedCard>
      </div>

      {/* Recent Transactions */}
      <AnimatedCard delay={0.7}>
        <div className="p-6">
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
            <div className="w-2 h-6 bg-gradient-to-b from-warning-500 to-error-500 rounded-full mr-3" />
            Recent Transactions
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-700/50">
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Transaction #</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Date</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Items</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Payment</th>
                  <th className="text-right py-3 px-4 text-gray-300 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((transaction, index) => (
                  <motion.tr
                    key={transaction.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-dark-700/30 hover:bg-dark-700/30 transition-colors"
                  >
                    <td className="py-3 px-4 text-white font-medium">
                      {transaction.transaction_number}
                    </td>
                    <td className="py-3 px-4 text-gray-300">
                      {new Date(transaction.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-gray-300">
                      {transaction.items.reduce((sum, item) => sum + item.quantity, 0)} items
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        transaction.payment_method === 'cash' 
                          ? 'bg-success-500/20 text-success-400'
                          : transaction.payment_method === 'card'
                          ? 'bg-primary-500/20 text-primary-400'
                          : 'bg-accent-500/20 text-accent-400'
                      }`}>
                        {transaction.payment_method}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-primary-400 font-semibold">
                      {formatCurrency(transaction.total_amount)}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </AnimatedCard>
    </div>
  );
}