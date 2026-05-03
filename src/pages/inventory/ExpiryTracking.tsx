import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { CalendarClock, Download, Package } from 'lucide-react';
import { toast } from 'sonner';
import { getPurchases } from '../../lib/api/purchases';
import { exportToCSV } from '../../lib/utils/csvExport';
import { Purchase, PurchaseItem } from '../../lib/types';

type FilterTab = 'all' | 'expired' | 'expiring_soon' | 'ok';

interface ExpiryRow {
  itemName: string;
  batchLot: string;
  expiryDate: Date;
  daysUntilExpiry: number;
  status: 'expired' | 'critical' | 'warning' | 'ok';
  purchaseNumber: string;
}

function getDaysUntilExpiry(date: Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const exp = new Date(date);
  exp.setHours(0, 0, 0, 0);
  return Math.round((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function getStatus(days: number): ExpiryRow['status'] {
  if (days < 0) return 'expired';
  if (days < 7) return 'critical';
  if (days < 30) return 'warning';
  return 'ok';
}

function StatusBadge({ status, days }: { status: ExpiryRow['status']; days: number }) {
  const configs = {
    expired: { label: 'Expired', cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    critical: { label: '< 7 days', cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    warning: { label: '< 30 days', cls: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
    ok: { label: 'OK', cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  };
  const { label, cls } = configs[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'expired', label: 'Expired' },
  { key: 'expiring_soon', label: 'Expiring Soon' },
  { key: 'ok', label: 'OK' },
];

export default function ExpiryTracking() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const data = await getPurchases();
        setPurchases(data);
      } catch (err) {
        toast.error('Failed to load purchase data');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const allRows = useMemo<ExpiryRow[]>(() => {
    const rows: ExpiryRow[] = [];
    for (const purchase of purchases) {
      for (const item of purchase.items) {
        if (!item.expiry_date) continue;
        const expiryDate = item.expiry_date instanceof Date
          ? item.expiry_date
          : new Date(item.expiry_date as any);
        if (isNaN(expiryDate.getTime())) continue;
        const days = getDaysUntilExpiry(expiryDate);
        rows.push({
          itemName: item.item_name,
          batchLot: (item as PurchaseItem & { batch_number?: string; lot_number?: string }).batch_number
            || (item as PurchaseItem & { batch_number?: string; lot_number?: string }).lot_number
            || '—',
          expiryDate,
          daysUntilExpiry: days,
          status: getStatus(days),
          purchaseNumber: purchase.purchase_number,
        });
      }
    }
    // Sort by expiry date ascending (soonest first)
    return rows.sort((a, b) => a.expiryDate.getTime() - b.expiryDate.getTime());
  }, [purchases]);

  const filtered = useMemo(() => {
    switch (activeTab) {
      case 'expired': return allRows.filter(r => r.status === 'expired');
      case 'expiring_soon': return allRows.filter(r => r.status === 'critical' || r.status === 'warning');
      case 'ok': return allRows.filter(r => r.status === 'ok');
      default: return allRows;
    }
  }, [allRows, activeTab]);

  const handleExport = () => {
    if (filtered.length === 0) { toast.error('No data to export'); return; }
    exportToCSV(
      filtered.map(r => ({
        'Item Name': r.itemName,
        'Batch/Lot': r.batchLot,
        'Expiry Date': r.expiryDate.toLocaleDateString(),
        'Days Until Expiry': r.daysUntilExpiry,
        'Status': r.status,
        'Purchase #': r.purchaseNumber,
      })),
      `expiry-tracking-${new Date().toISOString().slice(0, 10)}`
    );
    toast.success('Exported successfully');
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
            <CalendarClock className="w-6 h-6 text-primary" />
            Expiry Tracking
          </h1>
          <p className="app-page-subtitle">Monitor batch expiry dates across your inventory</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-card border border-border/60 rounded-xl text-sm font-medium text-foreground hover:bg-secondary transition-colors self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </motion.div>

      {/* Filter tabs */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex gap-1 bg-secondary rounded-xl p-1 w-fit"
      >
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
            {tab.key !== 'all' && (
              <span className="ml-1.5 text-xs opacity-70">
                ({tab.key === 'expired'
                  ? allRows.filter(r => r.status === 'expired').length
                  : tab.key === 'expiring_soon'
                  ? allRows.filter(r => r.status === 'critical' || r.status === 'warning').length
                  : allRows.filter(r => r.status === 'ok').length})
              </span>
            )}
          </button>
        ))}
      </motion.div>

      {/* Table */}
      {isLoading ? (
        <div className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden animate-pulse">
          <div className="p-5 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 bg-secondary rounded-xl" />
            ))}
          </div>
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
            {activeTab === 'all'
              ? 'No purchase items have expiry dates recorded'
              : `No items in the "${TABS.find(t => t.key === activeTab)?.label}" category`}
          </p>
        </motion.div>
      ) : (
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
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Item Name</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Batch/Lot</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Expiry Date</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Days Until Expiry</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filtered.map((row, index) => (
                  <motion.tr
                    key={`${row.purchaseNumber}-${row.itemName}-${index}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-secondary/30 transition-colors"
                  >
                    <td className="px-5 py-3 font-medium text-foreground">{row.itemName}</td>
                    <td className="px-5 py-3 text-muted-foreground font-mono text-xs">{row.batchLot}</td>
                    <td className="px-5 py-3 text-foreground">
                      {row.expiryDate.toLocaleDateString('en-PK', {
                        year: 'numeric', month: 'short', day: 'numeric'
                      })}
                    </td>
                    <td className="px-5 py-3 text-right font-mono">
                      <span className={
                        row.daysUntilExpiry < 0 ? 'text-red-500' :
                        row.daysUntilExpiry < 7 ? 'text-red-500' :
                        row.daysUntilExpiry < 30 ? 'text-orange-500' :
                        'text-green-600'
                      }>
                        {row.daysUntilExpiry < 0
                          ? `${Math.abs(row.daysUntilExpiry)}d ago`
                          : `${row.daysUntilExpiry}d`}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <StatusBadge status={row.status} days={row.daysUntilExpiry} />
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}
