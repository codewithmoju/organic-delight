import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useReactToPrint } from 'react-to-print';
import { Printer, Receipt, RotateCcw, Settings, TrendingUp } from 'lucide-react';
import BarcodeScanner from './BarcodeScanner';
import ShoppingCart from './ShoppingCart';
import ProductSearch from './ProductSearch';
import PaymentModal from './PaymentModal';
import ReceiptGenerator from './ReceiptGenerator';
import { CartItem, BarcodeProduct, POSTransaction, POSSettings } from '../../lib/types';
import { getProductByBarcode, createPOSTransaction, getPOSSettings } from '../../lib/api/pos';
import { formatCurrency } from '../../lib/utils/notifications';
import { useAuthStore } from '../../lib/store';
import LoadingSpinner from '../ui/LoadingSpinner';

export default function POSInterface() {
  const profile = useAuthStore((state) => state.profile);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [completedTransaction, setCompletedTransaction] = useState<POSTransaction | null>(null);
  const [settings, setSettings] = useState<POSSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const receiptRef = useRef<HTMLDivElement>(null);

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + item.line_total, 0);
  const taxAmount = subtotal * (settings?.tax_rate || 0.08);
  const total = subtotal + taxAmount;

  useEffect(() => {
    loadPOSSettings();
  }, []);

  const loadPOSSettings = async () => {
    try {
      const posSettings = await getPOSSettings();
      setSettings(posSettings);
    } catch (error) {
      console.error('Error loading POS settings:', error);
      // Don't show error to user, just use defaults
      const defaultSettings = {
        id: 'default',
        store_name: 'StockSuite Store',
        store_address: '',
        store_phone: '',
        tax_rate: 0,
        currency: 'USD',
        receipt_footer_message: 'Thank you for your business!',
        barcode_scanner_enabled: true,
        thermal_printer_enabled: false,
        auto_print_receipt: false
      };
      setSettings(defaultSettings);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = useReactToPrint({
    content: () => receiptRef.current,
    documentTitle: `Receipt-${completedTransaction?.transaction_number}`,
    onAfterPrint: () => {
      toast.success('Receipt printed successfully');
    },
    onPrintError: () => {
      toast.error('Failed to print receipt');
    }
  });

  const handleBarcodeScan = async (barcode: string) => {
    try {
      const product = await getProductByBarcode(barcode);
      
      if (!product) {
        toast.error(`Product not found for barcode: ${barcode}`);
        return;
      }
      
      if (product.stock === 0) {
        toast.error(`${product.name} is out of stock`);
        return;
      }
      
      addToCart(product, 1);
      toast.success(`Added ${product.name} to cart`);
    } catch (error: any) {
      console.error('Barcode scan error:', error);
      toast.error('Failed to process barcode');
    }
  };

  const addToCart = (product: BarcodeProduct, quantity: number) => {
    const existingItemIndex = cartItems.findIndex(item => item.item_id === product.id);
    
    if (existingItemIndex >= 0) {
      // Update existing item quantity
      const newQuantity = cartItems[existingItemIndex].quantity + quantity;
      if (newQuantity <= product.stock) {
        updateCartItemQuantity(cartItems[existingItemIndex].id, newQuantity);
      } else {
        toast.warning(`Only ${product.stock} items available in stock`);
        return;
      }
    } else {
      // Add new item to cart
      const newCartItem: CartItem = {
        id: generateCartItemId(),
        item_id: product.id,
        name: product.name,
        quantity,
        unit_price: product.price,
        line_total: product.price * quantity,
        sku: product.sku,
        barcode: product.barcode
      };
      setCartItems(prev => [...prev, newCartItem]);
    }
  };

  const updateCartItemQuantity = (cartItemId: string, quantity: number) => {
    setCartItems(prev => prev.map(item => 
      item.id === cartItemId 
        ? { ...item, quantity, line_total: item.unit_price * quantity }
        : item
    ));
  };

  const removeCartItem = (cartItemId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== cartItemId));
  };

  const clearCart = () => {
    if (cartItems.length > 0 && confirm('Are you sure you want to clear the cart?')) {
      setCartItems([]);
      toast.info('Cart cleared');
    }
  };

  const handlePaymentComplete = async (paymentData: {
    payment_method: 'cash' | 'card' | 'digital';
    payment_amount: number;
    change_amount: number;
    customer_name?: string;
    customer_phone?: string;
  }) => {
    try {
      const transaction = await createPOSTransaction({
        items: cartItems,
        subtotal,
        tax_amount: taxAmount,
        discount_amount: 0,
        total_amount: total,
        cashier_id: profile?.id || 'unknown',
        ...paymentData
      });
      
      setCompletedTransaction(transaction);
      setCartItems([]);
      setIsPaymentModalOpen(false);
      
      toast.success('Transaction completed successfully!');
      
      // Auto-print if enabled
      if (settings?.auto_print_receipt) {
        setTimeout(() => {
          handlePrint();
        }, 500);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to process payment');
      throw error;
    }
  };

  const startNewTransaction = () => {
    setCompletedTransaction(null);
    setCartItems([]);
  };

  const generateCartItemId = () => {
    return Math.random().toString(36).substr(2, 9);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Loading POS system..." />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-12">
        <Settings className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-400 mb-2">POS Settings Required</h3>
        <p className="text-gray-500">Please configure POS settings to continue</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gradient">Point of Sale</h1>
          <p className="text-gray-400 mt-1">
            {settings.store_name} - Professional Retail System
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {completedTransaction && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePrint}
              className="btn-secondary flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Print Receipt
            </motion.button>
          )}
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={startNewTransaction}
            className="btn-primary flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            New Transaction
          </motion.button>
        </div>
      </div>

      {/* Main POS Interface */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column - Scanner and Search */}
        <div className="xl:col-span-2 space-y-6">
          {/* Barcode Scanner */}
          <BarcodeScanner
            onScan={handleBarcodeScan}
            isActive={isScannerActive}
            onToggle={() => setIsScannerActive(!isScannerActive)}
          />
          
          {/* Product Search */}
          <ProductSearch onAddToCart={addToCart} />
        </div>

        {/* Right Column - Shopping Cart */}
        <div className="space-y-6">
          <ShoppingCart
            items={cartItems}
            onUpdateQuantity={updateCartItemQuantity}
            onRemoveItem={removeCartItem}
            onClearCart={clearCart}
            subtotal={subtotal}
            taxAmount={taxAmount}
            total={total}
            taxRate={settings.tax_rate}
          />
          
          {/* Checkout Button */}
          {cartItems.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsPaymentModalOpen(true)}
              className="w-full btn-primary py-4 text-lg font-semibold flex items-center justify-center gap-2"
            >
              <Receipt className="w-5 h-5" />
              Proceed to Payment
            </motion.button>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        cartItems={cartItems}
        subtotal={subtotal}
        taxAmount={taxAmount}
        total={total}
        settings={settings}
        onPaymentComplete={handlePaymentComplete}
      />

      {/* Hidden Receipt for Printing */}
      <div className="hidden">
        {completedTransaction && (
          <ReceiptGenerator
            ref={receiptRef}
            transaction={completedTransaction}
            settings={settings}
          />
        )}
      </div>

      {/* Transaction Success Modal */}
      {completedTransaction && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-dark-800 rounded-2xl border border-dark-700/50 shadow-dark-lg p-6 max-w-md w-full text-center"
          >
            <div className="p-3 rounded-full bg-success-500/20 text-success-400 w-fit mx-auto mb-4">
              <Receipt className="w-8 h-8" />
            </div>
            
            <h3 className="text-xl font-semibold text-white mb-2">
              Transaction Complete!
            </h3>
            <p className="text-gray-400 mb-4">
              Transaction #{completedTransaction.transaction_number}
            </p>
            
            <div className="bg-dark-900/50 rounded-lg p-4 mb-6">
              <div className="text-2xl font-bold text-success-400 mb-1">
                {formatCurrency(completedTransaction.total_amount)}
              </div>
              {completedTransaction.change_amount > 0 && (
                <div className="text-lg text-warning-400">
                  Change: {formatCurrency(completedTransaction.change_amount)}
                </div>
              )}
            </div>
            
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePrint}
                className="btn-secondary flex-1 flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Print Receipt
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startNewTransaction}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                New Sale
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}