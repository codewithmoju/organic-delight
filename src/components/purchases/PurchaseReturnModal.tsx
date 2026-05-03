import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RotateCcw, AlertCircle, CheckCircle2, Minus, Plus } from 'lucide-react';
import { Purchase, ReturnItem } from '../../lib/types';
import { processPOSReturn } from '../../lib/api/returns';
import { formatCurrency } from '../../lib/utils/notifications';
import { useAuthStore } from '../../lib/store';
import { toast } from 'sonner';
import LoadingSpinner from '../ui/LoadingSpinner';

interface PurchaseReturnModalProps {
  purchase: Purchase;
  onClose: () => void;
  onSuccess: () => void;
  /** When true, renders as an inline card instead of a slide-over panel */
  inline?: boolean;
}

export default function PurchaseReturnModal({ purchase, onClose, onSuccess, inline = false }: PurchaseReturnModalProps) {
  const profile = useAuthStore(s => s.profile);
  const [quantities, setQuantities] = useState<Record<string, number>>(
    Object.fromEntries(purchase.items.map(i => [i.item_id, 0]))
  );
  const [reason, setReason] = useState('');
  const [refundMethod, setRefundMethod] = useState<'cash' | 'store_credit'>('cash');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalRefund = purchase.items.reduce((sum, item) => {
    return sum + (quantities[item.item_id] || 0) * item.purchase_rate;
  }, 0);

  const hasItems = Object.values(quantities).some(q => q > 0);

  const handleSubmit = async () => {
    if (!hasItems) { toast.error('Select at least one item to return'); return; }
    if (!reason.trim()) { toast.error('Please provide a reason for the return'); return; }

    setIsSubmitting(true);
    try {
      const returnItems: ReturnItem[] = purchase.items
        .filter(item => (quantities[item.item_id] || 0) > 0)
        .map(item => ({
          pos_item_id: item.id,
          item_id: item.item_id,
          item_name: item.item_name,
          quantity_to_return: quantities[item.item_id],
          unit_price: item.purchase_rate,
          refund_amount: quantities[item.item_id] * item.purchase_rate,
        }));

      await processPOSReturn({
        original_transaction_id: purchase.id,
        items: returnItems,
        total_refund: totalRefund,
        refund_method: refundMethod,
        reason: reason.trim(),
        created_by: profile?.id || 'unknown',
      });

      toast.success('Return processed successfully');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to process return');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Backdrop — only shown in modal mode */}
      {!inline && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
      )}

      <motion.div
        initial={inline ? { opacity: 0, y: 16 } : { opacity: 0, x: '100%' }}
        animate={inline ? { opacity: 1, y: 0 } : { opacity: 1, x: 0 }}
        exit={inline ? { opacity: 0, y: -8 } : { opacity: 0, x: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={inline
          ? 'bg-card rounded-2xl border border-border/60 shadow-sm flex flex-col overflow-hidden'
          : 'fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-card border-l border-border/60 shadow-2xl flex flex-col'
        }
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-warning-500/10 text-warning-500">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Return Items</h2>
              <p className="text-xs text-muted-foreground">{purchase.purchase_number}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary text-muted-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Items */}
          <div>
            <h3 className="text-sm font-bold text-foreground mb-3">Select Items to Return</h3>
            <div className="space-y-2">
              {purchase.items.map(item => (
                <div key={item.item_id} className="bg-secondary/30 rounded-xl p-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{item.item_name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.quantity} purchased · {formatCurrency(item.purchase_rate)} each
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-background rounded-lg p-0.5 border border-border/40">
                    <button
                      onClick={() => setQuantities(p => ({ ...p, [item.item_id]: Math.max(0, (p[item.item_id] || 0) - 1) }))}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-bold tabular-nums">
                      {quantities[item.item_id] || 0}
                    </span>
                    <button
                      onClick={() => setQuantities(p => ({ ...p, [item.item_id]: Math.min(item.quantity, (p[item.item_id] || 0) + 1) }))}
                      disabled={(quantities[item.item_id] || 0) >= item.quantity}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-all disabled:opacity-30"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Reason for Return *
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full bg-secondary/50 border border-border/60 rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all resize-none placeholder:text-muted-foreground/50"
              placeholder="e.g. Damaged goods, wrong items received..."
            />
          </div>

          {/* Refund method */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
              Refund Method
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['cash', 'store_credit'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setRefundMethod(m)}
                  className={`py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                    refundMethod === m
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'border-border/40 text-muted-foreground hover:border-border'
                  }`}
                >
                  {m === 'cash' ? 'Cash Refund' : 'Store Credit'}
                </button>
              ))}
            </div>
          </div>

          {/* Total */}
          {hasItems && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-warning-500/10 border border-warning-500/20 rounded-xl p-4 flex justify-between items-center"
            >
              <span className="text-sm font-semibold text-warning-600 dark:text-warning-400">Total Refund</span>
              <span className="text-lg font-bold text-warning-600 dark:text-warning-400 tabular-nums">
                {formatCurrency(totalRefund)}
              </span>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 pb-5 pt-3 border-t border-border/50 flex-shrink-0">
          <button onClick={onClose} disabled={isSubmitting}
            className="flex-1 py-2.5 rounded-xl border border-border/60 text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!hasItems || !reason.trim() || isSubmitting}
            className="flex-1 py-2.5 rounded-xl bg-warning-600 hover:bg-warning-700 text-white font-bold text-sm shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
          >
            {isSubmitting ? <><LoadingSpinner size="sm" color="white" /> Processing…</> : <><RotateCcw className="w-4 h-4" /> Process Return</>}
          </button>
        </div>
      </motion.div>
    </>
  );
}
