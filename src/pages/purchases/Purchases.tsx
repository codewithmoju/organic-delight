import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Filter, ShoppingBag, Calendar,
  Building2, ChevronRight, TrendingUp, Package,
  CheckCircle2, Clock, AlertCircle, XCircle,
  Eye, FileText
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format, subDays } from 'date-fns';
import { Purchase } from '../../lib/types';
import { getPurchases } from '../../lib/api/purchases';
import { formatCurrency } from '../../lib/utils/notifications';
import { useAuthStore } from '../../lib/store';
import CustomSelect from '../../components/ui/CustomSelect';
import SearchInput from '../../components/ui/SearchInput';
import PurchaseDetailModal from '../../components/purchases/PurchaseDetailModal';
import PurchaseAnalytics from '../../components/purchases/PurchaseAnalytics';
import ExportMenu from '../../components/ui/ExportMenu';
import { usePagination } from '../../lib/hooks/usePagination';
import PaginationControls from '../../components/ui/PaginationControls';
import { readScopedJSON, writeScopedJSON } from '../../lib/utils/storageScope';

// ── Status badge ──────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  paid: { label: 'Paid', icon: CheckCircle2, classes: 'bg-success-500/10 text-success-500 border-success-500/20' },
  partial: { label: 'Partial', icon: Clock, classes: 'bg-warning-500/10 text-warning-500 border-warning-500/20' },
  unpaid: { label: 'Unpaid', icon: AlertCircle, classes: 'bg-error-500/10 text-error-500 border-error-500/20' },
};

function StatusBadge({ status }: { status: 'paid' | 'partial' | 'unpaid' }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold border ${cfg.classes}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, accent, delay = 0 }: {
  icon: any; label: string; value: string; sub?: string; accent: string; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      className="group relative overflow-hidden rounded-2xl bg-card border border-border/60 p-4 sm:p-5 hover:shadow-md transition-all duration-300"
    >
      <div className={`absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl opacity-15 group-hover:opacity-25 transition-opacity ${accent}`} />
      <div className="relative flex items-center gap-3">
        <div className={`p-2.5 rounded-xl ${accent} bg-opacity-10 flex-shrink-0`}>
          <Icon className={`w-5 h-5 ${accent.replace('bg-', 'text-')}`} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground truncate">{label}</p>
          <h3 className="text-lg sm:text-xl font-bold text-foreground mt-0.5 tracking-tight tabular-nums truncate">{value}</h3>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
      </div>
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Purchases() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [dateFilter, setDateFilter] = useState<string>('30d');
  const purchasesCacheKey = `purchases_page_cache_${dateFilter}`;
  const [purchases, setPurchases] = useState<Purchase[]>(() =>
    readScopedJSON<Purchase[]>(purchasesCacheKey, [], undefined, purchasesCacheKey)
  );
  const [isLoading, setIsLoading] = useState(() =>
    readScopedJSON<Purchase[]>(purchasesCacheKey, [], undefined, purchasesCacheKey).length === 0
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'analytics'>('list');

  // ── Load data ───────────────────────────────────────────────────────────
  const loadPurchases = useCallback(async () => {
    const hasWarmCache = readScopedJSON<Purchase[]>(purchasesCacheKey, [], undefined, purchasesCacheKey).length > 0;
    if (!hasWarmCache) setIsLoading(true);
    try {
      let from: Date | undefined;
      const today = new Date();
      if (dateFilter === '7d') from = subDays(today, 6);
      else if (dateFilter === '30d') from = subDays(today, 29);
      else if (dateFilter === '90d') from = subDays(today, 89);

      const data = await getPurchases(from, from ? today : undefined);
      setPurchases(data);
      writeScopedJSON(purchasesCacheKey, data);
    } catch (err) {
      console.error('Error loading purchases:', err);
    } finally {
      if (!hasWarmCache) setIsLoading(false);
    }
  }, [dateFilter, purchasesCacheKey]);

  useEffect(() => { loadPurchases(); }, [loadPurchases]);

  // ── Derived stats ───────────────────────────────────────────────────────
  const totalSpend = purchases.reduce((s, p) => s + p.total_amount, 0);
  const totalPending = purchases.reduce((s, p) => s + p.pending_amount, 0);
  const totalItems = purchases.reduce((s, p) => s + p.items.length, 0);

  // ── Filtered list ───────────────────────────────────────────────────────
  const filtered = purchases.filter(p => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      !q ||
      p.vendor_name.toLowerCase().includes(q) ||
      p.purchase_number.toLowerCase().includes(q) ||
      (p.bill_number ?? '').toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || p.payment_status === statusFilter;
    return matchSearch && matchStatus;
  });

  const pagination = usePagination({ data: filtered, defaultItemsPerPage: 25 });

  // ── Skeleton ────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6 pb-10 animate-pulse">
        <div className="h-8 w-48 bg-secondary rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[0, 1, 2].map(i => <div key={i} className="h-24 bg-secondary rounded-2xl" />)}
        </div>
        <div className="h-96 bg-secondary rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-10">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="app-page-title">{t('purchases.title', 'Purchases')}</h1>
          <p className="app-page-subtitle">
            {t('purchases.subtitle', 'Track all stock purchases from vendors')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportMenu
            getData={() => filtered.map(p => ({
              'PO #': p.purchase_number,
              'Invoice #': p.bill_number || '',
              Vendor: p.vendor_name,
              Date: format(new Date(p.purchase_date), 'yyyy-MM-dd'),
              Items: p.items.length,
              Status: p.payment_status,
              Total: p.total_amount,
              Paid: p.paid_amount,
              Pending: p.pending_amount,
            }))}
            filename="purchases"
            title="Purchase History"
          />
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate('/purchases/new')}
            className="btn-primary flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold"
          >
            <Plus className="w-4 h-4" />
            {t('purchases.newPurchase', 'New Purchase')}
          </motion.button>
        </div>
      </div>

      {/* ─── Tabs ─── */}
      <div className="flex gap-1 bg-secondary/50 rounded-xl p-1 w-fit">
        {(['list', 'analytics'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all capitalize ${activeTab === tab ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* ─── Stats ─── */}
      {activeTab === 'list' && (
      <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <StatCard icon={TrendingUp} label={t('purchases.stats.totalSpend', 'Total Spend')} value={formatCurrency(totalSpend)} sub={`${purchases.length} orders`} accent="bg-primary" delay={0.05} />
        <StatCard icon={AlertCircle} label={t('purchases.stats.pending', 'Pending Payments')} value={formatCurrency(totalPending)} accent="bg-warning-500" delay={0.1} />
        <StatCard icon={Package} label={t('purchases.stats.items', 'Total Line Items')} value={totalItems.toString()} accent="bg-purple-500" delay={0.15} />
      </div>

      {/* ─── Filters ─── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput
          placeholder={t('purchases.search', 'Search by vendor, PO#, invoice...')}
          value={searchTerm}
          onChange={setSearchTerm}
          className="flex-1"
        />
        <div className="flex gap-2">
          <div className="w-full sm:w-44">
            <CustomSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'paid', label: 'Paid', icon: <CheckCircle2 className="w-3.5 h-3.5 text-success-500" /> },
                { value: 'partial', label: 'Partial', icon: <Clock className="w-3.5 h-3.5 text-warning-500" /> },
                { value: 'unpaid', label: 'Unpaid', icon: <AlertCircle className="w-3.5 h-3.5 text-error-500" /> },
              ]}
              icon={<Filter className="w-4 h-4" />}
            />
          </div>
          <div className="w-full sm:w-40">
            <CustomSelect
              value={dateFilter}
              onChange={setDateFilter}
              options={[
                { value: '7d', label: 'Last 7 days' },
                { value: '30d', label: 'Last 30 days' },
                { value: '90d', label: 'Last 90 days' },
                { value: 'all', label: 'All time' },
              ]}
              icon={<Calendar className="w-4 h-4" />}
            />
          </div>
        </div>
      </div>

      {/* ─── Table / Cards ─── */}
      <div className="bg-card rounded-2xl border border-border/60 overflow-hidden shadow-sm">
        {filtered.length === 0 ? (
          <div className="py-16 text-center px-6">
            <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center mx-auto mb-3">
              <ShoppingBag className="w-8 h-8 text-muted-foreground/40" />
            </div>
            <h3 className="text-base font-semibold text-foreground">
              {purchases.length === 0
                ? t('purchases.noPurchases', 'No purchases yet')
                : t('purchases.noMatch', 'No purchases match your filters')}
            </h3>
            {purchases.length === 0 && (
              <p className="text-muted-foreground text-sm mt-1">
                {t('purchases.noPurchasesHint', 'Create your first purchase order to get started')}
              </p>
            )}
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-border/30">
              <AnimatePresence>
                {pagination.paginatedData.map((purchase, i) => (
                  <motion.div
                    key={purchase.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => setSelectedPurchase(purchase)}
                    className="flex items-start gap-3 px-4 py-3.5 cursor-pointer hover:bg-secondary/30 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <ShoppingBag className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-foreground truncate">{purchase.vendor_name}</p>
                        <span className="text-sm font-bold text-foreground tabular-nums flex-shrink-0">
                          {formatCurrency(purchase.total_amount)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">{purchase.purchase_number}</span>
                        <StatusBadge status={purchase.payment_status} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(purchase.purchase_date), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/40 flex-shrink-0 mt-2" />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-secondary/30 border-b border-border/40">
                    <th className="px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">PO #</th>
                    <th className="px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Vendor</th>
                    <th className="px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                    <th className="px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Items</th>
                    <th className="px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Total</th>
                    <th className="px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Pending</th>
                    <th className="px-5 py-3.5 w-12" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  <AnimatePresence>
                    {pagination.paginatedData.map((purchase, i) => (
                      <motion.tr
                        key={purchase.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        onClick={() => setSelectedPurchase(purchase)}
                        className="group hover:bg-secondary/30 transition-colors cursor-pointer"
                      >
                        <td className="px-5 py-3.5">
                          <div>
                            <p className="text-sm font-semibold text-foreground font-mono">{purchase.purchase_number}</p>
                            {purchase.bill_number && (
                              <p className="text-xs text-muted-foreground mt-0.5">Inv: {purchase.bill_number}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <Building2 className="w-3.5 h-3.5 text-primary" />
                            </div>
                            <span className="text-sm font-medium text-foreground">{purchase.vendor_name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground whitespace-nowrap">
                            <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                            {format(new Date(purchase.purchase_date), 'MMM d, yyyy')}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-sm text-muted-foreground">{purchase.items.length} item{purchase.items.length !== 1 ? 's' : ''}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge status={purchase.payment_status} />
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <span className="text-sm font-bold text-foreground tabular-nums">{formatCurrency(purchase.total_amount)}</span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          {purchase.pending_amount > 0 ? (
                            <span className="text-sm font-semibold text-error-500 tabular-nums">{formatCurrency(purchase.pending_amount)}</span>
                          ) : (
                            <span className="text-sm text-success-500 font-semibold">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <button
                            onClick={e => { e.stopPropagation(); setSelectedPurchase(purchase); }}
                            className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {filtered.length > 0 && (
        <div className="px-4 py-3 border border-border/30 rounded-xl bg-secondary/10">
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

      {/* ─── Detail Modal ─── */}
      <AnimatePresence>
        {selectedPurchase && (
          <PurchaseDetailModal
            purchase={selectedPurchase}
            onClose={() => setSelectedPurchase(null)}
            onUpdated={loadPurchases}
          />
        )}
      </AnimatePresence>
      </>
      )}

      {/* ─── Analytics Tab ─── */}
      {activeTab === 'analytics' && (
        <PurchaseAnalytics purchases={purchases} />
      )}
    </div>
  );
}

