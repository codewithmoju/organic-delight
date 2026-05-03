import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isPast, isToday, addDays } from 'date-fns';
import { Calendar, Plus, X, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '../../lib/utils/notifications';
import { readScopedJSON, writeScopedJSON } from '../../lib/utils/storageScope';

export interface ScheduledPayment {
  id: string;
  vendor_id: string;
  amount: number;
  due_date: string; // ISO date string
  notes?: string;
  status: 'pending' | 'paid' | 'overdue';
}

function getKey(vendorId: string) {
  return `vendor_payment_schedule_${vendorId}`;
}

function loadSchedule(vendorId: string): ScheduledPayment[] {
  const k = getKey(vendorId);
  return readScopedJSON<ScheduledPayment[]>(k, [], undefined, k);
}

function saveSchedule(vendorId: string, payments: ScheduledPayment[]) {
  writeScopedJSON(getKey(vendorId), payments);
}

interface VendorPaymentScheduleProps {
  vendorId: string;
  outstandingBalance: number;
}

export default function VendorPaymentSchedule({ vendorId, outstandingBalance }: VendorPaymentScheduleProps) {
  const [payments, setPayments] = useState<ScheduledPayment[]>(() => loadSchedule(vendorId));
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(format(addDays(new Date(), 7), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('');

  // Auto-mark overdue
  useEffect(() => {
    const updated = payments.map(p => {
      if (p.status === 'pending' && isPast(new Date(p.due_date)) && !isToday(new Date(p.due_date))) {
        return { ...p, status: 'overdue' as const };
      }
      return p;
    });
    if (JSON.stringify(updated) !== JSON.stringify(payments)) {
      setPayments(updated);
      saveSchedule(vendorId, updated);
    }
  }, []);

  const addPayment = () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { toast.error('Enter a valid amount'); return; }
    const payment: ScheduledPayment = {
      id: Date.now().toString(),
      vendor_id: vendorId,
      amount: amt,
      due_date: dueDate,
      notes: notes.trim() || undefined,
      status: 'pending',
    };
    const updated = [...payments, payment].sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
    setPayments(updated);
    saveSchedule(vendorId, updated);
    setAmount('');
    setNotes('');
    setShowForm(false);
    toast.success('Payment scheduled');
  };

  const markPaid = (id: string) => {
    const updated = payments.map(p => p.id === id ? { ...p, status: 'paid' as const } : p);
    setPayments(updated);
    saveSchedule(vendorId, updated);
    toast.success('Payment marked as paid');
  };

  const deletePayment = (id: string) => {
    const updated = payments.filter(p => p.id !== id);
    setPayments(updated);
    saveSchedule(vendorId, updated);
  };

  const STATUS_CONFIG = {
    pending:  { icon: Clock,         label: 'Pending',  cls: 'bg-warning-500/10 text-warning-500 border-warning-500/20' },
    paid:     { icon: CheckCircle2,  label: 'Paid',     cls: 'bg-success-500/10 text-success-500 border-success-500/20' },
    overdue:  { icon: AlertCircle,   label: 'Overdue',  cls: 'bg-error-500/10 text-error-500 border-error-500/20' },
  };

  const pending = payments.filter(p => p.status !== 'paid');
  const totalScheduled = pending.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          Payment Schedule
        </h3>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Schedule
        </button>
      </div>

      {/* Summary */}
      {pending.length > 0 && (
        <div className="flex items-center justify-between px-3 py-2 bg-warning-500/10 border border-warning-500/20 rounded-xl text-xs">
          <span className="text-warning-600 dark:text-warning-400 font-medium">{pending.length} payment{pending.length !== 1 ? 's' : ''} scheduled</span>
          <span className="font-bold text-warning-600 dark:text-warning-400 tabular-nums">{formatCurrency(totalScheduled)}</span>
        </div>
      )}

      {/* Add form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-secondary/30 rounded-2xl p-4 space-y-3 border border-border/40">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">PKR</span>
                    <input type="number" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)}
                      className="w-full h-9 pl-12 pr-3 bg-background border border-border/60 rounded-xl text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="0.00" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Due Date</label>
                  <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                    className="w-full h-9 px-3 bg-background border border-border/60 rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>
              <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Notes (optional)"
                className="w-full h-9 px-3 bg-background border border-border/60 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowForm(false)} className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
                <button onClick={addPayment} className="px-4 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity">Schedule</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment list */}
      {payments.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">No payments scheduled</p>
      ) : (
        <div className="space-y-2">
          {payments.map((payment, i) => {
            const cfg = STATUS_CONFIG[payment.status];
            const Icon = cfg.icon;
            return (
              <motion.div
                key={payment.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`flex items-center gap-3 p-3 rounded-xl border ${cfg.cls} group`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold tabular-nums">{formatCurrency(payment.amount)}</p>
                  <p className="text-xs opacity-70">
                    Due {format(new Date(payment.due_date), 'MMM d, yyyy')}
                    {payment.notes && ` · ${payment.notes}`}
                  </p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {payment.status !== 'paid' && (
                    <button onClick={() => markPaid(payment.id)} className="p-1 rounded-lg hover:bg-success-500/20 text-success-500 transition-colors" title="Mark paid">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button onClick={() => deletePayment(payment.id)} className="p-1 rounded-lg hover:bg-error-500/20 text-error-500 transition-colors" title="Delete">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
