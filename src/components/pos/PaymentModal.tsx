import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Banknote, Smartphone, Calculator, Receipt, CheckCircle, DollarSign, Tag } from 'lucide-react';
import { CartItem, POSSettings } from '../../lib/types';
import { formatCurrency } from '../../lib/utils/notifications';
import { getPaymentMethods, PaymentMethod } from '../../lib/api/paymentMethods';
import { getDiscountTypes, DiscountType } from '../../lib/api/discounts';
import LoadingSpinner from '../ui/LoadingSpinner';

const iconMap = {
  Banknote,
  CreditCard,
  Smartphone
};

const getMethodColor = (type: string) => {
  switch (type) {
    case 'cash': return 'border-success-500 bg-success-500/10 text-success-400';
    case 'card': return 'border-primary-500 bg-primary-500/10 text-primary-400';
    case 'digital': return 'border-accent-500 bg-accent-500/10 text-accent-400';
    default: return 'border-border bg-muted/30 text-foreground-muted';
  }
};

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
    profit_discount: number;
    price_discount: number;
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
  const { t } = useTranslation();
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'digital'>('cash');
  const [availableMethods, setAvailableMethods] = useState<PaymentMethod[]>([]);
  const [discountTypes, setDiscountTypes] = useState<DiscountType[]>([]);

  const [paymentAmount, setPaymentAmount] = useState(total);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);

  // Dynamic Discount State: slug -> amount
  const [discountValues, setDiscountValues] = useState<Record<string, number>>({});

  // Calculate totals
  const totalDiscount = Object.values(discountValues).reduce((sum, val) => sum + (val || 0), 0);

  // Map back to legacy fields for backward compatibility
  const profitDiscount = discountValues['profit'] || 0;
  // All other discounts (including 'price') are grouped into 'price_discount'
  // This ensures the backend/transaction record still sums up properly
  const priceDiscount = totalDiscount - profitDiscount;

  const discountedTotal = Math.max(0, total - totalDiscount);

  useEffect(() => {
    // Reset payment amount when total changes if using non-cash
    if (paymentMethod !== 'cash') {
      setPaymentAmount(discountedTotal);
    }
    // If cash, we don't auto-update payment amount unless it's less than total initially?
    // Actually, usually we default to total.
    if (paymentAmount === 0 || paymentAmount === total) {
      setPaymentAmount(discountedTotal);
    }
  }, [discountedTotal, paymentMethod]); // Be careful with dependencies

  // Initial Data Load
  useEffect(() => {
    const loadData = async () => {
      try {
        const [methods, discounts] = await Promise.all([
          getPaymentMethods(),
          getDiscountTypes()
        ]);
        setAvailableMethods(methods.filter(m => m.active));
        setDiscountTypes(discounts.filter(d => d.active));

        // Initialize discount values if needed? No, start at 0.
      } catch (error) {
        console.error('Error loading payment data:', error);
      }
    };
    if (isOpen) {
      loadData();
      setPaymentAmount(total); // Reset payment amount
      setDiscountValues({}); // Reset discounts
      setCustomerName('');
      setCustomerPhone('');
    }
  }, [isOpen, total]);

  const changeAmount = paymentMethod === 'cash' ? Math.max(0, paymentAmount - discountedTotal) : 0;
  const isPaymentValid = paymentMethod === 'cash' ? paymentAmount >= discountedTotal : true;

  const handlePayment = async () => {
    if (!isPaymentValid) return;

    setIsProcessing(true);
    try {
      await onPaymentComplete({
        payment_method: paymentMethod,
        payment_amount: paymentAmount,
        change_amount: changeAmount,
        customer_name: customerName.trim() || undefined,
        customer_phone: customerPhone.trim() || undefined,
        profit_discount: profitDiscount, // Mapped from 'profit' slice
        price_discount: priceDiscount   // Mapped from everything else
      });
    } catch (error) {
      console.error('Payment processing error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const quickAmountButtons = [
    { label: 'Exact', amount: discountedTotal },
    { label: '+$5', amount: discountedTotal + 5 },
    { label: '+$10', amount: discountedTotal + 10 },
    { label: '+$20', amount: discountedTotal + 20 },
  ];

  if (!isOpen) return null;

  const isRefund = total < 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-4xl bg-card rounded-2xl border border-border/50 shadow-xl overflow-hidden max-h-[90vh] flex flex-col md:flex-row"
        >
          {/* Left Panel - Payment Methods */}
          <div className="md:w-80 shrink-0 p-6 border-b md:border-b-0 md:border-r border-border/50 bg-muted/10 space-y-6 overflow-y-auto custom-scrollbar">
            <div>
              <h2 className="text-2xl font-bold mb-1">
                {isRefund ? 'Refund' : 'Payment'}
              </h2>
              <p className="text-foreground-muted">
                {isRefund
                  ? `Refund amount: ${formatCurrency(Math.abs(total))}`
                  : `Total Amount Due: ${formatCurrency(total)}`
                }
              </p>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-success-500/20 text-success-400">
                  <Receipt className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">Process Payment</h3>
                  <p className="text-foreground-muted">Complete the transaction</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 rounded-lg bg-muted/50 text-foreground-muted hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>
          </div>

          <div className="flex-1 p-6 space-y-6 overflow-y-auto custom-scrollbar">
            {/* Order Summary */}
            <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
              <h4 className="text-foreground font-semibold mb-3">Order Summary</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-foreground-muted">Items ({cartItems.reduce((sum, item) => sum + item.quantity, 0)}):</span>
                  <span className="text-foreground">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground-muted">Tax ({(settings.tax_rate * 100).toFixed(1)}%):</span>
                  <span className="text-foreground">{formatCurrency(taxAmount)}</span>
                </div>
                <div className="border-t border-border/50 pt-2">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-foreground">Total:</span>
                    <span className="text-xl font-bold text-primary-400">{formatCurrency(total)}</span>
                  </div>
                  {totalDiscount > 0 && (
                    <div className="flex justify-between text-error-400">
                      <span className="text-sm">Discount Applied:</span>
                      <span className="text-sm font-bold">-{formatCurrency(totalDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between mt-1">
                    <span className="text-md font-semibold text-foreground">Net Payable:</span>
                    <span className="text-lg font-bold text-success-400">{formatCurrency(discountedTotal)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div>
              <h4 className="text-foreground font-semibold mb-4">Payment Method</h4>
              <div className="grid grid-cols-3 gap-3">
                {availableMethods.map((method) => {
                  const Icon = iconMap[method.icon as keyof typeof iconMap] || Banknote;
                  return (
                    <motion.button
                      key={method.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setPaymentMethod(method.type)}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${paymentMethod === method.type
                        ? getMethodColor(method.type)
                        : 'border-border bg-muted/20 text-foreground-muted hover:border-foreground-muted/50'
                        }`}
                    >
                      <Icon className="w-6 h-6 mx-auto mb-2" />
                      <div className="font-semibold">{method.name}</div>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Dynamic Discounts Section */}
            <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
              <h4 className="text-foreground font-semibold mb-3 flex items-center gap-2">
                <Tag className="w-4 h-4 text-accent-400" />
                Discounts
              </h4>
              {discountTypes.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {discountTypes.map((type) => (
                    <div key={type.id} className="space-y-1">
                      <label className="text-xs text-foreground-muted uppercase tracking-wider font-semibold">
                        {type.name}
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted/50" />
                        <input
                          type="number"
                          className="w-full pl-10 px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-foreground placeholder-foreground-muted/50"
                          placeholder="0.00"
                          value={discountValues[type.slug] || ''}
                          onChange={e => setDiscountValues(prev => ({
                            ...prev,
                            [type.slug]: parseFloat(e.target.value) || 0
                          }))}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-foreground-muted/60 italic">No discount types available.</div>
              )}
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
                  <label className="block text-sm font-medium text-foreground-muted mb-2">
                    Amount Received
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min={total}
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                      className={`w-full px-4 py-3 text-lg bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-foreground placeholder-foreground-muted/50 pr-12 ${!isPaymentValid ? 'ring-error-500 border-error-500' : ''
                        }`}
                      placeholder="Enter amount received"
                    />
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setShowCalculator(!showCalculator)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3"
                    >
                      <Calculator className="w-5 h-5 text-foreground-muted hover:text-foreground" />
                    </motion.button>
                  </div>

                  {!isPaymentValid && (
                    <p className="mt-2 text-sm text-error-400">
                      Amount must be at least {formatCurrency(discountedTotal)}
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
                      className="p-2 rounded-lg bg-muted/50 text-foreground-muted hover:bg-muted hover:text-foreground transition-colors text-sm"
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
                <label className="block text-sm font-medium text-foreground-muted mb-2">
                  Customer Name (Optional)
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-foreground placeholder-foreground-muted/50"
                  placeholder="Enter customer name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground-muted mb-2">
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-foreground placeholder-foreground-muted/50"
                  placeholder="Enter phone number (e.g., +92 300 1234567)"
                />
              </div>
            </div>



            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border/50 sticky bottom-0 bg-card pb-2">
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
                disabled={isProcessing || (paymentMethod === 'cash' && changeAmount < 0 && !isRefund)}
                className="w-full py-4 rounded-xl bg-success-600 hover:bg-success-700 text-white font-bold text-lg shadow-lg shadow-success-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
              >
                {isProcessing ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>
                      {isRefund
                        ? `${t('common.refund', 'Refund')} ${formatCurrency(Math.abs(total))}`
                        : `${t('pos.payment.pay', 'Pay')} ${formatCurrency(total)}`
                      }
                    </span>
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