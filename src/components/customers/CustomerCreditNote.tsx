import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Plus, X } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { formatCurrency } from '../../lib/utils/notifications';
import { recordCustomerTransaction } from '../../lib/api/customers';
import { useAuthStore } from '../../lib/store';
import LoadingSpinner from '../ui/LoadingSpinner';

interface CustomerCreditNoteProps {
  customerId: string;
  customerName: string;
  onIssued: () => void;
}

export default function CustomerCreditNote({ customerId, customerName, onIssued }: CustomerCreditNoteProps) {
  const profile = useAuthStore(s => s.profile);
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleIssue = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { toast.error('Enter a valid amount'); return; }
    if (!reason.trim()) { toast.error('Reason is required'); return; }

    setIsSaving(true);
    try {
      // A credit note reduces the customer's outstanding balance (like a payment)
      await recordCustomerTransaction({
        customer_id: customerId,
        type: 'payment',
        amount: amt,
        payment_method: 'adjustment',
        notes: `Credit Note: ${reason.trim()}`,
        payment_date: new Date(),
        created_by: profile?.id || 'unknown',
      });
      toast.success(`Credit note of ${formatCurrency(amt)} issued to ${customerName}`);
      setAmount('');
      setReason('');
      setShowForm(false);
      onIssued();
    } catch (err: any) {
      toast.error(err.message || 'Failed to issue credit note');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          Credit Notes
        </h3>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Issue
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-secondary/30 rounded-2xl p-4 space-y-3 border border-border/40">
              <p className="text-xs text-muted-foreground">
                A credit note reduces the customer's outstanding balance without a cash payment.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Amount *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">PKR</span>
                    <input type="number" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)}
                      className="w-full h-9 pl-12 pr-3 bg-background border border-border/60 rounded-xl text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="0.00" autoFocus />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Reason *</label>
                  <input type="text" value={reason} onChange={e => setReason(e.target.value)}
                    placeholder="e.g. Returned goods"
                    className="w-full h-9 px-3 bg-background border border-border/60 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowForm(false)} disabled={isSaving} className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
                <button onClick={handleIssue} disabled={isSaving}
                  className="px-4 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5 transition-opacity">
                  {isSaving ? <><LoadingSpinner size="sm" color="white" /> Issuing…</> : 'Issue Credit Note'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
