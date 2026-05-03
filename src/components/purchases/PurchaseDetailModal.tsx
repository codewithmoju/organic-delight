import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
  X, Building2, Calendar, Package, CheckCircle2, Clock,
  AlertCircle, Wallet, ArrowUpRight, CreditCard, RotateCcw,
  DollarSign, ChevronDown, ChevronUp, Truck
} from 'lucide-react';
import { Purchase, VendorPayment } from '../../lib/types';
import { formatCurrency } from '../../lib/utils/notifications';
import { recordVendorPayment } from '../../lib/api/vendors';
import { updatePurchaseDelivery } from '../../lib/api/purchases';
import { useAuthStore } from '../../lib/store';
import { toast } from 'sonner';
import LoadingSpinner from '../ui/LoadingSpinner';
import PurchaseReturnModal from './PurchaseReturnModal';

interface PurchaseDetailModalProps {
  purchase: Purchase;
  onClose: () => void;
  onUpdated?: () => void;
}

const STATUS_CONFIG = {
  paid:    { label: 'Paid',    icon: CheckCircle2, classes: 'bg-success-500/10 text-success-500 border-success-500/20' },
  partial: { label: 'Partial', icon: Clock,         classes: 'bg-warning-500/10 text-warning-500 border-warning-500/20' },
  unpaid:  { label: 'Unpaid',  icon: AlertCircle,   classes: 'bg-error-500/10 text-error-500 border-error-500/20' },
};

function Row({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex justify-between items-start gap-4 py-2.5 border-b border-border/30 last:border-0">
      <span className="text-sm text-muted-foreground flex-shrink-0">{label}</span>
      <span className={`text-sm font-semibold text-foreground text-right ${mono ? 'font-mono tabular-nums' : ''}`}>{value}</span>
    </div>
  );
}

export default function PurchaseDetailModal({ purchase, onClose, onUpdated }: PurchaseDetailModalProps) {
  const profile = useAuthStore(s => s.profile);
  const statusCfg = STATUS_CONFIG[purchase.payment_status];
  const StatusIcon = statusCfg.icon;

  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<'cash' | 'bank_transfer' | 'cheque'>('cash');
  const [payRef, setPayRef] = useState('');
  const [isSavingPayment, setIsSavingPayment] = useState(false);

  // Delivery state
  const [deliveryStatus, setDeliveryStatus] = useState<'pending' | 'partial' | 'received'>(
    purchase.delivery_status ?? 'pending'
  );
  const [deliveryNotes, setDeliveryNotes] = useState(purchase.delivery_notes ?? '');
  const [receivedQtys, setReceivedQtys] = useState<Record<string, number>>(
    Object.fromEntries(purchase.items.map(i => [i.item_id, i.received_quantity ?? 0]))
  );
  const [isSavingDelivery, setIsSavingDelivery] = useState(false);

  const handleRecordPayment = async () => {
    const amount = parseFloat(payAmount);
    if (!amount || amount <= 0) { toast.error('Enter a valid amount'); return; }
    if (amount > purchase.pending_amount) { toast.error(`Amount exceeds pending balance of ${formatCurrency(purchase.pending_amount)}`); return; }

    setIsSavingPayment(true);
    try {
      await recordVendorPayment({
        vendor_id: purchase.vendor_id,
        amount,
        payment_method: payMethod,
        reference_number: payRef || undefined,
        payment_date: new Date(),
        created_by: profile?.id || 'unknown',
        notes: `Payment for PO ${purchase.purchase_number}`,
      });
      toast.success('Payment recorded successfully');
      setShowPaymentForm(false);
      setPayAmount('');
      setPayRef('');
      onUpdated?.();
    } catch (err: any) {
      toast.error(err.message || 'Failed to record payment');
    } finally {
      setIsSavingPayment(false);
    }
  };

  const METHOD_ICONS = {
    cash: <Wallet className="w-3.5 h-3.5" />,
    bank_transfer: <ArrowUpRight className="w-3.5 h-3.5" />,
    cheque: <CreditCard className="w-3.5 h-3.5" />,
  };

  const handleSaveDelivery = async () => {
    setIsSavingDelivery(true);
    try {
      await updatePurchaseDelivery(purchase.id, {
        delivery_status: deliveryStatus,
        delivered_at: deliveryStatus === 'received' ? new Date() : undefined,
        delivery_notes: deliveryNotes || undefined,
        items: purchase.items.map(i => ({
          item_id: i.item_id,
          received_quantity: receivedQtys[i.item_id] ?? 0,
        })),
      });
      toast.success('Delivery status updated');
      setShowDeliveryForm(false);
      onUpdated?.();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update delivery');
    } finally {
      setIsSavingDelivery(false);
    }
  };

  const DELIVERY_STATUS_CONFIG = {
    pending:  { label: 'Pending',  icon: Clock,         classes: 'bg-secondary/50 text-muted-foreground border-border/40' },
    partial:  { label: 'Partial',  icon: Truck,         classes: 'bg-warning-500/10 text-warning-500 border-warning-500/20' },
    received: { label: 'Received', icon: CheckCircle2,  classes: 'bg-success-500/10 text-success-500 border-success-500/20' },
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />

      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, x: '100%' }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-card border-l border-border/60 shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/50 bg-card/80 backdrop-blur-sm flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-foreground font-mono">{purchase.purchase_number}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Purchase Order Details</p>
          </div>
          <div className="flex items-center gap-2">
            {purchase.pending_amount > 0 && (
              <button
                onClick={() => setShowReturnModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-warning-500/10 border border-warning-500/20 text-warning-600 dark:text-warning-400 hover:bg-warning-500/20 transition-colors text-xs font-semibold"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Return
              </button>
            )}
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Status banner */}
          <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border ${statusCfg.classes}`}>
            <StatusIcon className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm font-semibold">{statusCfg.label}</span>
            {purchase.pending_amount > 0 && (
              <span className="ml-auto text-sm font-bold tabular-nums">
                {formatCurrency(purchase.pending_amount)} pending
              </span>
            )}
          </div>

          {/* Vendor & meta */}
          <div className="bg-secondary/30 rounded-2xl p-4 space-y-0">
            <Row label="Vendor" value={<span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-primary" />{purchase.vendor_name}</span>} />
            <Row label="Purchase Date" value={<span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-muted-foreground" />{format(new Date(purchase.purchase_date), 'MMM d, yyyy')}</span>} />
            {purchase.bill_number && <Row label="Invoice #" value={purchase.bill_number} mono />}
            {purchase.notes && <Row label="Notes" value={<span className="text-muted-foreground font-normal">{purchase.notes}</span>} />}
          </div>

          {/* Items */}
          <div>
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              Items ({purchase.items.length})
            </h3>
            <div className="space-y-2">
              {purchase.items.map((item, i) => (
                <motion.div key={item.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="bg-secondary/30 rounded-xl p-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{item.item_name}</p>
                      {item.expiry_date && <p className="text-xs text-warning-500 mt-0.5">Exp: {format(new Date(item.expiry_date), 'MMM d, yyyy')}</p>}
                      {item.shelf_location && <p className="text-xs text-muted-foreground mt-0.5">Shelf: {item.shelf_location}</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-foreground tabular-nums">{formatCurrency(item.line_total)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.quantity} × {formatCurrency(item.purchase_rate)}</p>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-2 pt-2 border-t border-border/30">
                    <span className="text-xs text-muted-foreground">Cost: <span className="font-semibold text-foreground">{formatCurrency(item.purchase_rate)}</span></span>
                    <span className="text-xs text-muted-foreground">Sale: <span className="font-semibold text-success-500">{formatCurrency(item.sale_rate)}</span></span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Delivery Tracking */}
          <div className="bg-card rounded-2xl border border-border/60 overflow-hidden">
            <button
              onClick={() => setShowDeliveryForm(v => !v)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-foreground hover:bg-secondary/30 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-primary" />
                Delivery Status
              </span>
              <div className="flex items-center gap-2">
                {(() => {
                  const cfg = DELIVERY_STATUS_CONFIG[purchase.delivery_status ?? 'pending'];
                  const Icon = cfg.icon;
                  return (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold border ${cfg.classes}`}>
                      <Icon className="w-3 h-3" />{cfg.label}
                    </span>
                  );
                })()}
                {showDeliveryForm ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </div>
            </button>

            <AnimatePresence>
              {showDeliveryForm && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 space-y-4 border-t border-border/40 pt-4">
                    {/* Status selector */}
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Delivery Status</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['pending', 'partial', 'received'] as const).map(s => {
                          const cfg = DELIVERY_STATUS_CONFIG[s];
                          const Icon = cfg.icon;
                          return (
                            <button key={s} onClick={() => setDeliveryStatus(s)}
                              className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border-2 text-xs font-semibold transition-all ${
                                deliveryStatus === s ? cfg.classes + ' border-current' : 'border-border/40 text-muted-foreground hover:border-border'
                              }`}>
                              <Icon className="w-4 h-4" />
                              {cfg.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Per-item received quantities (shown for partial) */}
                    {deliveryStatus === 'partial' && (
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Received Quantities</label>
                        <div className="space-y-2">
                          {purchase.items.map(item => (
                            <div key={item.item_id} className="flex items-center gap-3 bg-secondary/30 rounded-xl px-3 py-2">
                              <span className="text-sm text-foreground flex-1 truncate">{item.item_name}</span>
                              <span className="text-xs text-muted-foreground flex-shrink-0">of {item.quantity}</span>
                              <input
                                type="number"
                                min="0"
                                max={item.quantity}
                                value={receivedQtys[item.item_id] ?? 0}
                                onChange={e => setReceivedQtys(p => ({ ...p, [item.item_id]: Math.min(item.quantity, parseInt(e.target.value) || 0) }))}
                                className="w-16 h-8 text-center bg-background border border-border/60 rounded-lg text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Delivery Notes</label>
                      <textarea
                        rows={2}
                        value={deliveryNotes}
                        onChange={e => setDeliveryNotes(e.target.value)}
                        className="w-full bg-secondary/50 border border-border/60 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all resize-none placeholder:text-muted-foreground/50"
                        placeholder="e.g. Partial delivery received, 3 items missing..."
                      />
                    </div>

                    <button onClick={handleSaveDelivery} disabled={isSavingDelivery}
                      className="w-full py-2.5 rounded-xl bg-primary hover:opacity-90 text-primary-foreground font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2 transition-all">
                      {isSavingDelivery ? <><LoadingSpinner size="sm" color="white" /> Saving…</> : <><Truck className="w-4 h-4" /> Update Delivery</>}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Payment summary */}
          <div className="bg-secondary/30 rounded-2xl p-4 space-y-0">
            <h3 className="text-sm font-bold text-foreground mb-2">Payment Summary</h3>
            <Row label="Subtotal" value={formatCurrency(purchase.subtotal)} mono />
            {purchase.tax_amount > 0 && <Row label="Tax" value={formatCurrency(purchase.tax_amount)} mono />}
            {purchase.discount_amount > 0 && <Row label="Discount" value={`-${formatCurrency(purchase.discount_amount)}`} mono />}
            <Row label="Total" value={<span className="text-base font-bold text-primary">{formatCurrency(purchase.total_amount)}</span>} mono />
            <Row label="Paid" value={<span className="text-success-500">{formatCurrency(purchase.paid_amount)}</span>} mono />
            {purchase.pending_amount > 0 && (
              <Row label="Pending" value={<span className="text-error-500">{formatCurrency(purchase.pending_amount)}</span>} mono />
            )}
          </div>

          {/* Record Payment */}
          {purchase.pending_amount > 0 && (
            <div className="bg-card rounded-2xl border border-border/60 overflow-hidden">
              <button
                onClick={() => setShowPaymentForm(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-foreground hover:bg-secondary/30 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-success-500" />
                  Record Payment
                </span>
                {showPaymentForm ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </button>

              <AnimatePresence>
                {showPaymentForm && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-3 border-t border-border/40">
                      <div className="grid grid-cols-2 gap-3 pt-3">
                        {/* Amount */}
                        <div className="col-span-2">
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Amount</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">PKR</span>
                            <input type="number" min="0" step="0.01" value={payAmount} onChange={e => setPayAmount(e.target.value)}
                              className="w-full h-10 pl-12 pr-4 bg-secondary/50 border border-border/60 rounded-xl text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                              placeholder={`Max: ${formatCurrency(purchase.pending_amount)}`} />
                          </div>
                        </div>
                        {/* Method */}
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Method</label>
                          <div className="grid grid-cols-3 gap-1">
                            {(['cash', 'bank_transfer', 'cheque'] as const).map(m => (
                              <button key={m} onClick={() => setPayMethod(m)}
                                className={`flex flex-col items-center gap-0.5 py-2 rounded-lg border text-xs font-medium transition-all ${payMethod === m ? 'bg-primary/10 border-primary text-primary' : 'border-border/40 text-muted-foreground hover:border-border'}`}>
                                {METHOD_ICONS[m]}
                                <span className="text-[10px] capitalize">{m.replace('_', ' ')}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                        {/* Reference */}
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Reference</label>
                          <input type="text" value={payRef} onChange={e => setPayRef(e.target.value)}
                            className="w-full h-10 px-3 bg-secondary/50 border border-border/60 rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all placeholder:text-muted-foreground/50"
                            placeholder="Optional" />
                        </div>
                      </div>
                      <button onClick={handleRecordPayment} disabled={isSavingPayment || !payAmount}
                        className="w-full py-2.5 rounded-xl bg-success-600 hover:bg-success-700 text-white font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2 transition-all">
                        {isSavingPayment ? <><LoadingSpinner size="sm" color="white" /> Saving…</> : <><CheckCircle2 className="w-4 h-4" /> Save Payment</>}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.div>

      {/* Return Modal */}
      <AnimatePresence>
        {showReturnModal && (
          <PurchaseReturnModal
            purchase={purchase}
            onClose={() => setShowReturnModal(false)}
            onSuccess={() => { onUpdated?.(); }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
