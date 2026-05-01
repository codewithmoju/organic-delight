import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, DollarSign, Calendar, FileText, Building2, Wallet, TrendingDown } from 'lucide-react';
import { Vendor } from '../../lib/types';
import { recordVendorPayment } from '../../lib/api/vendors';
import { useAuthStore } from '../../lib/store';
import { toast } from 'sonner';
import { formatCurrency } from '../../lib/utils/notifications';

interface RecordPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    vendor: Vendor;
    onSuccess?: () => void;
}

export default function RecordPaymentModal({
    isOpen,
    onClose,
    vendor,
    onSuccess
}: RecordPaymentModalProps) {
    const profile = useAuthStore(state => state.profile);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [paymentData, setPaymentData] = useState({
        amount: '',
        payment_method: 'cash' as 'cash' | 'bank_transfer' | 'cheque',
        reference_number: '',
        notes: '',
        payment_date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        if (!isOpen) return;

        setPaymentData({
            amount: '',
            payment_method: 'cash',
            reference_number: '',
            notes: '',
            payment_date: new Date().toISOString().split('T')[0]
        });
    }, [isOpen, vendor.id]);

    const parsedAmount = useMemo(() => {
        const value = Number(paymentData.amount);
        return Number.isFinite(value) ? value : 0;
    }, [paymentData.amount]);

    const projectedBalance = useMemo(() => {
        return vendor.outstanding_balance - parsedAmount;
    }, [vendor.outstanding_balance, parsedAmount]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
            toast.error('Payment amount must be greater than zero');
            return;
        }

        setIsSubmitting(true);
        try {
            await recordVendorPayment({
                vendor_id: vendor.id,
                amount: parsedAmount,
                payment_method: paymentData.payment_method,
                reference_number: paymentData.reference_number.trim(),
                notes: paymentData.notes.trim(),
                payment_date: new Date(paymentData.payment_date),
                created_by: profile?.id || 'unknown'
            });

            toast.success('Payment recorded successfully');
            onSuccess?.();
            onClose();
        } catch (error) {
            console.error('Error recording payment:', error);
            toast.error('Failed to record payment');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 bg-background/40 backdrop-blur-md"
                    onClick={(e) => !isSubmitting && e.target === e.currentTarget && onClose()}
                >
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
                        <motion.div
                            initial={{ scale: 0.97, opacity: 0, y: 12 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.97, opacity: 0, y: 12 }}
                            className="w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-2xl bg-card border border-border/50 shadow-2xl rounded-xl sm:rounded-[2rem] overflow-hidden flex flex-col"
                        >
                            <div className="p-5 sm:p-6 border-b border-border/50 bg-secondary/10 backdrop-blur-sm">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2.5 rounded-xl bg-primary/10 text-primary mt-0.5">
                                            <DollarSign className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-foreground">Record Vendor Payment</h3>
                                            <p className="text-sm text-muted-foreground mt-1">Update ledger and outstanding balance for this supplier</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="p-2 rounded-xl bg-secondary hover:bg-destructive/10 hover:text-destructive transition-colors text-muted-foreground"
                                        disabled={isSubmitting}
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="rounded-xl border border-border/40 bg-background/60 p-3">
                                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Vendor</p>
                                        <p className="text-sm font-semibold text-foreground truncate flex items-center gap-1.5">
                                            <Building2 className="w-3.5 h-3.5 text-primary" />
                                            {vendor.company}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-border/40 bg-background/60 p-3">
                                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Current Balance</p>
                                        <p className={`text-sm font-semibold ${vendor.outstanding_balance > 0 ? 'text-warning-500' : 'text-success-500'}`}>
                                            {formatCurrency(vendor.outstanding_balance)}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-border/40 bg-background/60 p-3">
                                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">After Payment</p>
                                        <p className={`text-sm font-semibold ${projectedBalance > 0 ? 'text-warning-500' : 'text-success-500'}`}>
                                            {formatCurrency(projectedBalance)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 overflow-y-auto">
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                                        Amount to Pay
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">PKR</span>
                                        <input
                                            type="number"
                                            required
                                            min="0.01"
                                            step="0.01"
                                            inputMode="decimal"
                                            value={paymentData.amount}
                                            onChange={(e) => setPaymentData(prev => ({ ...prev, amount: e.target.value }))}
                                            className="input-theme pl-12 w-full"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div className="mt-2 text-xs text-muted-foreground flex items-center justify-between gap-3">
                                        <span className="inline-flex items-center gap-1">
                                            <TrendingDown className="w-3.5 h-3.5" />
                                            Payments reduce outstanding balance
                                        </span>
                                        <span className="font-semibold text-foreground">
                                            Impact: -{formatCurrency(parsedAmount)}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-muted-foreground mb-2">
                                            Payment Method
                                        </label>
                                        <select
                                            value={paymentData.payment_method}
                                            onChange={(e) => setPaymentData(prev => ({ ...prev, payment_method: e.target.value as 'cash' | 'bank_transfer' | 'cheque' }))}
                                            className="input-theme w-full"
                                        >
                                            <option value="cash">Cash</option>
                                            <option value="bank_transfer">Bank Transfer</option>
                                            <option value="cheque">Cheque</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-muted-foreground mb-2">
                                            Payment Date
                                        </label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <input
                                                type="date"
                                                required
                                                value={paymentData.payment_date}
                                                onChange={(e) => setPaymentData(prev => ({ ...prev, payment_date: e.target.value }))}
                                                className="input-theme pl-10 w-full"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                                        Reference Number
                                    </label>
                                    <div className="relative">
                                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <input
                                            type="text"
                                            value={paymentData.reference_number}
                                            onChange={(e) => setPaymentData(prev => ({ ...prev, reference_number: e.target.value }))}
                                            className="input-theme pl-10 w-full"
                                            placeholder="Cheque #, receipt #, or TXN ID"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                                        Notes (Optional)
                                    </label>
                                    <textarea
                                        value={paymentData.notes}
                                        onChange={(e) => setPaymentData(prev => ({ ...prev, notes: e.target.value }))}
                                        className="input-theme w-full min-h-24 resize-none"
                                        placeholder="Add context for this payment..."
                                    />
                                </div>

                                <div className="rounded-xl border border-border/40 bg-secondary/10 p-3 text-sm flex items-start gap-2 text-muted-foreground">
                                    <Wallet className="w-4 h-4 mt-0.5 text-primary" />
                                    <span>
                                        If payment is more than the current balance, vendor balance will become credit (negative). This is expected and handled correctly.
                                    </span>
                                </div>

                                <div className="sticky bottom-0 bg-card/95 backdrop-blur-sm pt-2">
                                    <div className="flex flex-col-reverse sm:flex-row gap-3">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="flex-1 btn-secondary"
                                            disabled={isSubmitting}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 btn-primary"
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? 'Recording...' : 'Save Payment'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
