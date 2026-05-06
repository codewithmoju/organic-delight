import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpDown, ArrowDownLeft, ArrowUpRight, RefreshCw, Clock, User, Hash, TrendingUp, TrendingDown, Package } from 'lucide-react';
import { toast } from 'sonner';
import { getAllOrganizations, getOrgData } from '../../lib/api/superAdmin';
import type { OrgSummary } from '../../lib/types/org';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import SearchInput from '../../components/ui/SearchInput';
import CustomSelect from '../../components/ui/CustomSelect';
import { formatCurrency, formatDate } from '../../lib/utils/notifications';

export default function DataTransactionsPage() {
  const [orgs, setOrgs] = useState<OrgSummary[]>([]);
  const [selectedOrg, setSelectedOrg] = useState('');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [itemsMap, setItemsMap] = useState<Map<string, string>>(new Map());
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
      const [txData, itemsData] = await Promise.all([
        getOrgData(selectedOrg, 'transactions', { limitCount: 500, orderByField: 'created_at' }),
        getOrgData(selectedOrg, 'items', { limitCount: 500 }),
      ]);
      setTransactions(txData);
      // Build item name lookup
      const map = new Map<string, string>();
      for (const item of itemsData) {
        map.set(item.id, item.name || item.id);
      }
      setItemsMap(map);
    } catch {
      toast.error('Failed to load transactions');
    } finally {
      setIsLoading(false);
    }
  }, [selectedOrg]);

  useEffect(() => { load(); }, [load]);

  const orgOptions = orgs.map(o => ({ value: o.id, label: o.name }));

  const getItemName = (t: any) => {
    if (t.item_name) return t.item_name;
    if (t.item_id) return itemsMap.get(t.item_id) || t.item_id;
    return 'Unknown Item';
  };

  const filtered = useMemo(() => {
    if (!search) return transactions;
    const q = search.toLowerCase();
    return transactions.filter(t => {
      const name = getItemName(t).toLowerCase();
      return name.includes(q)
        || (t.supplier_customer || '').toLowerCase().includes(q)
        || (t.reference_number || '').toLowerCase().includes(q)
        || (t.type || '').toLowerCase().includes(q);
    });
  }, [transactions, search]);

  // Stats
  const stats = useMemo(() => {
    const stockIn = filtered.filter(t => t.type === 'stock_in');
    const stockOut = filtered.filter(t => t.type === 'stock_out');
    const totalIn = stockIn.reduce((s, t) => s + (t.quantity ?? 0), 0);
    const totalOut = stockOut.reduce((s, t) => s + (t.quantity ?? 0), 0);
    const totalValueIn = stockIn.reduce((s, t) => s + (t.total_value || (t.quantity * t.unit_price) || 0), 0);
    const totalValueOut = stockOut.reduce((s, t) => s + (t.total_value || (t.quantity * t.unit_price) || 0), 0);
    return {
      totalIn,
      totalOut,
      totalValueIn,
      totalValueOut,
      inCount: stockIn.length,
      outCount: stockOut.length,
    };
  }, [filtered]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-orange-500/40 via-orange-400/25 to-teal-600/20 p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/15 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-500/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/4" />
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Transactions Explorer</h1>
        <p className="mt-2 text-muted-foreground">Browse stock movements and transactions across any organization.</p>
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
      {selectedOrg && !isLoading && transactions.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Stock In', value: `+${stats.totalIn}`, sub: `${stats.inCount} transactions`, icon: TrendingUp, color: 'text-success-500', bg: 'bg-success-500/10' },
            { label: 'Stock Out', value: `-${stats.totalOut}`, sub: `${stats.outCount} transactions`, icon: TrendingDown, color: 'text-error-500', bg: 'bg-error-500/10' },
            { label: 'Value In', value: formatCurrency(stats.totalValueIn), sub: 'Total cost', icon: ArrowDownLeft, color: 'text-success-500', bg: 'bg-success-500/10' },
            { label: 'Value Out', value: formatCurrency(stats.totalValueOut), sub: 'Total sold', icon: ArrowUpRight, color: 'text-error-500', bg: 'bg-error-500/10' },
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
              <p className="text-[11px] text-muted-foreground mt-0.5">{stat.sub}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Search */}
      {selectedOrg && (
        <SearchInput value={search} onChange={setSearch} placeholder="Search by item name, supplier, or reference..." />
      )}

      {/* Empty States */}
      {!selectedOrg && <EmptyState icon={ArrowUpDown} title="Select an organization" description="Choose an organization to browse its stock transactions." />}

      {selectedOrg && isLoading && <div className="flex justify-center py-12"><LoadingSpinner size="lg" text="Loading transactions..." /></div>}

      {selectedOrg && !isLoading && filtered.length === 0 && (
        <EmptyState icon={ArrowUpDown} title="No transactions found" description={search ? 'Try a different search term.' : 'No stock transactions recorded for this organization.'} />
      )}

      {/* Transactions List */}
      {selectedOrg && !isLoading && filtered.length > 0 && (
        <div className="card-theme rounded-[2.5rem] overflow-hidden border border-border/50 shadow-sm">
          <div className="divide-y divide-border/30">
            {filtered.slice(0, 100).map((t, i) => {
              const isStockIn = t.type === 'stock_in';
              const TypeIcon = isStockIn ? ArrowDownLeft : ArrowUpRight;
              const qty = t.quantity ?? 0;
              const value = t.total_value || (qty * (t.unit_price || 0)) || 0;

              return (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="flex items-center gap-4 p-4 sm:p-5 hover:bg-secondary/20 transition-colors"
                >
                  {/* Type Icon */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isStockIn ? 'bg-success-500/10 text-success-500' : 'bg-error-500/10 text-error-500'}`}>
                    <TypeIcon className="w-5 h-5" />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground truncate">{getItemName(t)}</p>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${isStockIn ? 'bg-success-500/10 text-success-500' : 'bg-error-500/10 text-error-500'}`}>
                        {isStockIn ? 'Stock In' : 'Stock Out'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {t.supplier_customer && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <User className="w-3 h-3" /> {t.supplier_customer}
                        </span>
                      )}
                      {t.reference_number && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Hash className="w-3 h-3" /> {t.reference_number}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" /> {formatDate(t.transaction_date || t.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Quantity & Value */}
                  <div className="text-right flex-shrink-0">
                    <p className={`text-xl font-bold tabular-nums ${isStockIn ? 'text-success-500' : 'text-error-500'}`}>
                      {isStockIn ? '+' : '-'}{qty}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono tabular-nums mt-0.5">
                      {formatCurrency(value)}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
          {filtered.length > 100 && (
            <div className="px-6 py-3 text-xs text-muted-foreground text-center border-t border-border/30 bg-secondary/10">
              Showing 100 of {filtered.length} transactions
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
