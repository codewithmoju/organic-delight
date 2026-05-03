import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
  Clock, DollarSign, LogIn, LogOut, RefreshCw,
  CheckCircle2, AlertCircle, Wallet, TrendingUp, X
} from 'lucide-react';
import { formatCurrency } from '../../lib/utils/notifications';
import { useAuthStore } from '../../lib/store';
import { toast } from 'sonner';
import { getScopedStorageKey } from '../../lib/utils/storageScope';

// ── Types ─────────────────────────────────────────────────────────────────────
export interface Shift {
  id: string;
  cashier_id: string;
  cashier_name: string;
  opened_at: Date;
  closed_at?: Date;
  opening_float: number;       // Cash in drawer at start
  closing_cash?: number;       // Actual cash counted at end
  expected_cash?: number;      // Calculated: float + cash sales - cash expenses
  cash_variance?: number;      // closing_cash - expected_cash
  total_sales: number;
  total_transactions: number;
  total_returns: number;
  total_discounts: number;
  status: 'open' | 'closed';
  notes?: string;
}

const SHIFT_STORAGE_KEY = 'pos_current_shift';
const SHIFT_HISTORY_KEY = 'pos_shift_history';

function loadCurrentShift(userId?: string | null): Shift | null {
  try {
    const raw = localStorage.getItem(getScopedStorageKey(SHIFT_STORAGE_KEY, userId || undefined));
    if (!raw) return null;
    const shift = JSON.parse(raw);
    shift.opened_at = new Date(shift.opened_at);
    if (shift.closed_at) shift.closed_at = new Date(shift.closed_at);
    return shift;
  } catch {
    return null;
  }
}

function saveShift(shift: Shift | null, userId?: string | null) {
  const key = getScopedStorageKey(SHIFT_STORAGE_KEY, userId || undefined);
  if (shift) {
    localStorage.setItem(key, JSON.stringify(shift));
  } else {
    localStorage.removeItem(key);
  }
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useShift() {
  const userId = useAuthStore((state) => state.user?.uid || state.profile?.id || null);
  const [currentShift, setCurrentShift] = useState<Shift | null>(() => loadCurrentShift(userId));

  useEffect(() => {
    setCurrentShift(loadCurrentShift(userId));
  }, [userId]);

  const openShift = (openingFloat: number, cashierName: string, cashierId: string) => {
    const shift: Shift = {
      id: `SHIFT-${Date.now()}`,
      cashier_id: cashierId,
      cashier_name: cashierName,
      opened_at: new Date(),
      opening_float: openingFloat,
      total_sales: 0,
      total_transactions: 0,
      total_returns: 0,
      total_discounts: 0,
      status: 'open',
    };
    setCurrentShift(shift);
    saveShift(shift, userId);
    return shift;
  };

  const updateShiftTotals = (sale: number, discount: number = 0, isReturn = false) => {
    setCurrentShift(prev => {
      if (!prev || prev.status !== 'open') return prev;
      const updated: Shift = {
        ...prev,
        total_sales: prev.total_sales + (isReturn ? 0 : sale),
        total_transactions: prev.total_transactions + 1,
        total_returns: prev.total_returns + (isReturn ? sale : 0),
        total_discounts: prev.total_discounts + discount,
      };
      saveShift(updated, userId);
      return updated;
    });
  };

  const closeShift = (closingCash: number, notes?: string) => {
    setCurrentShift(prev => {
      if (!prev) return null;
      const expectedCash = prev.opening_float + prev.total_sales - prev.total_returns;
      const updated: Shift = {
        ...prev,
        closed_at: new Date(),
        closing_cash: closingCash,
        expected_cash: expectedCash,
        cash_variance: closingCash - expectedCash,
        status: 'closed',
        notes,
      };
      saveShift(null, userId); // Clear active shift
      // Optionally persist to history
      try {
        const historyKey = getScopedStorageKey(SHIFT_HISTORY_KEY, userId || undefined);
        const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
        history.unshift(updated);
        localStorage.setItem(historyKey, JSON.stringify(history.slice(0, 30)));
      } catch { /* ignore */ }
      return null;
    });
  };

  return { currentShift, openShift, updateShiftTotals, closeShift };
}

// ── Open Shift Modal ──────────────────────────────────────────────────────────
interface OpenShiftModalProps {
  onOpen: (float: number) => void;
  onDismiss: () => void;
}

export function OpenShiftModal({ onOpen, onDismiss }: OpenShiftModalProps) {
  const [float, setFloat] = useState('');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-sm bg-card rounded-2xl border border-border/60 shadow-2xl p-6"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-success-500/10 text-success-500">
            <LogIn className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">Open Shift</h2>
            <p className="text-xs text-muted-foreground">Enter the opening cash float</p>
          </div>
        </div>

        <div className="mb-5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
            Opening Float (Cash in Drawer)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">
              PKR
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              autoFocus
              value={float}
              onChange={e => setFloat(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && onOpen(parseFloat(float) || 0)}
              className="w-full h-12 pl-12 pr-4 bg-secondary/50 border border-border/60 rounded-xl text-lg font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all tabular-nums"
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onDismiss}
            className="flex-1 py-2.5 rounded-xl border border-border/60 text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors"
          >
            Skip
          </button>
          <button
            onClick={() => onOpen(parseFloat(float) || 0)}
            className="flex-1 py-2.5 rounded-xl bg-success-600 hover:bg-success-700 text-white font-bold text-sm shadow-lg shadow-success-600/20 transition-all flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            Open Shift
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Close Shift Modal ─────────────────────────────────────────────────────────
interface CloseShiftModalProps {
  shift: Shift;
  onClose: (closingCash: number, notes?: string) => void;
  onCancel: () => void;
}

export function CloseShiftModal({ shift, onClose, onCancel }: CloseShiftModalProps) {
  const [closingCash, setClosingCash] = useState('');
  const [notes, setNotes] = useState('');

  const expectedCash = shift.opening_float + shift.total_sales - shift.total_returns;
  const entered = parseFloat(closingCash) || 0;
  const variance = entered - expectedCash;
  const duration = Math.round((Date.now() - shift.opened_at.getTime()) / 60000);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-md bg-card rounded-2xl border border-border/60 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-error-500/10 text-error-500">
              <LogOut className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Close Shift</h2>
              <p className="text-xs text-muted-foreground">
                Opened {format(shift.opened_at, 'h:mm a')} · {duration}m ago
              </p>
            </div>
          </div>
          <button onClick={onCancel} className="p-2 rounded-xl hover:bg-secondary text-muted-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Shift summary */}
          <div className="bg-secondary/30 rounded-2xl p-4 grid grid-cols-2 gap-3">
            {[
              { label: 'Opening Float', value: formatCurrency(shift.opening_float), icon: Wallet },
              { label: 'Total Sales', value: formatCurrency(shift.total_sales), icon: TrendingUp },
              { label: 'Transactions', value: shift.total_transactions.toString(), icon: CheckCircle2 },
              { label: 'Expected Cash', value: formatCurrency(expectedCash), icon: DollarSign },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-center gap-2">
                <Icon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-sm font-bold text-foreground tabular-nums">{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Closing cash count */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Actual Cash in Drawer *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">
                PKR
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                autoFocus
                value={closingCash}
                onChange={e => setClosingCash(e.target.value)}
                className="w-full h-12 pl-12 pr-4 bg-secondary/50 border border-border/60 rounded-xl text-lg font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all tabular-nums"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Variance indicator */}
          {closingCash !== '' && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-center justify-between px-4 py-3 rounded-xl border ${
                Math.abs(variance) < 1
                  ? 'bg-success-500/10 border-success-500/20 text-success-500'
                  : variance > 0
                  ? 'bg-warning-500/10 border-warning-500/20 text-warning-500'
                  : 'bg-error-500/10 border-error-500/20 text-error-500'
              }`}
            >
              <span className="text-sm font-semibold flex items-center gap-1.5">
                {Math.abs(variance) < 1 ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                Cash Variance
              </span>
              <span className="text-sm font-bold tabular-nums">
                {variance >= 0 ? '+' : ''}{formatCurrency(variance)}
              </span>
            </motion.div>
          )}

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full bg-secondary/50 border border-border/60 rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all resize-none placeholder:text-muted-foreground/50"
              placeholder="Any notes about this shift..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 pb-5">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-border/60 text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onClose(parseFloat(closingCash) || 0, notes || undefined)}
            disabled={!closingCash}
            className="flex-1 py-2.5 rounded-xl bg-error-600 hover:bg-error-700 text-white font-bold text-sm shadow-lg shadow-error-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Close Shift
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Shift Status Bar ──────────────────────────────────────────────────────────
interface ShiftStatusBarProps {
  shift: Shift | null;
  onOpenShift: () => void;
  onCloseShift: () => void;
}

export function ShiftStatusBar({ shift, onOpenShift, onCloseShift }: ShiftStatusBarProps) {
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    if (!shift) return;
    const tick = () => {
      const mins = Math.floor((Date.now() - shift.opened_at.getTime()) / 60000);
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      setElapsed(h > 0 ? `${h}h ${m}m` : `${m}m`);
    };
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [shift]);

  if (!shift) {
    return (
      <button
        onClick={onOpenShift}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-success-500/10 border border-success-500/20 text-success-600 dark:text-success-400 hover:bg-success-500/20 transition-colors text-xs font-semibold"
      >
        <LogIn className="w-3.5 h-3.5" />
        Open Shift
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-success-500/10 border border-success-500/20 text-success-600 dark:text-success-400 text-xs font-semibold">
        <Clock className="w-3.5 h-3.5" />
        <span>{elapsed}</span>
        <span className="text-success-400/60">·</span>
        <span>{formatCurrency(shift.total_sales)}</span>
      </div>
      <button
        onClick={onCloseShift}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-error-500/10 border border-error-500/20 text-error-600 dark:text-error-400 hover:bg-error-500/20 transition-colors text-xs font-semibold"
      >
        <LogOut className="w-3.5 h-3.5" />
        Close
      </button>
    </div>
  );
}
