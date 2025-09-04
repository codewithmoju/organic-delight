import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { Plus, ArrowUpRight, ArrowDownLeft, Calendar, Filter, Package, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { getTransactions } from '../../lib/api/transactions';
import { getItems } from '../../lib/api/items';
import { Transaction, Item } from '../../lib/types';
import TransactionForm from '../../components/inventory/TransactionForm';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import AnimatedCard from '../../components/ui/AnimatedCard';
import { formatCurrency } from '../../lib/utils/notifications';

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'in' | 'out'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [transactions, filterType, dateFilter]);

  async function loadData() {
    try {
      const [transactionsResult, itemsResult] = await Promise.all([
        getTransactions(),
        getItems()
      ]);
      
      setTransactions(transactionsResult.transactions || transactionsResult);
      setItems(itemsResult.items || itemsResult);
    } catch (error) {
      toast.error('Failed to load transactions');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  function filterTransactions() {
    let filtered = transactions;

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(t => t.type === filterType);
    }

    // Filter by date
    if (dateFilter !== 'all') {
      const now = new Date();
      const startDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
      }
      
      filtered = filtered.filter(t => {
        const transactionDate = new Date(t.created_at.toDate ? t.created_at.toDate() : t.created_at);
        return transactionDate >= startDate;
      });
    }

    setFilteredTransactions(filtered);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" text="Loading transactions..." />
      </div>
    );
  }

  if (isFormOpen) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gradient">New Transaction</h1>
          <p className="text-gray-400 mt-2">Record a new inventory transaction</p>
        </div>
        
        <AnimatedCard>
          <div className="p-6">
            <TransactionForm
              items={items}
              onComplete={() => {
                setIsFormOpen(false);
                loadData();
              }}
              onCancel={() => setIsFormOpen(false)}
            />
          </div>
        </AnimatedCard>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gradient">Transactions</h1>
          <p className="text-gray-400 mt-1 text-sm sm:text-base">
            Track all inventory movements and changes
          </p>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={() => setIsFormOpen(true)}
          className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center"
        >
          <Plus className="h-4 w-4" />
          New Transaction
        </motion.button>
      </motion.div>

      {/* Filters */}
      <AnimatedCard delay={0.1}>
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Transaction Type
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="w-full input-dark"
              >
                <option value="all">All Transactions</option>
                <option value="in">Stock In</option>
                <option value="out">Stock Out</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Date Range
              </label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="w-full input-dark"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
            </div>
          </div>
        </div>
      </AnimatedCard>

      {/* Transactions List */}
      <AnimatedCard delay={0.2}>
        <div className="p-4 sm:p-6">
          <div className="space-y-3 sm:space-y-4">
            <AnimatePresence>
              {filteredTransactions.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12 sm:py-16 px-4"
                >
                  <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-400 mb-2">No transactions found</h3>
                  <p className="text-gray-500 mb-6 text-sm sm:text-base">
                    {filterType !== 'all' || dateFilter !== 'all' 
                      ? 'Try adjusting your filter criteria'
                      : 'Start by recording your first transaction'
                    }
                  </p>
                  {filterType === 'all' && dateFilter === 'all' && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsFormOpen(true)}
                      className="btn-primary"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Record First Transaction
                    </motion.button>
                  )}
                </motion.div>
              ) : (
                filteredTransactions.map((transaction, index) => (
                  <motion.div
                    key={transaction.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02, x: 4 }}
                    className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-dark-800/30 border border-dark-700/30 hover:border-primary-500/30 transition-all duration-200 w-full"
                  >
                    <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
                      <div className={`p-3 rounded-xl ${
                        transaction.type === 'in' 
                          ? 'bg-success-500/20 text-success-400' 
                          : 'bg-error-500/20 text-error-400'
                      } flex-shrink-0`}>
                        {transaction.type === 'in' ? (
                          <ArrowUpRight className="w-5 h-5" />
                        ) : (
                          <ArrowDownLeft className="w-5 h-5" />
                        )}
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <h4 className="text-white font-semibold text-sm sm:text-base truncate">
                          {transaction.item?.name || 'Unknown Item'}
                        </h4>
                        <div className="flex items-center text-xs sm:text-sm text-gray-400 mt-1">
                          <Calendar className="w-4 h-4 mr-1" />
                          {format(
                            new Date(transaction.created_at.toDate ? transaction.created_at.toDate() : transaction.created_at), 
                            'MMM d, yyyy HH:mm'
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right flex-shrink-0">
                      <div className={`text-lg font-bold ${
                        transaction.type === 'in' ? 'text-success-400' : 'text-error-400'
                      } text-sm sm:text-lg`}>
                        {transaction.type === 'in' ? '+' : '-'}{Math.abs(transaction.quantity_changed)}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-400">
                        {transaction.item?.unit || 'units'}
                      </div>
                      {transaction.cost_per_unit && (
                        <div className="text-xs sm:text-sm text-primary-400 mt-1">
                          {formatCurrency(
                            Math.abs(transaction.quantity_changed) * transaction.cost_per_unit,
                            transaction.item?.currency || 'USD'
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </AnimatedCard>
    </div>
  );
}