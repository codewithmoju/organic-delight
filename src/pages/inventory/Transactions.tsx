import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ArrowUpRight, ArrowDownLeft, Calendar, Package, DollarSign, User, ShoppingBag, Receipt, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { getTransactions, createTransaction } from '../../lib/api/transactions';
import { getItems } from '../../lib/api/items';
import { getCategories } from '../../lib/api/categories';
import { getPurchases } from '../../lib/api/purchases';
import { Transaction, Item, Category, Purchase } from '../../lib/types';
import EnhancedTransactionForm from '../../components/pos/EnhancedTransactionForm';
import PurchaseForm from '../../components/purchases/PurchaseForm';
import AnimatedCard from '../../components/ui/AnimatedCard';
import { formatCurrency, formatDate } from '../../lib/utils/notifications';
import { usePagination } from '../../lib/hooks/usePagination';
import PaginationControls from '../../components/ui/PaginationControls';
import ContextualLoader from '../../components/ui/ContextualLoader';
import SearchInput from '../../components/ui/SearchInput';

export default function Transactions() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') as 'all' | 'purchases' | 'sales' || 'all';
  const initialAction = searchParams.get('action');

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [filteredPurchases, setFilteredPurchases] = useState<Purchase[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPurchaseFormOpen, setIsPurchaseFormOpen] = useState(initialAction === 'new');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'purchases' | 'sales'>(initialTab);
  const [filterType, setFilterType] = useState<'all' | 'stock_in' | 'stock_out'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Sync tab with URL
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && tab !== activeTab) {
      setActiveTab(tab as any);
    }
    if (searchParams.get('action') === 'new') {
      setIsPurchaseFormOpen(true);
      // Clear action to prevent re-opening
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('action');
      setSearchParams(newParams);
    }
  }, [searchParams]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as any);
    setSearchParams({ tab });
  };

  const pagination = usePagination({
    data: (activeTab === 'purchases' ? filteredPurchases : filteredTransactions) as any[],
    defaultItemsPerPage: 25
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterData();
  }, [transactions, purchases, filterType, dateFilter, searchQuery, activeTab]);

  async function loadData() {
    setIsLoading(true);
    try {
      const [transactionsResult, itemsResult, categoriesResult, purchasesResult] = await Promise.all([
        getTransactions(),
        getItems(),
        getCategories(),
        getPurchases()
      ]);

      setTransactions(transactionsResult.transactions || transactionsResult);
      setPurchases(purchasesResult);
      setItems(itemsResult.items || itemsResult);
      setCategories(categoriesResult);
    } catch (error) {
      toast.error('Failed to load logs');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  function filterData() {
    if (activeTab === 'purchases') {
      let filtered = purchases;
      if (searchQuery) {
        filtered = filtered.filter(p =>
          p.purchase_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.vendor_name.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      setFilteredPurchases(filtered);
    } else {
      let filtered = transactions;

      // Filter by type for 'all' or 'sales'
      if (activeTab === 'sales') {
        filtered = filtered.filter(t => t.type === 'stock_out');
      } else if (filterType !== 'all') {
        filtered = filtered.filter(t => t.type === filterType);
      }

      if (searchQuery) {
        filtered = filtered.filter(t =>
          (t.item?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.supplier_customer.toLowerCase().includes(searchQuery.toLowerCase())
        );
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
          const transactionDate = t.transaction_date instanceof Date ? t.transaction_date : new Date((t.transaction_date as any).toDate?.() || t.transaction_date);
          return transactionDate >= startDate;
        });
      }

      setFilteredTransactions(filtered);
    }
  }

  async function handleTransactionSubmit(data: {
    item_id: string;
    type: 'stock_in' | 'stock_out';
    quantity: number;
    unit_price: number;
    transaction_date: Date;
    supplier_customer: string;
    reference_number?: string;
    notes?: string;
    created_by: string;
  }) {
    try {
      await createTransaction(data);
      await loadData();
    } catch (error) {
      throw error;
    }
  }

  if (isFormOpen) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gradient">New Transaction</h1>
          <p className="text-gray-400 mt-2">Record a new inventory transaction</p>
        </div>

        <AnimatedCard>
          <div className="p-6">
            <EnhancedTransactionForm
              items={items}
              categories={categories}
              onSubmit={handleTransactionSubmit}
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
    <div className="relative">
      <ContextualLoader
        isLoading={isLoading}
        context="transactions"
        variant="overlay"
      />

      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gradient">History & Logs</h1>
            <p className="text-gray-400 mt-1 text-sm sm:text-base">
              Centralized hub for tracking all business movements
            </p>
          </div>

          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsPurchaseFormOpen(true)}
              className="btn-secondary flex items-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              Add Purchase
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => setIsFormOpen(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              General Log
            </motion.button>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex bg-dark-900/50 p-1 rounded-xl border border-dark-700/50">
          {[
            { id: 'all', label: 'All Logs', icon: Package },
            { id: 'purchases', label: 'Procurement', icon: ShoppingBag },
            { id: 'sales', label: 'Sales History', icon: DollarSign },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                ? 'bg-primary-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-dark-800'
                }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <AnimatedCard delay={0.1}>
          <div className="p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <SearchInput
                  placeholder="Search history..."
                  value={searchQuery}
                  onChange={setSearchQuery}
                  className="w-full"
                />
              </div>

              {activeTab === 'all' && (
                <div>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as any)}
                    className="w-full input-dark"
                  >
                    <option value="all">All Types</option>
                    <option value="stock_in">Stock In</option>
                    <option value="stock_out">Stock Out</option>
                  </select>
                </div>
              )}

              <div className={activeTab !== 'all' ? 'md:col-span-2' : ''}>
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

        <PurchaseForm
          isOpen={isPurchaseFormOpen}
          onClose={() => setIsPurchaseFormOpen(false)}
          onSuccess={loadData}
        />

        {/* Tab Content */}
        <AnimatedCard delay={0.2}>
          <div className="p-4 sm:p-6">
            {activeTab === 'purchases' ? (
              <div className="overflow-x-auto">
                {pagination.paginatedData.length === 0 ? (
                  <div className="p-12 text-center text-gray-400">
                    <ShoppingBag className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p>No procurement records found</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-dark-900 border-b border-dark-700/50">
                        <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Purchase #</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Vendor</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-700/30">
                      {pagination.paginatedData.map((purchase: any) => (
                        <tr key={purchase.id} className="hover:bg-dark-700/20 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <Receipt className="w-4 h-4 text-gray-500" />
                              <span className="text-white font-medium">{purchase.purchase_number}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-300">{purchase.vendor_name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-gray-400 text-sm">
                              {formatDate(purchase.purchase_date)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-primary-400 font-bold">{formatCurrency(purchase.total_amount)}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {pagination.paginatedData.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-12 sm:py-16 px-4"
                    >
                      <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-400 mb-2">No logs found</h3>
                      <p className="text-gray-500 text-sm sm:text-base">
                        Try adjusting your search or filter criteria
                      </p>
                    </motion.div>
                  ) : (
                    pagination.paginatedData.map((transaction: any, index) => (
                      <motion.div
                        key={transaction.id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-4 sm:p-6 rounded-xl bg-dark-800/30 border border-dark-700/30 hover:border-primary-500/30 transition-all duration-200"
                      >
                        <div className="flex items-center space-x-4 flex-1 min-w-0">
                          <div className={`p-3 rounded-xl flex-shrink-0 ${transaction.type === 'stock_in'
                            ? 'bg-success-500/20 text-success-400'
                            : 'bg-error-500/20 text-error-400'
                            }`}>
                            {transaction.type === 'stock_in' ? (
                              <ArrowUpRight className="w-6 h-6" />
                            ) : (
                              <ArrowDownLeft className="w-6 h-6" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <h4 className="text-white font-semibold text-lg truncate">
                              {transaction.item?.name || 'Unknown Item'}
                            </h4>
                            <div className="flex items-center text-sm text-gray-400 mt-1">
                              <Calendar className="w-4 h-4 mr-1" />
                              {formatDate(transaction.transaction_date)}
                            </div>
                            <div className="flex items-center text-sm text-gray-400 mt-1">
                              <User className="w-4 h-4 mr-1" />
                              {transaction.supplier_customer}
                            </div>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <div className={`text-xl font-bold ${transaction.type === 'stock_in' ? 'text-success-400' : 'text-error-400'
                            }`}>
                            {transaction.type === 'stock_in' ? '+' : '-'}{transaction.quantity}
                          </div>
                          <div className="text-sm text-gray-400">
                            {formatCurrency(transaction.total_value)}
                          </div>
                          {transaction.reference_number && (
                            <div className="text-xs text-gray-500 mt-1">
                              Ref: {transaction.reference_number}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Pagination */}
          {filteredTransactions.length > 0 && (
            <div className="p-4 sm:p-6 border-t border-dark-700/50">
              <PaginationControls
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={pagination.goToPage}
                hasNextPage={pagination.hasNextPage}
                hasPrevPage={pagination.hasPrevPage}
                startIndex={pagination.startIndex}
                endIndex={pagination.endIndex}
                totalItems={pagination.totalItems}
              />
            </div>
          )}
        </AnimatedCard>
      </div>
    </div>
  );
}