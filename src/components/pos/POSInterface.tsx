import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useReactToPrint } from 'react-to-print';
import { Printer, Receipt, RotateCcw, Settings, FileText, CreditCard, Building2, User, Keyboard } from 'lucide-react';
import EnhancedBarcodeScanner from './EnhancedBarcodeScanner';
import ShoppingCart from './ShoppingCart';
import EnhancedProductSearch from './EnhancedProductSearch';
import PaymentModal from './PaymentModal';
import EnhancedReceiptGenerator from './EnhancedReceiptGenerator';
import ExternalPrinterIntegration from './ExternalPrinterIntegration';
import VendorListModal from '../vendors/VendorListModal';
import CustomerSelector from '../customers/CustomerSelector';
import { CartItem, BarcodeProduct, POSTransaction, POSSettings, BillType, Customer } from '../../lib/types';
import { getProductByBarcode, createPOSTransaction, getPOSSettings } from '../../lib/api/pos';
import { getItemByBarcode, getItemByProductId } from '../../lib/api/enhancedItems';
import { updateCustomerBalanceForSale } from '../../lib/api/customers';
import { formatCurrency } from '../../lib/utils/notifications';
import { useAuthStore } from '../../lib/store';
import { usePOSShortcuts, POS_SHORTCUTS } from '../../hooks/useKeyboardShortcuts';
import LoadingSpinner from '../ui/LoadingSpinner';

export default function POSInterface() {
  const profile = useAuthStore((state) => state.profile);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [completedTransaction, setCompletedTransaction] = useState<POSTransaction | null>(null);
  const [settings, setSettings] = useState<POSSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // NEW: Dual billing mode & Credit sale state
  const [billType, setBillType] = useState<BillType>('regular');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCreditSale, setIsCreditSale] = useState(false);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Discount state
  const [profitDiscount, setProfitDiscount] = useState(0);
  const [priceDiscount, setPriceDiscount] = useState(0);

  const receiptRef = useRef<HTMLDivElement>(null);

  // Calculate totals with discounts
  const subtotal = cartItems.reduce((sum, item) => sum + item.line_total, 0);
  const discountAmount = profitDiscount + priceDiscount;
  const discountedSubtotal = subtotal - discountAmount;
  const taxAmount = discountedSubtotal * (settings?.tax_rate || 0.08);
  const total = discountedSubtotal + taxAmount;

  // Keyboard shortcuts
  usePOSShortcuts({
    onNewTransaction: startNewTransaction,
    onProcessPayment: () => cartItems.length > 0 && setIsPaymentModalOpen(true),
    onToggleBillType: () => setBillType(prev => prev === 'regular' ? 'dummy' : 'regular'),
    onOpenVendors: () => setIsVendorModalOpen(true),
    onOpenCustomers: () => setIsCustomerModalOpen(true),
    onCloseModal: () => {
      setIsPaymentModalOpen(false);
      setIsVendorModalOpen(false);
      setIsCustomerModalOpen(false);
      setShowShortcuts(false);
    }
  });

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
    contentRef: receiptRef,
    documentTitle: `Receipt-${completedTransaction?.transaction_number}`,
    onAfterPrint: () => {
      toast.success('Receipt printed successfully');
    }
  });

  const handleBarcodeScan = async (barcode: string) => {
    try {
      // Try to find product by barcode first
      let product = await getProductByBarcode(barcode);

      // If not found by barcode, try by product ID/SKU
      if (!product) {
        const item = await getItemByBarcode(barcode) || await getItemByProductId(barcode);
        if (item) {
          // Get current stock level
          const stockLevel = await import('../../lib/api/items').then(m => m.getItemStockLevel(item.id));
          // Cast to any to access EnhancedItem properties that may not be on base Item type
          const enhancedItem = item as any;

          product = {
            id: item.id,
            name: item.name,
            barcode: enhancedItem.barcode || barcode,
            price: enhancedItem.unit_price || enhancedItem.last_sale_rate || 0,
            stock: stockLevel?.current_quantity || 0,
            category: item.category?.name
          };
        }
      }

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
        available_stock: product.stock,
        sku: product.sku,
        barcode: product.barcode,
        category: product.category
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
    profit_discount: number;
    price_discount: number;
  }) => {
    const totalDiscount = paymentData.profit_discount + paymentData.price_discount;
    const netTotal = Math.max(0, total - totalDiscount);
    try {
      // For dummy bills, don't affect inventory
      if (billType === 'dummy') {
        const dummyTransaction: POSTransaction = {
          id: `dummy-${Date.now()}`,
          transaction_number: `QUO${Date.now().toString().slice(-8)}`,
          items: cartItems.map(item => ({
            id: item.id,
            item_id: item.item_id,
            item_name: item.name,
            barcode: item.barcode,
            unit_price: item.unit_price,
            quantity: item.quantity,
            line_total: item.line_total
          })),
          subtotal,
          tax_amount: taxAmount,
          discount_amount: totalDiscount + discountAmount,
          total_amount: netTotal,
          payment_method: paymentData.payment_method,
          payment_amount: 0,
          change_amount: 0,
          cashier_id: profile?.id || 'unknown',
          customer_name: selectedCustomer?.name || paymentData.customer_name,
          customer_phone: selectedCustomer?.phone || paymentData.customer_phone,
          created_at: new Date(),
          status: 'completed',
          receipt_printed: false,
          notes: 'QUOTATION - No inventory affected'
        };

        setCompletedTransaction(dummyTransaction);
        setCartItems([]);
        setIsPaymentModalOpen(false);
        toast.success('Quotation created successfully!');
        return;
      }

      // Regular bill processing
      const transaction = await createPOSTransaction({
        items: cartItems,
        subtotal: discountedSubtotal,
        tax_amount: taxAmount,
        discount_amount: totalDiscount + discountAmount,
        total_amount: netTotal,
        cashier_id: profile?.id || 'unknown',
        customer_name: selectedCustomer?.name || paymentData.customer_name,
        customer_phone: selectedCustomer?.phone || paymentData.customer_phone,
        ...paymentData
      });

      // Update customer balance for credit sales
      if (isCreditSale && selectedCustomer) {
        await updateCustomerBalanceForSale(selectedCustomer.id, netTotal);
        toast.info(`Credit added to ${selectedCustomer.name}'s account`);
      }

      setCompletedTransaction(transaction);
      setCartItems([]);
      setIsPaymentModalOpen(false);
      resetBillState();

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

  const resetBillState = () => {
    setBillType('regular');
    setSelectedCustomer(null);
    setIsCreditSale(false);
    setProfitDiscount(0);
    setPriceDiscount(0);
  };

  function startNewTransaction() {
    setCompletedTransaction(null);
    setCartItems([]);
    resetBillState();
  }

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
      {/* Header with Bill Type Toggle */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-gradient">Point of Sale</h1>
            {/* Bill Type Badge */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setBillType(prev => prev === 'regular' ? 'dummy' : 'regular')}
              className={`px-3 py-1 rounded-full text-sm font-semibold transition-all ${billType === 'dummy'
                ? 'bg-warning-500/20 text-warning-400 border border-warning-500/50'
                : 'bg-success-500/20 text-success-400 border border-success-500/50'
                }`}
            >
              {billType === 'dummy' ? '📋 QUOTATION' : '🧾 REGULAR BILL'}
            </motion.button>
          </div>
          <p className="text-gray-400 mt-1 flex items-center gap-2">
            {settings.store_name} • <span className="text-xs">Press F8 to toggle bill type</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Keyboard Shortcuts */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowShortcuts(!showShortcuts)}
            className="p-2 rounded-lg bg-dark-700/50 text-gray-400 hover:text-white"
            title="Keyboard Shortcuts"
          >
            <Keyboard className="w-5 h-5" />
          </motion.button>

          {/* Vendor List (F12) */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsVendorModalOpen(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <Building2 className="w-4 h-4" />
            <span className="hidden sm:inline">Vendors</span>
            <span className="text-xs text-gray-500">F12</span>
          </motion.button>

          {completedTransaction && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePrint}
              className="btn-secondary flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Print
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={startNewTransaction}
            className="btn-primary flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">New Transaction</span>
            <span className="sm:hidden">New</span>
          </motion.button>
        </div>
      </div>

      {/* Bill Type Warning for Dummy */}
      {billType === 'dummy' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-warning-500/10 border border-warning-500/30 flex items-center gap-3"
        >
          <FileText className="w-6 h-6 text-warning-400" />
          <div>
            <p className="text-warning-400 font-semibold">Quotation Mode Active</p>
            <p className="text-warning-300/70 text-sm">This bill will NOT affect inventory or financial records. Use for price inquiries only.</p>
          </div>
        </motion.div>
      )}

      {/* Credit Sale / Customer Selection */}
      {billType === 'regular' && (
        <div className="flex flex-wrap items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setIsCreditSale(!isCreditSale);
              if (!isCreditSale) setIsCustomerModalOpen(true);
              else setSelectedCustomer(null);
            }}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all ${isCreditSale
              ? 'bg-accent-500/20 text-accent-400 border border-accent-500/50'
              : 'bg-dark-700/50 text-gray-400 border border-dark-600/50 hover:border-accent-500/30'
              }`}
          >
            <CreditCard className="w-4 h-4" />
            {isCreditSale ? 'Credit Sale (Udhaar)' : 'Enable Credit Sale'}
          </motion.button>

          {selectedCustomer && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-accent-500/10 border border-accent-500/30">
              <User className="w-4 h-4 text-accent-400" />
              <span className="text-white font-medium">{selectedCustomer.name}</span>
              <span className="text-accent-400 text-sm">({formatCurrency(selectedCustomer.outstanding_balance)} due)</span>
              <button
                onClick={() => setIsCustomerModalOpen(true)}
                className="text-xs text-gray-400 hover:text-white"
              >
                Change
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main POS Interface */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column - Scanner and Search */}
        <div className="xl:col-span-2 space-y-6">
          {/* Barcode Scanner */}
          <EnhancedBarcodeScanner
            onScan={handleBarcodeScan}
            isActive={isScannerActive}
            onToggle={() => setIsScannerActive(!isScannerActive)}
          />

          {/* Product Search */}
          <EnhancedProductSearch onAddToCart={addToCart} />
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

      {/* External Printer Integration */}
      {completedTransaction && (
        <ExternalPrinterIntegration
          transaction={completedTransaction}
          settings={settings}
          onPrintComplete={() => toast.success('Receipt printed successfully')}
        />
      )}

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        cartItems={cartItems}
        subtotal={discountedSubtotal}
        taxAmount={taxAmount}
        total={total}
        settings={settings}
        onPaymentComplete={handlePaymentComplete}
      />

      {/* Vendor List Modal (F12) */}
      <VendorListModal
        isOpen={isVendorModalOpen}
        onClose={() => setIsVendorModalOpen(false)}
        mode="view"
      />

      {/* Customer Selector Modal */}
      <CustomerSelector
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSelectCustomer={(customer) => {
          setSelectedCustomer(customer);
          setIsCreditSale(true);
        }}
      />

      {/* Keyboard Shortcuts Help */}
      {showShortcuts && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowShortcuts(false)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-dark-800 rounded-2xl border border-dark-700/50 p-6 max-w-md"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Keyboard className="w-5 h-5 text-primary-400" />
              Keyboard Shortcuts
            </h3>
            <div className="space-y-2">
              {POS_SHORTCUTS.map(shortcut => (
                <div key={shortcut.key} className="flex items-center justify-between py-2 border-b border-dark-700/30">
                  <span className="text-gray-400">{shortcut.description}</span>
                  <span className="px-2 py-1 rounded bg-dark-700 text-primary-400 font-mono text-sm">{shortcut.key}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Hidden Receipt for Printing */}
      <div className="hidden">
        {completedTransaction && (
          <EnhancedReceiptGenerator
            ref={receiptRef}
            transaction={completedTransaction}
            settings={settings}
            variant="standard"
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