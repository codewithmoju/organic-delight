import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, Search, ChevronDown, ChevronUp, Package } from 'lucide-react';
import { toast } from 'sonner';
import { getItems } from '../../lib/api/items';
import { adjustItemStock } from '../../lib/api/items';
import { useAuthStore } from '../../lib/store';
import { Item } from '../../lib/types';

const ADJUSTMENT_TYPES = [
  { value: 'adjustment', label: 'Adjustment' },
  { value: 'write_off', label: 'Write-off' },
  { value: 'count_correction', label: 'Count Correction' },
] as const;

type AdjustmentType = 'adjustment' | 'write_off' | 'count_correction';

interface AdjustmentForm {
  type: AdjustmentType;
  quantity: string;
  reason: string;
}

function SkeletonRow() {
  return (
    <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-4 w-40 bg-secondary rounded" />
          <div className="h-3 w-24 bg-secondary rounded" />
        </div>
        <div className="h-8 w-20 bg-secondary rounded-xl" />
      </div>
    </div>
  );
}

export default function StockAdjustments() {
  const { user } = useAuthStore();
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [forms, setForms] = useState<Record<string, AdjustmentForm>>({});

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const result = await getItems();
      setItems(result.items);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load items');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const filtered = items.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    (item.sku || '').toLowerCase().includes(search.toLowerCase())
  );

  const getForm = (itemId: string): AdjustmentForm =>
    forms[itemId] ?? { type: 'adjustment', quantity: '', reason: '' };

  const updateForm = (itemId: string, patch: Partial<AdjustmentForm>) => {
    setForms(prev => ({ ...prev, [itemId]: { ...getForm(itemId), ...patch } }));
  };

  const handleToggle = (itemId: string) => {
    setExpandedItemId(prev => (prev === itemId ? null : itemId));
  };

  const handleSubmit = async (item: Item) => {
    const form = getForm(item.id);
    const qty = parseFloat(form.quantity);

    if (!form.reason.trim()) {
      toast.error('Reason is required');
      return;
    }
    if (isNaN(qty) || qty === 0) {
      toast.error('Enter a non-zero quantity');
      return;
    }
    if (!user) {
      toast.error('Not authenticated');
      return;
    }

    setSubmitting(true);
    try {
      await adjustItemStock(item.id, qty, form.reason.trim(), form.type, user.uid);
      toast.success(`Stock adjusted for ${item.name}`);
      setExpandedItemId(null);
      setForms(prev => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
      await fetchItems();
    } catch (err: any) {
      toast.error(err.message || 'Failed to adjust stock');
    } finally {
      setSubmitting(false);
    }
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
            <SlidersHorizontal className="w-6 h-6 text-primary" />
            Stock Adjustments
          </h1>
          <p className="app-page-subtitle">Adjust, write-off, or correct inventory quantities</p>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="relative"
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search items by name or SKU..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-card border border-border/60 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </motion.div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16 bg-card rounded-2xl border border-border/60 shadow-sm"
        >
          <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-foreground font-medium">No items found</p>
          <p className="text-muted-foreground text-sm mt-1">
            {search ? 'Try a different search term' : 'Add items to your inventory first'}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item, index) => {
            const isExpanded = expandedItemId === item.id;
            const form = getForm(item.id);
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden"
              >
                {/* Item row */}
                <button
                  onClick={() => handleToggle(item.id)}
                  className="w-full flex items-center justify-between p-5 hover:bg-secondary/40 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Package className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.sku ? `SKU: ${item.sku} · ` : ''}
                        Stock: <span className="font-medium text-foreground">{item.current_quantity ?? 0} {item.unit || 'pcs'}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-secondary text-muted-foreground">
                      Adjust
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {/* Inline form */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 pt-0 border-t border-border/60 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                          {/* Type */}
                          <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                              Adjustment Type
                            </label>
                            <select
                              value={form.type}
                              onChange={e => updateForm(item.id, { type: e.target.value as AdjustmentType })}
                              className="w-full px-3 py-2 bg-secondary border border-border/60 rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                            >
                              {ADJUSTMENT_TYPES.map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                              ))}
                            </select>
                          </div>

                          {/* Quantity */}
                          <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                              Quantity <span className="text-muted-foreground font-normal">(+ add / − remove)</span>
                            </label>
                            <input
                              type="number"
                              placeholder="e.g. -5 or 10"
                              value={form.quantity}
                              onChange={e => updateForm(item.id, { quantity: e.target.value })}
                              className="w-full px-3 py-2 bg-secondary border border-border/60 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                          </div>

                          {/* Reason */}
                          <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                              Reason <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Damaged goods"
                              value={form.reason}
                              onChange={e => updateForm(item.id, { reason: e.target.value })}
                              className="w-full px-3 py-2 bg-secondary border border-border/60 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => setExpandedItemId(null)}
                            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSubmit(item)}
                            disabled={submitting}
                            className="btn-primary px-5 py-2 text-sm disabled:opacity-60"
                          >
                            {submitting ? 'Saving...' : 'Apply Adjustment'}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
