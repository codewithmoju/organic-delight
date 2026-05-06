import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Wallet, RefreshCw, Calendar, CreditCard, TrendingDown, Hash, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { getAllOrganizations, getOrgData } from '../../lib/api/superAdmin';
import { EXPENSE_CATEGORIES } from '../../lib/types';
import type { OrgSummary } from '../../lib/types/org';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import SearchInput from '../../components/ui/SearchInput';
import CustomSelect from '../../components/ui/CustomSelect';
import { formatCurrency } from '../../lib/utils/notifications';

const PAYMENT_METHODS: Record<string, { label: string; icon: string; color: string }> = {
  cash: { label: 'Cash', icon: '💵', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  bank_transfer: { label: 'Bank Transfer', icon: '🏦', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
  digital: { label: 'Digital', icon: '📱', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' },
};

export default function DataExpensesPage() {
  const [orgs, setOrgs] = useState<OrgSummary[]>([]);
  const [selectedOrg, setSelectedOrg] = useState('');
  const [expenses, setExpenses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [orgsLoading, setOrgsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getAllOrganizations().then(setOrgs).catch(() => toast.error('Failed to load orgs')).finally(() => setOrgsLoading(false));
  }, []);

  const load = useCallback(async () => {
    if (!selectedOrg) return;
    setIsLoading(true);
    try {
      const data = await getOrgData(selectedOrg, 'expenses', { limitCount: 500, orderByField: 'created_at' });
      setExpenses(data);
    } catch {
      toast.error('Failed to load expenses');
    } finally {
      setIsLoading(false);
    }
  }, [selectedOrg]);

  useEffect(() => { load(); }, [load]);

  const orgOptions = orgs.map(o => ({ value: o.id, label: o.name }));

  const filtered = useMemo(() => {
    if (!search) return expenses;
    const q = search.toLowerCase();
    return expenses.filter(e =>
      (e.description || '').toLowerCase().includes(q)
      || (e.category || '').toLowerCase().includes(q)
      || (e.reference_number || '').toLowerCase().includes(q)
    );
  }, [expenses, search]);

  const getCategoryInfo = (cat: string) => {
    return EXPENSE_CATEGORIES.find(c => c.value === cat) || { label: cat || 'Other', icon: '📋' };
  };

  // Stats
  const stats = useMemo(() => {
    const total = filtered.reduce((sum, e) => sum + (e.amount || 0), 0);
    const thisMonth = filtered.filter(e => {
      const d = e.expense_date ? new Date(e.expense_date) : e.created_at ? new Date(e.created_at) : null;
      if (!d) return false;
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const thisMonthTotal = thisMonth.reduce((sum, e) => sum + (e.amount || 0), 0);

    // Top category
    const catTotals: Record<string, number> = {};
    for (const e of filtered) {
      const cat = e.category || 'other';
      catTotals[cat] = (catTotals[cat] || 0) + (e.amount || 0);
    }
    const topCat = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0];

    return {
      total,
      count: filtered.length,
      thisMonthTotal,
      thisMonthCount: thisMonth.length,
      topCategory: topCat ? getCategoryInfo(topCat[0]).label : '-',
      topCategoryAmount: topCat ? topCat[1] : 0,
    };
  }, [filtered]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-orange-500/40 via-orange-400/25 to-teal-600/20 p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/15 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-500/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/4" />
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Expenses Explorer</h1>
        <p className="mt-2 text-muted-foreground">Browse and analyze expenses across any organization.</p>
      </div>

      {/* Org Selector */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <CustomSelect
            options={orgOptions}
            value={selectedOrg}
            onChange={setSelectedOrg}
            placeholder={orgsLoading ? 'Loading orgs...' : 'Select organization...'}
          />
        </div>
        {selectedOrg && (
          <button onClick={load} className="btn-secondary flex items-center gap-2 px-4 py-2.5 text-sm">
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Stats */}
      {selectedOrg && !isLoading && expenses.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Expenses', value: formatCurrency(stats.total), icon: TrendingDown, color: 'text-error-500', bg: 'bg-error-500/10' },
            { label: 'This Month', value: formatCurrency(stats.thisMonthTotal), icon: Calendar, color: 'text-primary', bg: 'bg-primary/10' },
            { label: 'Total Records', value: stats.count.toString(), icon: Hash, color: 'text-foreground', bg: 'bg-secondary' },
            { label: 'Top Category', value: stats.topCategory, icon: Building2, color: 'text-foreground', bg: 'bg-secondary' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl bg-card border border-orange-500/20 p-4 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-7 h-7 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
                </div>
                <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
              </div>
              <p className={`text-lg font-bold tabular-nums ${stat.color}`}>{stat.value}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Search */}
      {selectedOrg && (
        <SearchInput value={search} onChange={setSearch} placeholder="Search by description, category, or reference..." />
      )}

      {/* Empty States */}
      {!selectedOrg && <EmptyState icon={Wallet} title="Select an organization" description="Choose an organization to browse its expenses." />}

      {selectedOrg && isLoading && <div className="flex justify-center py-12"><LoadingSpinner size="lg" text="Loading expenses..." /></div>}

      {selectedOrg && !isLoading && filtered.length === 0 && (
        <EmptyState icon={Wallet} title="No expenses found" description={search ? 'Try a different search term.' : 'No expenses recorded for this organization.'} />
      )}

      {/* Expenses List */}
      {selectedOrg && !isLoading && filtered.length > 0 && (
        <div className="card-theme rounded-[2.5rem] overflow-hidden border border-border/50 shadow-sm">
          <div className="divide-y divide-border/30">
            {filtered.slice(0, 100).map((e, i) => {
              const catInfo = getCategoryInfo(e.category);
              const methodInfo = PAYMENT_METHODS[e.payment_method] || { label: e.payment_method || '-', icon: '💳', color: 'bg-secondary text-foreground border-border' };
              const expenseDate = e.expense_date ? new Date(e.expense_date) : e.created_at ? new Date(e.created_at) : null;

              return (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="flex items-center gap-4 p-4 sm:p-5 hover:bg-secondary/20 transition-colors"
                >
                  {/* Category Icon */}
                  <div className="w-12 h-12 rounded-xl bg-orange-500/15 flex items-center justify-center flex-shrink-0 text-xl border border-orange-500/20">
                    {catInfo.icon}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">{e.description || '-'}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-secondary/60 border border-border/40 text-foreground">
                        {catInfo.icon} {catInfo.label}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${methodInfo.color}`}>
                        {methodInfo.icon} {methodInfo.label}
                      </span>
                      {expenseDate && (
                        <span className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {expenseDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                    {e.reference_number && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Hash className="w-3 h-3" /> Ref: {e.reference_number}
                      </p>
                    )}
                  </div>

                  {/* Amount */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold font-mono tabular-nums text-error-500 tracking-tight">
                      {formatCurrency(e.amount || 0)}
                    </p>
                    {expenseDate && (
                      <p className="text-xs text-muted-foreground sm:hidden">
                        {expenseDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
          {filtered.length > 100 && (
            <div className="px-6 py-3 text-xs text-muted-foreground text-center border-t border-border/30 bg-secondary/10">
              Showing 100 of {filtered.length} expenses
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
