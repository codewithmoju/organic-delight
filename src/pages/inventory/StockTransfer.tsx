import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeftRight, Search, Package, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { getItems, adjustItemStock } from '../../lib/api/items';
import { useAuthStore } from '../../lib/store';
import { Item } from '../../lib/types';
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface TransferForm {
  fromLocation: string;
  toLocation: string;
  itemId: string;
  quantity: string;
  notes: string;
}

interface TransferRecord {
  id: string;
  item_id: string;
  notes: string;
  quantity: number;
  transaction_date: Date;
  supplier_customer: string;
}

const DEFAULT_FORM: TransferForm = {
  fromLocation: '',
  toLocation: '',
  itemId: '',
  quantity: '',
  notes: '',
};

export default function StockTransfer() {
  const { user } = useAuthStore();
  const [items, setItems] = useState<Item[]>([]);
  const [form, setForm] = useState<TransferForm>(DEFAULT_FORM);
  const [itemSearch, setItemSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transfers, setTransfers] = useState<TransferRecord[]>([]);
  const [isLoadingTransfers, setIsLoadingTransfers] = useState(true);

  useEffect(() => {
    const loadItems = async () => {
      try {
        const result = await getItems();
        setItems(result.items);
      } catch (err) {
        console.error(err);
      }
    };
    loadItems();
    loadTransferHistory();
  }, []);

  const loadTransferHistory = async () => {
    setIsLoadingTransfers(true);
    try {
      const q = query(
        collection(db, 'transactions'),
        orderBy('created_at', 'desc'),
        limit(50)
      );
      const snap = await getDocs(q);
      const all = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        transaction_date: d.data().transaction_date?.toDate?.() || new Date(),
      })) as TransferRecord[];
      // Filter to only transfer transactions
      setTransfers(all.filter(t => t.notes?.includes('Transfer')));
    } catch (err) {
      console.error('Failed to load transfer history:', err);
    } finally {
      setIsLoadingTransfers(false);
    }
  };

  const filteredItems = useMemo(() =>
    items.filter(i =>
      i.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
      (i.sku || '').toLowerCase().includes(itemSearch.toLowerCase())
    ),
    [items, itemSearch]
  );

  const selectedItem = items.find(i => i.id === form.itemId);

  const handleSelectItem = (item: Item) => {
    setForm(prev => ({ ...prev, itemId: item.id }));
    setItemSearch(item.name);
    setShowDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error('Not authenticated'); return; }
    if (!form.fromLocation.trim()) { toast.error('From Location is required'); return; }
    if (!form.toLocation.trim()) { toast.error('To Location is required'); return; }
    if (!form.itemId) { toast.error('Please select an item'); return; }
    const qty = parseFloat(form.quantity);
    if (isNaN(qty) || qty <= 0) { toast.error('Enter a valid positive quantity'); return; }

    const currentStock = selectedItem?.current_quantity ?? 0;
    if (qty > currentStock) {
      toast.error(`Insufficient stock. Available: ${currentStock}`);
      return;
    }

    setIsSubmitting(true);
    try {
      // Deduct from source
      await adjustItemStock(
        form.itemId,
        -qty,
        `Transfer to ${form.toLocation}`,
        'adjustment',
        user.uid
      );
      // Add to destination (same item, positive adjustment)
      await adjustItemStock(
        form.itemId,
        qty,
        `Transfer from ${form.fromLocation}`,
        'adjustment',
        user.uid
      );

      toast.success(`Transferred ${qty} units from ${form.fromLocation} to ${form.toLocation}`);
      setForm(DEFAULT_FORM);
      setItemSearch('');
      await loadTransferHistory();
    } catch (err: any) {
      toast.error(err.message || 'Transfer failed');
    } finally {
      setIsSubmitting(false);
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
            <ArrowLeftRight className="w-6 h-6 text-primary" />
            Stock Transfer
          </h1>
          <p className="app-page-subtitle">Move stock between locations</p>
        </div>
      </motion.div>

      {/* Transfer Form */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm"
      >
        <h2 className="text-sm font-semibold text-foreground mb-4">New Transfer</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* From Location */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                From Location <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Warehouse A"
                value={form.fromLocation}
                onChange={e => setForm(prev => ({ ...prev, fromLocation: e.target.value }))}
                className="w-full px-3 py-2 bg-secondary border border-border/60 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {/* To Location */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                To Location <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Store Front"
                value={form.toLocation}
                onChange={e => setForm(prev => ({ ...prev, toLocation: e.target.value }))}
                className="w-full px-3 py-2 bg-secondary border border-border/60 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Item selector */}
            <div className="relative">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Item <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search item..."
                  value={itemSearch}
                  onChange={e => {
                    setItemSearch(e.target.value);
                    setShowDropdown(true);
                    if (!e.target.value) setForm(prev => ({ ...prev, itemId: '' }));
                  }}
                  onFocus={() => setShowDropdown(true)}
                  className="w-full pl-9 pr-4 py-2 bg-secondary border border-border/60 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              {showDropdown && itemSearch && filteredItems.length > 0 && (
                <div className="absolute z-20 top-full mt-1 w-full bg-card border border-border/60 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {filteredItems.slice(0, 10).map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectItem(item)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-secondary transition-colors text-left"
                    >
                      <Package className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Stock: {item.current_quantity ?? 0} {item.unit || 'pcs'}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Quantity <span className="text-red-500">*</span>
                {selectedItem && (
                  <span className="ml-2 font-normal text-muted-foreground">
                    (Available: {selectedItem.current_quantity ?? 0})
                  </span>
                )}
              </label>
              <input
                type="number"
                min="1"
                placeholder="e.g. 50"
                value={form.quantity}
                onChange={e => setForm(prev => ({ ...prev, quantity: e.target.value }))}
                className="w-full px-3 py-2 bg-secondary border border-border/60 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Notes</label>
            <input
              type="text"
              placeholder="Optional notes..."
              value={form.notes}
              onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 py-2 bg-secondary border border-border/60 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary flex items-center gap-2 disabled:opacity-60"
            >
              <ArrowLeftRight className="w-4 h-4" />
              {isSubmitting ? 'Transferring...' : 'Transfer Stock'}
            </button>
          </div>
        </form>
      </motion.div>

      {/* Transfer History */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm"
      >
        <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          Recent Transfers
        </h2>

        {isLoadingTransfers ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 bg-secondary rounded-xl animate-pulse" />
            ))}
          </div>
        ) : transfers.length === 0 ? (
          <div className="text-center py-10">
            <ArrowLeftRight className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No transfers recorded yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transfers.map((transfer, index) => {
              const isOut = transfer.notes?.includes('Transfer to');
              return (
                <motion.div
                  key={transfer.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isOut ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-green-100 dark:bg-green-900/30'
                  }`}>
                    <ArrowLeftRight className={`w-4 h-4 ${isOut ? 'text-orange-500' : 'text-green-600'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{transfer.notes}</p>
                    <p className="text-xs text-muted-foreground">
                      {transfer.transaction_date.toLocaleDateString('en-PK', {
                        year: 'numeric', month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <span className={`text-sm font-semibold flex-shrink-0 ${
                    isOut ? 'text-orange-500' : 'text-green-600'
                  }`}>
                    {isOut ? '-' : '+'}{transfer.quantity}
                  </span>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
