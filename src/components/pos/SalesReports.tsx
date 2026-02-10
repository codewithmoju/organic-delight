import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, TrendingUp, Users, Package } from 'lucide-react';
import { getDailySalesReport, getPOSTransactions } from '../../lib/api/pos';
import { SalesReport, POSTransaction } from '../../lib/types';
import { formatCurrency, formatDate } from '../../lib/utils/notifications';
import LoadingSpinner from '../ui/LoadingSpinner';
import AnimatedCard from '../ui/AnimatedCard';
import { voidTransaction } from '../../lib/api/returns';
import { useAuthStore } from '../../lib/store';
import { X, Receipt, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

export default function SalesReports() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<POSTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<POSTransaction | null>(null);
  const profile = useAuthStore(state => state.profile);
  const isAdmin = profile?.role === 'admin';

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

  const handleVoid = async (transactionId: string) => {
    if (!isAdmin) {
      toast.error('Only admins can void transactions');
      return;
    }

    const reason = window.prompt('Enter reason for voiding this transaction:');
    if (!reason) return;

    try {
      await voidTransaction(transactionId, reason, profile?.id || 'unknown');
      toast.success('Transaction voided successfully');
      setSelectedTransaction(null);
      loadReportData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to void transaction');
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
        <div className="bg-card/95 backdrop-blur-sm p-3 rounded-lg border border-border/50 shadow-lg">
          <p className="text-foreground font-medium">{label}</p>
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
      {/* Header Controls */}
      <div className="flex justify-end mb-4">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-foreground"
        />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <AnimatedCard delay={0.1}>
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground-muted text-sm mb-1">Total Sales</p>
                <p className="text-2xl font-bold text-foreground">
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
                <p className="text-foreground-muted text-sm mb-1">Transactions</p>
                <p className="text-2xl font-bold text-foreground">
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
                <p className="text-foreground-muted text-sm mb-1">Avg. Transaction</p>
                <p className="text-2xl font-bold text-foreground">
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
                <p className="text-foreground-muted text-sm mb-1">Items Sold</p>
                <p className="text-2xl font-bold text-foreground">
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
            <h3 className="text-xl font-semibold text-foreground mb-6 flex items-center">
              <div className="w-2 h-6 bg-gradient-to-b from-primary-500 to-accent-500 rounded-full mr-3" />
              Top Selling Items
            </h3>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesReport?.top_selling_items || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #374151)" opacity={0.3} />
                  <XAxis
                    dataKey="item_name"
                    stroke="var(--color-foreground-muted, #9CA3AF)"
                    fontSize={10}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis stroke="var(--color-foreground-muted, #9CA3AF)" fontSize={10} />
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
            <h3 className="text-xl font-semibold text-foreground mb-6 flex items-center">
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
                    {(salesReport?.payment_methods || []).map((_, index) => (
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
          <h3 className="text-xl font-semibold text-foreground mb-6 flex items-center">
            <div className="w-2 h-6 bg-gradient-to-b from-warning-500 to-error-500 rounded-full mr-3" />
            Recent Transactions
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-3 px-4 text-foreground-muted font-medium">Transaction #</th>
                  <th className="text-left py-3 px-4 text-foreground-muted font-medium">Date</th>
                  <th className="text-left py-3 px-4 text-foreground-muted font-medium">Items</th>
                  <th className="text-left py-3 px-4 text-foreground-muted font-medium">Payment</th>
                  <th className="text-right py-3 px-4 text-foreground-muted font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((transaction, index) => (
                  <motion.tr
                    key={transaction.id}
                    onClick={() => setSelectedTransaction(transaction)}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-border/30 hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 text-foreground font-medium">
                      {transaction.transaction_number}
                    </td>
                    <td className="py-3 px-4 text-foreground-muted">
                      {new Date(transaction.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-foreground-muted">
                      {transaction.items.reduce((sum, item) => sum + item.quantity, 0)} items
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${transaction.payment_method === 'cash'
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

      {/* Transaction Detail Modal */}
      <AnimatePresence>
        {selectedTransaction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-2xl bg-card rounded-2xl border border-border/50 shadow-xl overflow-hidden"
            >
              <div className="p-6 border-b border-border/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary-500/20 text-primary-400">
                    <Receipt className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Transaction Details</h3>
                    <p className="text-sm text-foreground-muted">#{selectedTransaction.transaction_number}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTransaction(null)}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5 text-foreground-muted" />
                </button>
              </div>

              <div className="p-6 max-h-[60vh] overflow-y-auto">
                <div className="space-y-4">
                  <div className="flex justify-between items-start text-sm">
                    <div>
                      <p className="text-foreground-muted">Date & Time</p>
                      <p className="text-foreground font-medium">{formatDate(selectedTransaction.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-foreground-muted">Status</p>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${selectedTransaction.status === 'completed' ? 'bg-success-500/20 text-success-400' :
                        (selectedTransaction.status as string) === 'voided' ? 'bg-error-500/20 text-error-400' :
                          'bg-warning-500/20 text-warning-400'
                        }`}>
                        {selectedTransaction.status}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-border/50 pt-4">
                    <h4 className="text-foreground font-semibold mb-3">Items</h4>
                    <div className="space-y-2">
                      {selectedTransaction.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-muted/30 p-3 rounded-lg border border-border/30">
                          <div>
                            <p className="text-foreground font-medium">{item.item_name}</p>
                            <p className="text-xs text-foreground-muted">{item.quantity} x {formatCurrency(item.unit_price)}</p>
                          </div>
                          <p className="text-primary-400 font-bold">{formatCurrency(item.line_total)}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-border/50 pt-4 space-y-2">
                    <div className="flex justify-between text-foreground-muted">
                      <span>Subtotal</span>
                      <span>{formatCurrency(selectedTransaction.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-foreground-muted">
                      <span>Tax</span>
                      <span>{formatCurrency(selectedTransaction.tax_amount)}</span>
                    </div>
                    {selectedTransaction.discount_amount > 0 && (
                      <div className="flex justify-between text-error-400">
                        <span>Discount</span>
                        <span>-{formatCurrency(selectedTransaction.discount_amount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xl font-bold text-foreground pt-2">
                      <span>Total</span>
                      <span className="text-primary-400">{formatCurrency(selectedTransaction.total_amount)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-muted/20 flex gap-3">
                <button
                  onClick={() => setSelectedTransaction(null)}
                  className="btn-secondary flex-1"
                >
                  Close
                </button>
                {selectedTransaction.status === 'completed' && isAdmin && (
                  <button
                    onClick={() => handleVoid(selectedTransaction.id)}
                    className="btn-primary bg-error-600 hover:bg-error-700 border-error-600 flex items-center justify-center gap-2 flex-1"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Void Transaction
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}