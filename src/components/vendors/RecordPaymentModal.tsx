import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, DollarSign, Calendar, CreditCard, FileText } from 'lucide-react';
import { Vendor } from '../../lib/types';
import { recordVendorPayment } from '../../lib/api/vendors';
import { useAuthStore } from '../../lib/store';
import { toast } from 'sonner';

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
        amount: 0,
        payment_method: 'cash' as 'cash' | 'bank_transfer' | 'cheque',
        reference_number: '',
        notes: '',
        payment_date: new Date().toISOString().split('T')[0]
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (paymentData.amount <= 0) {
            toast.error('Payment amount must be greater than zero');
            return;
        }

        setIsSubmitting(true);
        try {
            await recordVendorPayment({
                vendor_id: vendor.id,
                amount: paymentData.amount,
                payment_method: paymentData.payment_method,
                reference_number: paymentData.reference_number,
                notes: paymentData.notes,
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
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                onClick={(e) => e.target === e.currentTarget && onClose()}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="w-full max-w-md bg-dark-800 rounded-2xl border border-dark-700/50 shadow-dark-lg overflow-hidden"
                >
                    <div className="p-6 border-b border-dark-700/50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-success-500/20 text-success-400">
                                <DollarSign className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-white">Record Payment</h3>
                                <p className="text-gray-400 text-sm">Paying: {vendor.company}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">
                                Amount to Pay
                            </label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                <input
                                    type="number"
                                    required
                                    min="0.01"
                                    step="0.01"
                                    value={paymentData.amount || ''}
                                    onChange={(e) => setPaymentData(prev => ({ ...prev, amount: parseFloat(e.target.value) }))}
                                    className="input-dark pl-10 w-full"
                                    placeholder="0.00"
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                Current Balance: <span className="text-warning-400">{vendor.outstanding_balance.toLocaleString()}</span>
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">
                                    Payment Method
                                </label>
                                <select
                                    value={paymentData.payment_method}
                                    onChange={(e) => setPaymentData(prev => ({ ...prev, payment_method: e.target.value as any }))}
                                    className="input-dark w-full"
                                >
                                    <option value="cash">Cash</option>
                                    <option value="bank_transfer">Bank Transfer</option>
                                    <option value="cheque">Cheque</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">
                                    Payment Date
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={paymentData.payment_date}
                                    onChange={(e) => setPaymentData(prev => ({ ...prev, payment_date: e.target.value }))}
                                    className="input-dark w-full"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">
                                Reference Number
                            </label>
                            <div className="relative">
                                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                <input
                                    type="text"
                                    value={paymentData.reference_number}
                                    onChange={(e) => setPaymentData(prev => ({ ...prev, reference_number: e.target.value }))}
                                    className="input-dark pl-10 w-full"
                                    placeholder="Cheque # or TXN ID"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">
                                Notes (Optional)
                            </label>
                            <textarea
                                value={paymentData.notes}
                                onChange={(e) => setPaymentData(prev => ({ ...prev, notes: e.target.value }))}
                                className="input-dark w-full h-24 resize-none"
                                placeholder="Add any details about this payment..."
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
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
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
