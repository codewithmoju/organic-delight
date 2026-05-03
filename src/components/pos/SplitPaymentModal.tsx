import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Banknote, CreditCard, Smartphone, Plus, Trash2,
  CheckCircle, AlertCircle, Receipt
} from 'lucide-react';
import { POSSettings } from '../../lib/types';
import { formatCurrency } from '../../lib/utils/notifications';
import LoadingSpinner from '../ui/LoadingSpinner';

export interface SplitPaymentEntry {
  id: string;
  method: 'cash' | 'card' | 'digital';
  amount: number;
}

interface SplitPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalDue: number;
  settings: POSSettings;
  onPaymentComplete: (splits: SplitPaymentEntry[], change: number) => Promise<void>;
}

const METHOD_CONFIG = {
  cash: { label: 'Cash', icon: Banknote, color: 'border-success-500 bg-success-500/10 text-success-500' },
  card: { label: 'Card', icon: CreditCard, color: 'border-primary-500 bg-primary-500/10 text-primary-500' },
  digital: { label: 'Digital', icon: Smartphone, color: 'border-purple-500 bg-purple-500/10 text-purple-500' },
};

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

export default function SplitPaymentModal({
  isOpen,
  onClose,
  totalDue,
  settings,
  onPaymentComplete,
}: SplitPaymentModalProps) {
  const [splits, setSplits] = useState<SplitPaymentEntry[]>([
    { id: generateId(), method: 'cash', amount: totalDue },
  ]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setSplits([{ id: generateId(), method: 'cash', amount: totalDue }]);
    }
  }, [isOpen, totalDue]);

  const totalPaid = splits.reduce((s, e) => s + (e.amount || 0), 0);
  const remaining = totalDue - totalPaid;
  const change = Math.max(0, totalPaid - totalDue);
  const isValid = totalPaid >= totalDue && splits.every(s => s.amount > 0);

  const addSplit = () => {
    setSplits(prev => [
      ...prev,
      { id: generateId(), method: 'cash', amount: Math.max(0, remaining) },
    ]);
  };

  const removeSplit = (id: string) => {
    if (splits.length === 1) return;
    setSplits(prev => prev.filter(s => s.id !== id));
  };

  const updateSplit = (id: string, field: keyof SplitPaymentEntry, value: any) => {
    setSplits(prev =>
      prev.map(s => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const handleSubmit = async () => {
    if (!isValid) return;
    setIsProcessing(true);
    try {
      await onPaymentComplete(splits, change);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
      >
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="w-full max-w-lg bg-card sm:rounded-2xl rounded-t-3xl border border-border/50 shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Mobile drag handle */}
          <div className="flex justify-center pt-3 pb-1 sm:hidden flex-shrink-0">
            <div className="w-10 h-1 bg-border rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/50 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">Split Payment</h2>
                <p className="text-xs text-muted-foreground">
                  Total due: <span className="font-bold text-primary">{formatCurrency(totalDue)}</span>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            <AnimatePresence initial={false}>
              {splits.map((split, i) => {
                const cfg = METHOD_CONFIG[split.method];
                const Icon = cfg.icon;
                return (
                  <motion.div
                    key={split.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    className="bg-secondary/30 rounded-2xl p-4 border border-border/40"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Payment {i + 1}
                      </span>
                      {splits.length > 1 && (
                        <button
                          onClick={() => removeSplit(split.id)}
                          className="p-1 rounded-lg text-muted-foreground hover:text-error-500 hover:bg-error-500/10 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Method selector */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {(Object.keys(METHOD_CONFIG) as Array<keyof typeof METHOD_CONFIG>).map(m => {
                        const mc = METHOD_CONFIG[m];
                        const MIcon = mc.icon;
                        return (
                          <button
                            key={m}
                            onClick={() => updateSplit(split.id, 'method', m)}
                            className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border-2 text-xs font-semibold transition-all ${
                              split.method === m
                                ? mc.color
                                : 'border-border/40 text-muted-foreground hover:border-border'
                            }`}
                          >
                            <MIcon className="w-4 h-4" />
                            {mc.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Amount */}
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">
                        PKR
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={split.amount || ''}
                        onChange={e => updateSplit(split.id, 'amount', parseFloat(e.target.value) || 0)}
                        className="w-full h-11 pl-12 pr-4 bg-background border border-border/60 rounded-xl text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all tabular-nums"
                        placeholder="0.00"
                      />
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Add split button */}
            <button
              onClick={addSplit}
              className="w-full py-2.5 rounded-xl border-2 border-dashed border-border/50 text-sm font-medium text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add another payment method
            </button>
          </div>

          {/* Footer summary */}
          <div className="border-t border-border/50 p-5 space-y-3 flex-shrink-0 bg-card">
            {/* Running total */}
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Total Due</span>
                <span className="font-semibold text-foreground tabular-nums">{formatCurrency(totalDue)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Total Entered</span>
                <span className={`font-semibold tabular-nums ${totalPaid >= totalDue ? 'text-success-500' : 'text-error-500'}`}>
                  {formatCurrency(totalPaid)}
                </span>
              </div>
              {remaining > 0 && (
                <div className="flex justify-between text-error-500 font-semibold">
                  <span className="flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Remaining
                  </span>
                  <span className="tabular-nums">{formatCurrency(remaining)}</span>
                </div>
              )}
              {change > 0 && (
                <div className="flex justify-between text-success-500 font-semibold">
                  <span>Change Due</span>
                  <span className="tabular-nums">{formatCurrency(change)}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={isProcessing}
                className="flex-1 py-3 rounded-xl border border-border/60 text-sm font-semibold text-muted-foreground hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!isValid || isProcessing}
                className="flex-1 py-3 rounded-xl bg-success-600 hover:bg-success-700 text-white font-bold text-sm shadow-lg shadow-success-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
              >
                {isProcessing ? (
                  <><LoadingSpinner size="sm" color="white" /> Processing…</>
                ) : (
                  <><CheckCircle className="w-4 h-4" /> Complete Payment</>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
