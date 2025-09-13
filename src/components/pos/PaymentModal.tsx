import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Banknote, Smartphone, Calculator, Receipt, Printer } from 'lucide-react';
import { CartItem, POSSettings } from '../../lib/types';
import { formatCurrency } from '../../lib/utils/notifications';
import LoadingSpinner from '../ui/LoadingSpinner';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  settings: POSSettings;
  onPaymentComplete: (paymentData: {
    payment_method: 'cash' | 'card' | 'digital';
    payment_amount: number;
    change_amount: number;
    customer_name?: string;
    customer_phone?: string;
  }) => Promise<void>;
}

export default function PaymentModal({
  isOpen,
  onClose,
  cartItems,
  subtotal,
  taxAmount,
  total,
  settings,
  onPaymentComplete
}: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'digital'>('cash');
  const [paymentAmount, setPaymentAmount] = useState(total);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);

  const changeAmount = paymentMethod === 'cash' ? Math.max(0, paymentAmount - total) : 0;
  const isPaymentValid = paymentAmount >= total;

  useEffect(() => {
    if (paymentMethod !== 'cash') {
      setPaymentAmount(total);
    }
  }, [paymentMethod, total]);

  const handlePayment = async () => {
    if (!isPaymentValid) return;

    setIsProcessing(true);
    try {
      await onPaymentComplete({
        payment_method: paymentMethod,
        payment_amount: paymentAmount,
        change_amount: changeAmount,
        customer_name: customerName.trim() || undefined,
        customer_phone: customerPhone.trim() || undefined
      });
    } catch (error) {
      console.error('Payment processing error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const quickAmountButtons = [
    { label: 'Exact', amount: total },
    { label: '+$5', amount: total + 5 },
    { label: '+$10', amount: total + 10 },
    { label: '+$20', amount: total + 20 },
  ];

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
          className="w-full max-w-2xl bg-dark-800 rounded-2xl border border-dark-700/50 shadow-dark-lg overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-dark-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-success-500/20 text-success-400">
                  <Receipt className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">Process Payment</h3>
                  <p className="text-gray-400">Complete the transaction</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 rounded-lg bg-dark-700/50 text-gray-400 hover:text-white hover:bg-dark-600/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Order Summary */}
            <div className="bg-dark-900/50 rounded-xl p-4 border border-dark-700/50">
              <h4 className="text-white font-semibold mb-3">Order Summary</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-300">Items ({cartItems.reduce((sum, item) => sum + item.quantity, 0)}):</span>
                  <span className="text-white">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Tax ({(settings.tax_rate * 100).toFixed(1)}%):</span>
                  <span className="text-white">{formatCurrency(taxAmount)}</span>
                </div>
                <div className="border-t border-dark-700/50 pt-2">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-white">Total:</span>
                    <span className="text-xl font-bold text-primary-400">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div>
              <h4 className="text-white font-semibold mb-4">Payment Method</h4>
              <div className="grid grid-cols-3 gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setPaymentMethod('cash')}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                    paymentMethod === 'cash'
                      ? 'border-success-500 bg-success-500/10 text-success-400'
                      : 'border-dark-600 bg-dark-700/30 text-gray-400 hover:border-success-500/50'
                  }`}
                >
                  <Banknote className="w-6 h-6 mx-auto mb-2" />
                  <div className="font-semibold">Cash</div>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setPaymentMethod('card')}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                    paymentMethod === 'card'
                      ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                      : 'border-dark-600 bg-dark-700/30 text-gray-400 hover:border-primary-500/50'
                  }`}
                >
                  <CreditCard className="w-6 h-6 mx-auto mb-2" />
                  <div className="font-semibold">Card</div>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setPaymentMethod('digital')}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                    paymentMethod === 'digital'
                      ? 'border-accent-500 bg-accent-500/10 text-accent-400'
                      : 'border-dark-600 bg-dark-700/30 text-gray-400 hover:border-accent-500/50'
                  }`}
                >
                  <Smartphone className="w-6 h-6 mx-auto mb-2" />
                  <div className="font-semibold">Digital</div>
                </motion.button>
              </div>
            </div>

            {/* Cash Payment Details */}
            {paymentMethod === 'cash' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Amount Received
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min={total}
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                      className={`w-full input-dark input-large pr-12 ${
                        !isPaymentValid ? 'ring-error-500 border-error-500' : ''
                      }`}
                      placeholder="Enter amount received"
                    />
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setShowCalculator(!showCalculator)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3"
                    >
                      <Calculator className="w-5 h-5 text-gray-400 hover:text-white" />
                    </motion.button>
                  </div>
                  
                  {!isPaymentValid && (
                    <p className="mt-2 text-sm text-error-400">
                      Amount must be at least {formatCurrency(total)}
                    </p>
                  )}
                </div>

                {/* Quick Amount Buttons */}
                <div className="grid grid-cols-4 gap-2">
                  {quickAmountButtons.map((button) => (
                    <motion.button
                      key={button.label}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setPaymentAmount(button.amount)}
                      className="p-2 rounded-lg bg-dark-700/50 text-gray-300 hover:bg-dark-600/50 hover:text-white transition-colors text-sm"
                    >
                      {button.label}
                    </motion.button>
                  ))}
                </div>

                {/* Change Amount */}
                {changeAmount > 0 && (
                  <div className="bg-success-500/10 border border-success-500/20 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-success-300 font-medium">Change Due:</span>
                      <span className="text-2xl font-bold text-success-400">
                        {formatCurrency(changeAmount)}
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Customer Information (Optional) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Customer Name (Optional)
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full input-dark"
                  placeholder="Enter customer name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full input-dark"
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-dark-700/50">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="btn-secondary flex-1 py-3"
              >
                Cancel
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePayment}
                disabled={!isPaymentValid || isProcessing}
                className="btn-primary flex-1 flex items-center justify-center gap-2 py-3"
              >
                {isProcessing ? (
                  <>
                    <LoadingSpinner size="sm" color="white" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Receipt className="w-4 h-4" />
                    Complete Sale
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}