import { useState } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, Play, CheckCircle, Package, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { getItems, adjustItemStock } from '../../lib/api/items';
import { useAuthStore } from '../../lib/store';
import { Item } from '../../lib/types';
import { formatCurrency } from '../../lib/utils/notifications';

interface CountRow {
  item: Item;
  physicalCount: string;
}

function StatCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm">
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color || 'text-foreground'}`}>{value}</p>
    </div>
  );
}

export default function InventoryCount() {
  const { user } = useAuthStore();
  const [rows, setRows] = useState<CountRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [started, setStarted] = useState(false);

  const handleStartCount = async () => {
    setIsLoading(true);
    try {
      const result = await getItems();
      setRows(result.items.map((item: Item) => ({ item, physicalCount: '' })));
      setStarted(true);
    } catch (err) {
      toast.error('Failed to load items');
    } finally {
      setIsLoading(false);
    }
  };

  const updatePhysical = (itemId: string, value: string) => {
    setRows(prev => prev.map(r => r.item.id === itemId ? { ...r, physicalCount: value } : r));
  };

  const getVariance = (row: CountRow): number | null => {
    const physical = parseFloat(row.physicalCount);
    if (isNaN(physical)) return null;
    return physical - (row.item.current_quantity ?? 0);
  };

  const rowsWithVariance = rows.filter(r => {
    const v = getVariance(r);
    return v !== null && v !== 0;
  });

  const totalVarianceValue = rowsWithVariance.reduce((sum, r) => {
    const v = getVariance(r) ?? 0;
    const cost = r.item.average_unit_cost || r.item.purchase_rate || 0;
    return sum + Math.abs(v) * cost;
  }, 0);

  const handleApplyAll = async () => {
    if (!user) { toast.error('Not authenticated'); return; }
    if (rowsWithVariance.length === 0) {
      toast.success('No variances to correct');
      return;
    }

    setIsApplying(true);
    let successCount = 0;
    let failCount = 0;

    for (const row of rowsWithVariance) {
      const variance = getVariance(row);
      if (variance === null || variance === 0) continue;
      try {
        await adjustItemStock(
          row.item.id,
          variance,
          'Physical inventory count',
          'count_correction',
          user.uid
        );
        successCount++;
      } catch (err) {
        console.error(`Failed to adjust ${row.item.name}:`, err);
        failCount++;
      }
    }

    if (failCount === 0) {
      toast.success(`Applied ${successCount} correction${successCount !== 1 ? 's' : ''} successfully`);
    } else {
      toast.error(`${successCount} succeeded, ${failCount} failed`);
    }

    // Refresh
    await handleStartCount();
    setIsApplying(false);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      >
        <div>
          <h1 className="app-page-title flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-primary" />
            Inventory Count
          </h1>
          <p className="app-page-subtitle">Compare physical count vs system count</p>
        </div>
        {!started && (
          <button
            onClick={handleStartCount}
            disabled={isLoading}
            className="btn-primary flex items-center gap-2 self-start sm:self-auto"
          >
            <Play className="w-4 h-4" />
            {isLoading ? 'Loading...' : 'Start Count'}
          </button>
        )}
      </motion.div>

      {/* Not started */}
      {!started && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20 bg-card rounded-2xl border border-border/60 shadow-sm"
        >
          <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-foreground font-semibold text-lg">Ready to count?</p>
          <p className="text-muted-foreground text-sm mt-1 max-w-sm mx-auto">
            Click "Start Count" to load all inventory items and enter physical quantities.
          </p>
        </motion.div>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card rounded-2xl border border-border/60 p-4 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="h-4 w-40 bg-secondary rounded" />
                <div className="h-4 w-16 bg-secondary rounded ml-auto" />
                <div className="h-8 w-24 bg-secondary rounded-xl" />
                <div className="h-4 w-16 bg-secondary rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Count table */}
      {started && !isLoading && (
        <>
          {/* Summary stats */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            <StatCard label="Total Items" value={rows.length} />
            <StatCard
              label="Items with Variance"
              value={rowsWithVariance.length}
              color={rowsWithVariance.length > 0 ? 'text-orange-500' : 'text-green-500'}
            />
            <StatCard
              label="Total Variance Value"
              value={formatCurrency(totalVarianceValue)}
              color={totalVarianceValue > 0 ? 'text-orange-500' : 'text-foreground'}
            />
          </motion.div>

          {/* Table */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-secondary/50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Item</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">System Qty</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Physical Count</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Variance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {rows.map((row, index) => {
                    const variance = getVariance(row);
                    const hasVariance = variance !== null && variance !== 0;
                    return (
                      <motion.tr
                        key={row.item.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.02 }}
                        className="hover:bg-secondary/30 transition-colors"
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <div>
                              <p className="font-medium text-foreground">{row.item.name}</p>
                              {row.item.sku && (
                                <p className="text-xs text-muted-foreground">{row.item.sku}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-right font-mono text-foreground">
                          {row.item.current_quantity ?? 0}
                          <span className="text-xs text-muted-foreground ml-1">{row.item.unit || 'pcs'}</span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <input
                            type="number"
                            min="0"
                            placeholder="Enter count"
                            value={row.physicalCount}
                            onChange={e => updatePhysical(row.item.id, e.target.value)}
                            className="w-28 px-3 py-1.5 bg-secondary border border-border/60 rounded-lg text-sm text-right text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                          />
                        </td>
                        <td className="px-5 py-3 text-right">
                          {variance === null ? (
                            <span className="text-muted-foreground text-xs">—</span>
                          ) : variance === 0 ? (
                            <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium">
                              <CheckCircle className="w-3.5 h-3.5" /> OK
                            </span>
                          ) : (
                            <span className={`inline-flex items-center gap-1 text-xs font-semibold ${
                              variance < 0 ? 'text-red-500' : 'text-orange-500'
                            }`}>
                              <AlertTriangle className="w-3.5 h-3.5" />
                              {variance > 0 ? '+' : ''}{variance}
                            </span>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Apply button */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex justify-end"
          >
            <button
              onClick={handleApplyAll}
              disabled={isApplying || rowsWithVariance.length === 0}
              className="btn-primary flex items-center gap-2 disabled:opacity-60"
            >
              <CheckCircle className="w-4 h-4" />
              {isApplying
                ? 'Applying...'
                : `Apply All Corrections (${rowsWithVariance.length})`}
            </button>
          </motion.div>
        </>
      )}
    </div>
  );
}
