import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Package, Search, RefreshCw, Archive, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { getAllOrganizations, getOrgData } from '../../lib/api/superAdmin';
import type { OrgSummary } from '../../lib/types/org';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import SearchInput from '../../components/ui/SearchInput';
import CustomSelect from '../../components/ui/CustomSelect';
import { formatCurrency } from '../../lib/utils/notifications';

export default function DataItemsPage() {
  const [orgs, setOrgs] = useState<OrgSummary[]>([]);
  const [selectedOrg, setSelectedOrg] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [orgsLoading, setOrgsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    getAllOrganizations().then(setOrgs).catch(() => toast.error('Failed to load orgs')).finally(() => setOrgsLoading(false));
  }, []);

  const loadData = useCallback(async () => {
    if (!selectedOrg) return;
    setIsLoading(true);
    try {
      const [itemsData, catsData] = await Promise.all([
        getOrgData(selectedOrg, 'items', { limitCount: 500, orderByField: 'created_at' }),
        getOrgData(selectedOrg, 'categories', { limitCount: 200 }),
      ]);
      setItems(itemsData);
      const catMap = new Map<string, string>();
      for (const cat of catsData) {
        catMap.set(cat.id, cat.name || cat.id);
      }
      setCategories(catMap);
    } catch {
      toast.error('Failed to load inventory data');
    } finally {
      setIsLoading(false);
    }
  }, [selectedOrg]);

  useEffect(() => { loadData(); }, [loadData]);

  const orgOptions = orgs.map(o => ({ value: o.id, label: o.name }));

  const filtered = items.filter(item => {
    const isArchived = item.is_archived === true;
    if (!showArchived && isArchived) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    const catName = categories.get(item.category_id) || '';
    return (item.name || '').toLowerCase().includes(q)
      || (item.sku || '').toLowerCase().includes(q)
      || (item.barcode || '').toLowerCase().includes(q)
      || catName.toLowerCase().includes(q);
  });

  const getStockStatus = (item: any) => {
    const qty = item.current_quantity ?? item.quantity ?? 0;
    const threshold = item.low_stock_threshold ?? item.reorder_point ?? 0;
    if (qty === 0) return { label: 'Out of Stock', color: 'bg-error-500/10 text-error-600 dark:text-error-400', dot: 'bg-error-500' };
    if (qty <= threshold) return { label: 'Low Stock', color: 'bg-warning-500/10 text-warning-600 dark:text-warning-400', dot: 'bg-warning-500' };
    return { label: 'In Stock', color: 'bg-success-500/10 text-success-600 dark:text-success-400', dot: 'bg-success-500' };
  };

  const archivedCount = items.filter(i => i.is_archived === true).length;
  const activeCount = items.filter(i => i.is_archived !== true).length;
  const totalValue = items
    .filter(i => i.is_archived !== true)
    .reduce((sum, i) => sum + (i.total_value || (i.current_quantity || 0) * (i.average_unit_cost || 0)), 0);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-orange-500/40 via-orange-400/25 to-teal-600/20 p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/15 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-500/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/4" />
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Inventory Explorer</h1>
        <p className="mt-2 text-muted-foreground">Browse inventory items across any organization.</p>
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
          <button onClick={loadData} className="btn-secondary flex items-center gap-2 px-4 py-2.5 text-sm">
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Stats row */}
      {selectedOrg && !isLoading && items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Active Items', value: activeCount, color: 'text-foreground' },
            { label: 'Archived', value: archivedCount, color: 'text-muted-foreground' },
            { label: 'Total Items', value: items.length, color: 'text-foreground' },
            { label: 'Total Value', value: formatCurrency(totalValue), color: 'text-orange-600 dark:text-orange-400 font-bold' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl bg-card border border-orange-500/20 p-4 shadow-sm"
            >
              <p className="text-xs font-medium text-muted-foreground mb-1">{stat.label}</p>
              <p className={`text-lg font-bold tabular-nums ${stat.color}`}>{stat.value}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Search + Archive toggle */}
      {selectedOrg && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <SearchInput value={search} onChange={setSearch} placeholder="Search items by name, SKU, barcode, or category..." />
          </div>
          {archivedCount > 0 && (
            <button
              onClick={() => setShowArchived(!showArchived)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                showArchived
                  ? 'bg-primary/10 text-primary border border-primary/30'
                  : 'btn-secondary'
              }`}
            >
              <Archive className="w-4 h-4" />
              {showArchived ? 'Hide' : 'Show'} Archived ({archivedCount})
            </button>
          )}
        </div>
      )}

      {/* Empty states */}
      {!selectedOrg && (
        <EmptyState icon={Package} title="Select an organization" description="Choose an organization to browse its inventory." />
      )}

      {selectedOrg && isLoading && (
        <div className="flex justify-center py-12"><LoadingSpinner size="lg" text="Loading items..." /></div>
      )}

      {selectedOrg && !isLoading && filtered.length === 0 && (
        <EmptyState
          icon={Package}
          title={search ? 'No items found' : showArchived ? 'No archived items' : 'No active items'}
          description={search ? 'Try a different search term.' : showArchived ? 'This organization has no archived items.' : 'This organization has no inventory items.'}
        />
      )}

      {/* Items Table */}
      {selectedOrg && !isLoading && filtered.length > 0 && (
        <div className="card-theme rounded-[2.5rem] overflow-hidden border border-border/50 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary/30 border-b border-border/40">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Product</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category</th>
                  <th className="text-center px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Stock</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cost</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Selling</th>
                  <th className="text-center px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filtered.slice(0, 100).map((item, i) => {
                  const status = getStockStatus(item);
                  const qty = item.current_quantity ?? item.quantity ?? 0;
                  const isArchived = item.is_archived === true;
                  const catName = categories.get(item.category_id) || item.category?.name || '-';
                  return (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className={`hover:bg-secondary/20 transition-colors ${isArchived ? 'opacity-60' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="font-semibold text-foreground">{item.name || '-'}</p>
                            <p className="text-xs text-muted-foreground font-mono uppercase mt-0.5">
                              {item.sku || item.barcode || 'N/A'}
                            </p>
                          </div>
                          {isArchived && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground">
                              <Archive className="w-2.5 h-2.5" />
                              Archived
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-secondary/30 border border-border/50 text-foreground">
                          <Tag className="w-3 h-3 text-muted-foreground" />
                          {catName}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`font-bold tabular-nums ${qty === 0 ? 'text-error-500' : qty <= (item.low_stock_threshold ?? 0) ? 'text-warning-500' : 'text-foreground'}`}>
                          {qty}
                        </span>
                        <span className="text-xs text-muted-foreground ml-1">{item.unit || 'pcs'}</span>
                      </td>
                      <td className="px-6 py-4 text-right text-muted-foreground font-mono tabular-nums">
                        {formatCurrency(item.average_unit_cost || item.purchase_rate || 0)}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-foreground font-mono tabular-nums">
                        {formatCurrency(item.selling_price || item.base_price || item.sale_rate || 0)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {isArchived ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-muted/50 text-muted-foreground border border-border/50">
                            Deleted
                          </span>
                        ) : (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${status.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                            {status.label}
                          </span>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length > 100 && (
            <div className="px-6 py-3 text-xs text-muted-foreground text-center border-t border-border/30 bg-secondary/10">
              Showing 100 of {filtered.length} items
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
