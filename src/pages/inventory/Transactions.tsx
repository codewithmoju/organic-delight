import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowUpRight, ArrowDownLeft, Package, DollarSign,
  User, ShoppingBag, Receipt, Building2, Filter,
  Clock, ChevronRight, Hash, Search, X, ArrowRight, BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { getTransactions } from '../../lib/api/transactions';
import { getPurchases } from '../../lib/api/purchases';
import { Transaction, Purchase } from '../../lib/types';
import { formatCurrency, formatDate } from '../../lib/utils/notifications';
import { usePagination } from '../../lib/hooks/usePagination';
import PaginationControls from '../../components/ui/PaginationControls';
import TransactionSkeleton from '../../components/skeletons/TransactionSkeleton';

// ============================================
// HELPER: Relative time formatting
// ============================================
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}

function parseDate(d: any): Date {
  if (!d) return new Date();
  if (d instanceof Date) return d;
  if (typeof d?.toDate === 'function') return d.toDate();
  return new Date(d);
}

// ============================================
// STAT CARD COMPONENT (inline)
// ============================================
function StatCard({ icon: Icon, label, value, accent, delay = 0 }: {
  icon: any; label: string; value: string | number; accent: string; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-2xl bg-card border border-border/60 p-5 group hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
    >
      {/* Accent glow */}
      <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity ${accent}`} />

      <div className="relative flex items-center gap-4">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${accent} bg-opacity-15`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground tracking-wide uppercase">{label}</p>
          <p className="text-xl font-bold text-foreground mt-0.5">{value}</p>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// TRANSACTION ROW COMPONENT
// ============================================
function TransactionRow({ transaction, index }: { transaction: any; index: number }) {
  const isStockIn = transaction.type === 'stock_in';
  const transDate = parseDate(transaction.transaction_date);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35, delay: index * 0.03, ease: [0.22, 1, 0.36, 1] }}
      className="group relative"
    >
      <div className="flex items-center gap-4 p-4 rounded-2xl hover:bg-card/80 transition-all duration-200 cursor-default">
        {/* Timeline indicator */}
        <div className="relative flex-shrink-0">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 ${isStockIn
            ? 'bg-[rgb(var(--success)/.12)] text-[rgb(var(--success))]'
            : 'bg-[rgb(var(--error)/.12)] text-[rgb(var(--error))]'
            }`}>
            {isStockIn ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-foreground truncate">
              {transaction.item?.name || 'Unknown Item'}
            </h4>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${isStockIn
              ? 'bg-[rgb(var(--success)/.1)] text-[rgb(var(--success))]'
              : 'bg-[rgb(var(--error)/.1)] text-[rgb(var(--error))]'
              }`}>
              {isStockIn ? 'IN' : 'OUT'}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {getRelativeTime(transDate)}
            </span>
            {transaction.supplier_customer && (
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                <span className="truncate max-w-[120px]">{transaction.supplier_customer}</span>
              </span>
            )}
            {transaction.reference_number && (
              <span className="hidden sm:flex items-center gap-1">
                <Hash className="w-3 h-3" />
                {transaction.reference_number}
              </span>
            )}
          </div>
        </div>

        {/* Quantity & Value */}
        <div className="text-right flex-shrink-0">
          <div className={`text-lg font-bold tabular-nums ${isStockIn ? 'text-[rgb(var(--success))]' : 'text-[rgb(var(--error))]'
            }`}>
            {isStockIn ? '+' : '-'}{transaction.quantity}
            <span className="text-xs font-normal text-muted-foreground ml-1">
              {transaction.item?.unit || 'pcs'}
            </span>
          </div>
          <div className="text-xs text-muted-foreground tabular-nums">
            {formatCurrency(transaction.total_value)}
          </div>
        </div>
      </div>

      {/* Subtle separator */}
      <div className="mx-4 border-b border-border/30 last:border-0" />
    </motion.div>
  );
}

// ============================================
// PURCHASE ROW COMPONENT
// ============================================
function PurchaseRow({ purchase, index }: { purchase: Purchase; index: number }) {
  const purchDate = parseDate(purchase.purchase_date);
  const itemCount = purchase.items?.length || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35, delay: index * 0.03, ease: [0.22, 1, 0.36, 1] }}
      className="group"
    >
      <div className="flex items-center gap-4 p-4 rounded-2xl hover:bg-card/80 transition-all duration-200 cursor-default">
        {/* Icon */}
        <div className="flex-shrink-0">
          <div className="w-11 h-11 rounded-xl bg-[rgb(var(--info)/.12)] text-[rgb(var(--info))] flex items-center justify-center transition-all duration-300 group-hover:scale-110">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-foreground truncate">{purchase.purchase_number}</h4>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${purchase.payment_status === 'paid'
              ? 'bg-[rgb(var(--success)/.1)] text-[rgb(var(--success))]'
              : purchase.payment_status === 'partial'
                ? 'bg-[rgb(var(--warning)/.1)] text-[rgb(var(--warning))]'
                : 'bg-[rgb(var(--error)/.1)] text-[rgb(var(--error))]'
              }`}>
              {purchase.payment_status}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              <span className="truncate max-w-[120px]">{purchase.vendor_name}</span>
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {getRelativeTime(purchDate)}
            </span>
            <span className="hidden sm:flex items-center gap-1">
              <Package className="w-3 h-3" />
              {itemCount} item{itemCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Amount */}
        <div className="text-right flex-shrink-0">
          <div className="text-lg font-bold text-foreground tabular-nums">
            {formatCurrency(purchase.total_amount)}
          </div>
          {purchase.pending_amount > 0 && (
            <div className="text-xs text-[rgb(var(--error))] tabular-nums">
              {formatCurrency(purchase.pending_amount)} due
            </div>
          )}
        </div>

        <ChevronRight className="w-4 h-4 text-muted-foreground/50 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      <div className="mx-4 border-b border-border/30" />
    </motion.div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function Transactions() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') as 'all' | 'purchases' | 'sales' || 'all';

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [filteredPurchases, setFilteredPurchases] = useState<Purchase[]>([]);

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
      navigate('/purchases/new');
    }
  }, [searchParams, navigate, activeTab]);

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
      const [transactionsResult, purchasesResult] = await Promise.all([
        getTransactions(),
        getPurchases()
      ]);
      setTransactions(transactionsResult.transactions || transactionsResult);
      setPurchases(purchasesResult);
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
          (p.purchase_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.vendor_name || '').toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      setFilteredPurchases(filtered);
    } else {
      let filtered = transactions;

      if (activeTab === 'sales') {
        filtered = filtered.filter(t => t.type === 'stock_out');
      } else if (filterType !== 'all') {
        filtered = filtered.filter(t => t.type === filterType);
      }

      if (searchQuery) {
        filtered = filtered.filter(t =>
          (t.item?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (t.supplier_customer || '').toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      if (dateFilter !== 'all') {
        const startDate = new Date();
        switch (dateFilter) {
          case 'today':
            startDate.setHours(0, 0, 0, 0);
            break;
          case 'week':
            startDate.setDate(startDate.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(startDate.getMonth() - 1);
            break;
        }

        filtered = filtered.filter(t => {
          try {
            const transactionDate = parseDate(t.transaction_date);
            return !isNaN(transactionDate.getTime()) && transactionDate >= startDate;
          } catch {
            return false;
          }
        });
      }

      setFilteredTransactions(filtered);
    }
  }

  // ============================================
  // COMPUTED STATS
  // ============================================
  const stats = useMemo(() => {
    const stockInTx = transactions.filter(t => t.type === 'stock_in');
    const stockOutTx = transactions.filter(t => t.type === 'stock_out');
    const totalIn = stockInTx.reduce((s, t) => s + (t.total_value || 0), 0);
    const totalOut = stockOutTx.reduce((s, t) => s + (t.total_value || 0), 0);
    const totalUnits = stockInTx.reduce((s, t) => s + (t.quantity || 0), 0);

    return {
      totalTransactions: transactions.length,
      totalPurchaseValue: totalIn,
      totalSalesValue: totalOut,
      totalUnitsIn: totalUnits,
      purchaseOrders: purchases.length,
    };
  }, [transactions, purchases]);

  // ============================================
  // TAB CONFIGURATION
  // ============================================
  const tabs = [
    { id: 'all', label: t('transactions.tabs.allLogs', 'All Activity'), icon: BarChart3 },
    { id: 'purchases', label: t('transactions.tabs.procurement', 'Purchases'), icon: ShoppingBag },
    { id: 'sales', label: t('transactions.tabs.salesHistory', 'Sales'), icon: DollarSign },
  ];

  const dateFilterOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'Last 7 Days' },
    { value: 'month', label: 'Last 30 Days' },
  ];

  const typeFilterOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'stock_in', label: 'Stock In' },
    { value: 'stock_out', label: 'Stock Out' },
  ];

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="relative min-h-screen pb-8">
      {isLoading ? <TransactionSkeleton /> : (
        <>
          <div className="space-y-6">
            {/* ─── HEADER ─── */}
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg shadow-primary/20">
                    <BarChart3 className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                      {t('transactions.activityLog', 'Activity Log')}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      {t('transactions.historySubtitle', 'Track every movement in your business')}
                    </p>
                  </div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/purchases/new')}
                className="btn-primary flex items-center gap-2 shadow-lg shadow-primary/20 rounded-xl"
              >
                <ShoppingBag className="w-4 h-4" />
                {t('transactions.addPurchase', 'New Purchase')}
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </motion.div>

            {/* ─── STATS CARDS ─── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard
                icon={BarChart3}
                label="Total Logs"
                value={stats.totalTransactions}
                accent="text-primary bg-primary/10"
                delay={0.05}
              />
              <StatCard
                icon={ArrowDownLeft}
                label="Stock In Value"
                value={formatCurrency(stats.totalPurchaseValue)}
                accent="text-[rgb(var(--success))] bg-[rgb(var(--success)/.1)]"
                delay={0.1}
              />
              <StatCard
                icon={ArrowUpRight}
                label="Stock Out Value"
                value={formatCurrency(stats.totalSalesValue)}
                accent="text-[rgb(var(--error))] bg-[rgb(var(--error)/.1)]"
                delay={0.15}
              />
              <StatCard
                icon={ShoppingBag}
                label="Purchase Orders"
                value={stats.purchaseOrders}
                accent="text-[rgb(var(--info))] bg-[rgb(var(--info)/.1)]"
                delay={0.2}
              />
            </div>

            {/* ─── TABS ─── */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="bg-card rounded-2xl border border-border/60 p-1.5 shadow-sm"
            >
              <div className="flex gap-1">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`relative flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-300 ${isActive
                        ? 'text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                        }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeTabBg"
                          className="absolute inset-0 bg-gradient-to-r from-primary to-primary-dark rounded-xl shadow-md shadow-primary/20"
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                      )}
                      <span className="relative flex items-center gap-2">
                        <tab.icon className="w-4 h-4" />
                        <span className="hidden sm:inline">{tab.label}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>

            {/* ─── SEARCH & FILTERS ─── */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-3"
            >
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={activeTab === 'purchases' ? 'Search purchases...' : 'Search activity...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-10 py-3 bg-card border border-border/60 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary/50 outline-none transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Type filter (only on All tab) */}
              {activeTab === 'all' && (
                <div className="flex gap-1.5 bg-card border border-border/60 rounded-xl p-1.5">
                  {typeFilterOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setFilterType(opt.value as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap ${filterType === opt.value
                        ? 'bg-primary/10 text-primary shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                        }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Date filter */}
              <div className="flex gap-1.5 bg-card border border-border/60 rounded-xl p-1.5">
                {dateFilterOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setDateFilter(opt.value as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap ${dateFilter === opt.value
                      ? 'bg-primary/10 text-primary shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                      }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* ─── CONTENT ─── */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.25 }}
              className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden"
            >
              {/* Results count header */}
              <div className="px-5 py-3 border-b border-border/40 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Filter className="w-3.5 h-3.5" />
                  <span className="font-medium">
                    {activeTab === 'purchases'
                      ? `${filteredPurchases.length} purchase order${filteredPurchases.length !== 1 ? 's' : ''}`
                      : `${filteredTransactions.length} transaction${filteredTransactions.length !== 1 ? 's' : ''}`
                    }
                  </span>
                  {(searchQuery || filterType !== 'all' || dateFilter !== 'all') && (
                    <span className="text-primary/80">• filtered</span>
                  )}
                </div>
                {(searchQuery || filterType !== 'all' || dateFilter !== 'all') && (
                  <button
                    onClick={() => { setSearchQuery(''); setFilterType('all'); setDateFilter('all'); }}
                    className="text-xs text-primary hover:text-primary-dark font-medium transition-colors"
                  >
                    Clear filters
                  </button>
                )}
              </div>

              {/* List */}
              <div className="divide-y-0">
                <AnimatePresence mode="wait">
                  {activeTab === 'purchases' ? (
                    // ─── PURCHASES TAB ───
                    pagination.paginatedData.length === 0 ? (
                      <EmptyState
                        icon={ShoppingBag}
                        title="No purchase orders found"
                        subtitle="Create your first purchase to see it here"
                      />
                    ) : (
                      <motion.div
                        key="purchases-list"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        {pagination.paginatedData.map((purchase: any, index: number) => (
                          <PurchaseRow key={purchase.id} purchase={purchase} index={index} />
                        ))}
                      </motion.div>
                    )
                  ) : (
                    // ─── TRANSACTIONS TAB (All / Sales) ───
                    pagination.paginatedData.length === 0 ? (
                      <EmptyState
                        icon={Package}
                        title={activeTab === 'sales' ? 'No sales recorded yet' : 'No activity yet'}
                        subtitle="Transactions will appear here as they happen"
                      />
                    ) : (
                      <motion.div
                        key="transactions-list"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        {pagination.paginatedData.map((transaction: any, index: number) => (
                          <TransactionRow key={transaction.id} transaction={transaction} index={index} />
                        ))}
                      </motion.div>
                    )
                  )}
                </AnimatePresence>
              </div>

              {/* Pagination */}
              {(activeTab === 'purchases' ? filteredPurchases.length : filteredTransactions.length) > 0 && (
                <div className="p-4 border-t border-border/40">
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
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================
// EMPTY STATE COMPONENT
// ============================================
function EmptyState({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center py-16 px-6"
    >
      <motion.div
        initial={{ y: 10 }}
        animate={{ y: [10, -4, 10] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="w-16 h-16 rounded-2xl bg-secondary/60 flex items-center justify-center mb-4"
      >
        <Icon className="w-8 h-8 text-muted-foreground/50" />
      </motion.div>
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-xs text-center">{subtitle}</p>
    </motion.div>
  );
}