import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useReactToPrint } from 'react-to-print';
import {
  Printer, Receipt, RotateCcw, Settings, FileText, CreditCard,
  Building2, User, Keyboard, Search, Plus, Package,
  Camera, Scan, ShoppingCart as CartIcon, Minus,
  Trash2, X
} from 'lucide-react';
import EnhancedBarcodeScanner from './EnhancedBarcodeScanner';
import ConfirmDialog from '../ui/ConfirmDialog';
import PaymentModal from './PaymentModal';
import EnhancedReceiptGenerator from './EnhancedReceiptGenerator';
import VendorListModal from '../vendors/VendorListModal';
import CustomerSelector from '../customers/CustomerSelector';
import { CartItem, BarcodeProduct, POSTransaction, POSSettings, BillType, Customer } from '../../lib/types';
import { getProductByBarcode, createPOSTransaction, getPOSSettings, searchProducts } from '../../lib/api/pos';
import { getBillTypes, DEFAULT_BILL_TYPES } from '../../lib/api/billTypes';
import { getItemByBarcode, getItemByProductId } from '../../lib/api/enhancedItems';
import { updateCustomerBalanceForSale } from '../../lib/api/customers';
import { formatCurrency } from '../../lib/utils/notifications';
import { clearDashboardCache } from '../../lib/api/dashboard';
import { useAuthStore } from '../../lib/store';
import { usePOSShortcuts, POS_SHORTCUTS } from '../../hooks/useKeyboardShortcuts';
import LoadingSpinner from '../ui/LoadingSpinner';

export default function POSInterface() {
  const { t } = useTranslation();
  const profile = useAuthStore((state) => state.profile);

  // Core state
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [settings, setSettings] = useState<POSSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Scanner
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<BarcodeProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Bill types
  const [billTypes, setBillTypes] = useState<BillType[]>([]);
  const [selectedBillType, setSelectedBillType] = useState<BillType | null>(null);

  // Customer / Credit
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCreditSale, setIsCreditSale] = useState(false);

  // Modals
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [isClearCartConfirmOpen, setIsClearCartConfirmOpen] = useState(false);

  // Transaction
  const [completedTransaction, setCompletedTransaction] = useState<POSTransaction | null>(null);
  const [profitDiscount, setProfitDiscount] = useState(0);
  const [priceDiscount, setPriceDiscount] = useState(0);

  const receiptRef = useRef<HTMLDivElement>(null);

  // Calculations
  const subtotal = cartItems.reduce((sum, item) => sum + item.line_total, 0);
  const discountAmount = profitDiscount + priceDiscount;
  const discountedSubtotal = subtotal - discountAmount;
  const taxAmount = discountedSubtotal * (settings?.tax_rate ?? 0);
  const total = discountedSubtotal + taxAmount;

  // Keyboard shortcuts
  usePOSShortcuts({
    onNewTransaction: startNewTransaction,
    onProcessPayment: () => cartItems.length > 0 && setIsPaymentModalOpen(true),
    onToggleBillType: () => {
      if (billTypes.length < 2) return;
      const currentIndex = billTypes.findIndex(t => t.id === selectedBillType?.id);
      const nextIndex = (currentIndex + 1) % billTypes.length;
      setSelectedBillType(billTypes[nextIndex]);
    },
    onOpenVendors: () => setIsVendorModalOpen(true),
    onOpenCustomers: () => setIsCustomerModalOpen(true),
    onCloseModal: () => {
      setIsPaymentModalOpen(false);
      setIsVendorModalOpen(false);
      setIsCustomerModalOpen(false);
      setShowShortcuts(false);
    }
  });

  // ─── Init ───
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await Promise.all([loadPOSSettings(), loadBillTypes()]);
      setIsLoading(false);
    };
    init();
  }, []);



  const loadBillTypes = async () => {
    try {
      let types = await getBillTypes();

      // Fallback if API returns empty (e.g. offline or error)
      if (!types || types.length === 0) {
        console.warn('No bill types found from API, using defaults');
        types = DEFAULT_BILL_TYPES.map(t => ({ ...t, id: t.code || 'regular' }));
      }

      const activeTypes = types.filter(t => t.active);
      setBillTypes(activeTypes);

      // Select default
      const defaultType = activeTypes.find(t => t.is_default) || activeTypes[0];
      if (defaultType) {
        setSelectedBillType(defaultType);
      } else {
        // Absolute fallback to ensure POS works
        const emergencyFallback: BillType = {
          id: 'regular', name: 'Regular Bill', code: 'regular',
          affects_inventory: true, affects_accounting: true,
          is_default: true, description: 'Standard Sale', active: true
        };
        setBillTypes([emergencyFallback]);
        setSelectedBillType(emergencyFallback);
      }
    } catch (error) {
      console.error('Error loading bill types:', error);
      // Emergency fallback on crash
      const emergencyFallback: BillType = {
        id: 'regular', name: 'Regular Bill', code: 'regular',
        affects_inventory: true, affects_accounting: true,
        is_default: true, description: 'Standard Sale', active: true
      };
      setBillTypes([emergencyFallback]);
      setSelectedBillType(emergencyFallback);
    }
  };

  const loadPOSSettings = async () => {
    try {
      const posSettings = await getPOSSettings();
      setSettings(posSettings);
    } catch (error) {
      console.error('Error loading POS settings:', error);
      setSettings({
        id: 'default', store_name: 'StockSuite Store', store_address: '', store_phone: '',
        tax_rate: 0, currency: 'USD', receipt_footer_message: 'Thank you for your business!',
        barcode_scanner_enabled: true, thermal_printer_enabled: false, auto_print_receipt: false
      } as any);
    }
  };

  // ─── Search ───
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch();
      } else {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const performSearch = async () => {
    setIsSearching(true);
    try {
      const results = await searchProducts(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // ─── Cart Operations ───
  const handleBarcodeScan = async (barcode: string) => {
    try {
      let product = await getProductByBarcode(barcode);
      if (!product) {
        const item = await getItemByBarcode(barcode) || await getItemByProductId(barcode);
        if (item) {
          const stockLevel = await import('../../lib/api/items').then(m => m.getItemStockLevel(item.id));
          const enhancedItem = item as any;
          product = {
            id: item.id, name: item.name, barcode: enhancedItem.barcode || barcode,
            price: enhancedItem.unit_price || enhancedItem.sale_rate || enhancedItem.last_sale_rate || 0,
            stock: stockLevel?.current_quantity || 0,
            category: item.category?.name, unit: enhancedItem.unit || 'pcs'
          };
        }
      }
      if (!product) {
        toast.error(t('pos.messages.productNotFound', { barcode, defaultValue: `Product not found: ${barcode}` }));
        return;
      }
      const affectsInventory = selectedBillType?.affects_inventory ?? true;
      if (affectsInventory && product.stock === 0) {
        toast.error(t('pos.messages.outOfStock', { name: product.name, defaultValue: `${product.name} is out of stock` }));
        return;
      }
      addToCart(product, 1);
      toast.success(t('pos.messages.addedToCart', { name: product.name, defaultValue: `Added ${product.name}` }));
    } catch (error: any) {
      console.error('Barcode scan error:', error);
      toast.error('Failed to process barcode');
    }
  };

  const addToCart = (product: BarcodeProduct, quantity: number) => {
    const existingIdx = cartItems.findIndex(item => item.item_id === product.id);
    const affectsInventory = selectedBillType?.affects_inventory ?? true;

    if (existingIdx >= 0) {
      const newQty = cartItems[existingIdx].quantity + quantity;
      if (!affectsInventory || newQty <= product.stock) {
        updateCartItemQuantity(cartItems[existingIdx].id, newQty);
      } else {
        toast.warning(t('pos.messages.limitedStock', { count: product.stock, defaultValue: `Only ${product.stock} available` }));
      }
    } else {
      const newItem: CartItem = {
        id: Math.random().toString(36).substr(2, 9),
        item_id: product.id, name: product.name, quantity,
        unit_price: product.price, line_total: product.price * quantity,
        available_stock: product.stock, sku: product.sku,
        barcode: product.barcode, category: product.category,
        unit: product.unit || 'pcs'
      };
      setCartItems(prev => [...prev, newItem]);
    }
    // Clear search after adding
    setSearchQuery('');
    setSearchResults([]);
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

  // ─── Payment ───
  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: `Receipt-${completedTransaction?.transaction_number}`,
    onAfterPrint: () => toast.success('Receipt printed successfully')
  });

  const handlePaymentComplete = async (paymentData: {
    payment_method: 'cash' | 'card' | 'digital';
    payment_amount: number;
    change_amount: number;
    customer_name?: string;
    customer_phone?: string;
    notes?: string;
    profit_discount: number;
    price_discount: number;
  }) => {
    const totalDiscount = paymentData.profit_discount + paymentData.price_discount;
    const netTotal = Math.max(0, total - totalDiscount);

    try {
      if (!selectedBillType) { toast.error('No bill type selected'); return; }

      const transaction = await createPOSTransaction({
        ...paymentData,
        items: cartItems, subtotal: discountedSubtotal, tax_amount: taxAmount,
        discount_amount: totalDiscount + discountAmount, total_amount: netTotal,
        cashier_id: profile?.id || 'unknown',
        customer_name: selectedCustomer?.name || paymentData.customer_name || "",
        customer_phone: selectedCustomer?.phone || paymentData.customer_phone || "",
        notes: paymentData.notes || "",
        bill_type: selectedBillType
      });

      if (isCreditSale && selectedCustomer && selectedBillType.affects_accounting) {
        await updateCustomerBalanceForSale(selectedCustomer.id, netTotal);
        toast.info(`Credit added to ${selectedCustomer.name}'s account`);
      }

      setCompletedTransaction(transaction);
      setCartItems([]);
      setIsPaymentModalOpen(false);
      resetBillState();

      // Clear dashboard cache to ensure metrics reflect new sale
      clearDashboardCache();

      toast.success('Transaction completed!');

      if (settings?.auto_print_receipt) {
        setTimeout(() => handlePrint(), 500);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to process payment');
      throw error;
    }
  };

  const resetBillState = () => {
    if (!selectedBillType) {
      const defaultType = billTypes.find(t => t.is_default && t.active) || billTypes[0];
      setSelectedBillType(defaultType);
    }
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

  // ─── Loading / Error ───
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text={t('pos.loading', 'Loading POS system...')} />
      </div>
    );
  }
  if (!settings) {
    return (
      <div className="text-center py-12">
        <Settings className="w-16 h-16 text-foreground-muted/40 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground-muted mb-2">POS Settings Required</h3>
        <p className="text-foreground-muted/70">Please configure POS settings to continue</p>
      </div>
    );
  }

  // ─── RENDER ───
  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* ─── Top Toolbar ─── */}
      <div className="flex items-center gap-2 mb-3 flex-shrink-0">
        {/* Bill Type Badge */}
        {selectedBillType && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (billTypes.length < 2) return;
              const idx = billTypes.findIndex(t => t.id === selectedBillType.id);
              setSelectedBillType(billTypes[(idx + 1) % billTypes.length]);
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border whitespace-nowrap ${!selectedBillType.affects_inventory
              ? 'bg-warning-500/20 text-warning-400 border-warning-500/50'
              : 'bg-success-500/20 text-success-400 border-success-500/50'
              }`}
          >
            {selectedBillType.name}
          </motion.button>
        )}

        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-muted/50" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder={t('pos.terminal.searchPlaceholder', 'Search products or scan barcode...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchQuery.trim()) {
                handleBarcodeScan(searchQuery.trim());
                setSearchQuery('');
              }
            }}
            className="w-full pl-11 pr-4 py-3 bg-card border border-border/50 rounded-xl focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all text-foreground placeholder-foreground-muted/40 text-base"
            autoFocus
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <LoadingSpinner size="sm" color="primary" />
            </div>
          )}
        </div>

        {/* Scanner Toggle */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsScannerOpen(!isScannerOpen)}
          className={`p-3 rounded-xl transition-all border ${isScannerOpen
            ? 'bg-success-500/20 text-success-400 border-success-500/50'
            : 'bg-card text-foreground-muted border-border/50 hover:border-primary-500/50'
            }`}
          title="Toggle Camera Scanner"
        >
          {isScannerOpen ? <Camera className="w-5 h-5" /> : <Scan className="w-5 h-5" />}
        </motion.button>

        {/* Quick Actions */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsVendorModalOpen(true)}
          className="p-3 rounded-xl bg-card text-foreground-muted border border-border/50 hover:border-primary-500/50 transition-all"
          title="Vendors (F12)"
        >
          <Building2 className="w-5 h-5" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowShortcuts(!showShortcuts)}
          className="p-3 rounded-xl bg-card text-foreground-muted border border-border/50 hover:border-primary-500/50 transition-all"
          title="Keyboard Shortcuts"
        >
          <Keyboard className="w-5 h-5" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={startNewTransaction}
          className="p-3 rounded-xl bg-primary-600 text-white border border-primary-500 hover:bg-primary-700 transition-all"
          title="New Transaction"
        >
          <RotateCcw className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Bill Type Warning */}
      <AnimatePresence>
        {selectedBillType && (!selectedBillType.affects_inventory || !selectedBillType.affects_accounting) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 p-3 rounded-xl bg-warning-500/10 border border-warning-500/30 flex items-center gap-2 text-sm flex-shrink-0"
          >
            <FileText className="w-4 h-4 text-warning-400 flex-shrink-0" />
            <span className="text-warning-400 font-medium">{selectedBillType.name}:</span>
            <span className="text-warning-300/70 truncate">{selectedBillType.description || 'May not affect inventory/financial records.'}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Camera Scanner Panel (collapsible) */}
      <AnimatePresence>
        {isScannerOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 flex-shrink-0 overflow-hidden"
          >
            <EnhancedBarcodeScanner
              onScan={handleBarcodeScan}
              isActive={isScannerOpen}
              onToggle={() => setIsScannerOpen(!isScannerOpen)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Two-Panel Layout ─── */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* ─── LEFT: Product Grid ─── */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Search Results / Product Grid */}
          <div className="flex-1 overflow-y-auto pr-1">
            {searchQuery.trim() ? (
              // Search results
              <AnimatePresence mode="wait">
                {searchResults.length === 0 && !isSearching ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center h-full text-center py-16"
                  >
                    <Package className="w-16 h-16 text-foreground-muted/20 mb-4" />
                    <p className="text-foreground-muted font-medium">No products found</p>
                    <p className="text-foreground-muted/50 text-sm mt-1">Try a different search term or scan a barcode</p>
                  </motion.div>
                ) : (
                  <div className="grid grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3">
                    {searchResults.map((product, index) => (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.03 }}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => product.stock > 0 && addToCart(product, 1)}
                        className={`relative p-4 rounded-xl border transition-all cursor-pointer group ${product.stock === 0
                          ? 'bg-muted/20 border-border/30 opacity-60 cursor-not-allowed'
                          : 'bg-card border-border/50 hover:border-primary-500/50 hover:shadow-md'
                          }`}
                      >
                        {/* Product Name */}
                        <h4 className="text-foreground font-semibold text-sm truncate mb-1">
                          {product.name}
                        </h4>

                        {/* Category */}
                        {product.category && (
                          <span className="text-foreground-muted/50 text-xs">{product.category}</span>
                        )}

                        {/* Price + Stock Row */}
                        <div className="flex items-end justify-between mt-3">
                          <span className="text-primary-400 font-bold text-lg">
                            {formatCurrency(product.price)}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${product.stock === 0
                            ? 'bg-error-500/20 text-error-400'
                            : product.stock <= 5
                              ? 'bg-warning-500/20 text-warning-400'
                              : 'bg-success-500/20 text-success-400'
                            }`}>
                            {product.stock} {t('common.inStock', 'in stock')}
                          </span>
                        </div>

                        {/* Add overlay */}
                        {product.stock > 0 && (
                          <div className="absolute inset-0 rounded-xl bg-primary-500/0 group-hover:bg-primary-500/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <div className="bg-primary-600 text-white rounded-full p-2 shadow-lg">
                              <Plus className="w-5 h-5" />
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>
            ) : (
              // Empty State — prompt to search
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="p-4 rounded-2xl bg-muted/20 mb-5">
                  <Search className="w-12 h-12 text-foreground-muted/30" />
                </div>
                <p className="text-foreground-muted font-medium text-lg mb-1">
                  {t('pos.terminal.readyToSell', 'Ready to sell')}
                </p>
                <p className="text-foreground-muted/50 text-sm max-w-xs">
                  Search for products by name, scan a barcode, or press Enter to look up an item
                </p>
                <div className="flex gap-4 mt-6 text-xs text-foreground-muted/40">
                  <span className="flex items-center gap-1"><Keyboard className="w-3 h-3" /> F5 New sale</span>
                  <span className="flex items-center gap-1"><Keyboard className="w-3 h-3" /> F9 Pay</span>
                  <span className="flex items-center gap-1"><Keyboard className="w-3 h-3" /> F8 Bill type</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── RIGHT: Cart Panel ─── */}
        <div className="w-[340px] xl:w-[380px] flex-shrink-0 flex flex-col bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
          {/* Cart Header */}
          <div className="p-4 border-b border-border/50 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary-500/20 text-primary-400">
                <CartIcon className="w-4 h-4" />
              </div>
              <span className="font-semibold text-foreground">
                {t('pos.cart.shoppingCart', 'Cart')}
              </span>
              {cartItems.length > 0 && (
                <span className="bg-primary-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {/* Credit Sale Toggle */}
              {selectedBillType?.affects_accounting && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setIsCreditSale(!isCreditSale);
                    if (!isCreditSale) setIsCustomerModalOpen(true);
                    else setSelectedCustomer(null);
                  }}
                  className={`p-1.5 rounded-lg transition-all ${isCreditSale
                    ? 'bg-accent-500/20 text-accent-400'
                    : 'text-foreground-muted/50 hover:text-foreground-muted'
                    }`}
                  title={isCreditSale ? 'Credit Sale Active' : 'Enable Credit Sale'}
                >
                  <CreditCard className="w-4 h-4" />
                </motion.button>
              )}
              {cartItems.length > 0 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsClearCartConfirmOpen(true)}
                  className="p-1.5 rounded-lg text-error-400/60 hover:text-error-400 hover:bg-error-500/10 transition-all"
                  title="Clear Cart"
                >
                  <Trash2 className="w-4 h-4" />
                </motion.button>
              )}
            </div>
          </div>

          {/* Customer Badge */}
          <AnimatePresence>
            {selectedCustomer && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="px-4 py-2 border-b border-border/50 bg-accent-500/5 flex items-center justify-between flex-shrink-0"
              >
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-3.5 h-3.5 text-accent-400" />
                  <span className="text-foreground font-medium truncate">{selectedCustomer.name}</span>
                  <span className="text-accent-400 text-xs">({formatCurrency(selectedCustomer.outstanding_balance)} due)</span>
                </div>
                <button
                  onClick={() => setIsCustomerModalOpen(true)}
                  className="text-xs text-foreground-muted hover:text-foreground"
                >
                  Change
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Cart Items (scrollable) */}
          <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center opacity-60">
                <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mb-4">
                  <div className="w-10 h-10 border-2 border-dashed border-foreground-muted/50 rounded-lg"></div>
                </div>
                <h3 className="text-foreground font-medium mb-1">{t('pos.cart.cartEmpty', 'Cart is empty')}</h3>
                <p className="text-sm text-foreground-muted max-w-[200px]">
                  {t('pos.cart.startScanning', 'Scan a barcode or search for products to add items')}
                </p>
              </div>
            ) : (
              <div className="p-3 space-y-2">
                <AnimatePresence initial={false}>
                  {cartItems.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 hover:border-primary-500/30 transition-all group shadow-sm"
                    >
                      {/* Item Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-foreground font-medium text-sm truncate">{item.name}</h4>
                        <span className="text-foreground-muted/60 text-xs">
                          {formatCurrency(item.unit_price)} / {item.unit || 'each'}
                        </span>
                      </div>

                      {/* Quantity Stepper */}
                      <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5 border border-border/30">
                        <button
                          onClick={() => updateCartItemQuantity(item.id, Math.max(1, item.quantity - 1))}
                          className="p-1.5 rounded-md text-foreground-muted hover:bg-white hover:text-primary-600 hover:shadow-sm transition-all"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-foreground font-bold text-sm min-w-[1.5rem] text-center tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => {
                            if (item.quantity < item.available_stock) {
                              updateCartItemQuantity(item.id, item.quantity + 1);
                            } else {
                              toast.warning(`Only ${item.available_stock} available`);
                            }
                          }}
                          disabled={item.quantity >= item.available_stock}
                          className="p-1.5 rounded-md text-foreground-muted hover:bg-white hover:text-primary-600 hover:shadow-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Line Total */}
                      <div className="text-right min-w-[70px]">
                        <div className="text-primary-500 font-bold text-sm tabular-nums">
                          {formatCurrency(item.line_total)}
                        </div>
                      </div>

                      {/* Remove */}
                      <button
                        onClick={() => removeCartItem(item.id)}
                        className="p-1.5 rounded-lg text-foreground-muted/40 hover:text-error-500 hover:bg-error-500/10 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Cart Summary + Charge Button (sticky bottom) */}
          <div className="border-t border-border/50 bg-muted/10 p-4 flex-shrink-0">
            {cartItems.length > 0 && (
              <>
                <div className="space-y-1.5 mb-4 text-sm">
                  <div className="flex justify-between text-foreground-muted">
                    <span>{t('pos.cart.subtotal', 'Subtotal')}</span>
                    <span className="text-foreground">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-foreground-muted">
                    <span>{t('pos.cart.tax', 'Tax')} ({(settings.tax_rate * 100).toFixed(1)}%)</span>
                    <span className="text-foreground">{formatCurrency(taxAmount)}</span>
                  </div>
                  <div className="border-t border-border/50 pt-2 flex justify-between items-center">
                    <span className="font-semibold text-foreground text-base">{t('pos.cart.total', 'Total')}</span>
                    <span className="font-bold text-primary-400 text-xl">{formatCurrency(total)}</span>
                  </div>
                </div>
              </>
            )}

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setIsPaymentModalOpen(true)}
              disabled={cartItems.length === 0}
              className={`w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all ${cartItems.length > 0
                ? 'bg-success-600 hover:bg-success-700 text-white shadow-lg shadow-success-600/20'
                : 'bg-muted/30 text-foreground-muted/40 cursor-not-allowed'
                }`}
            >
              <Receipt className="w-5 h-5" />
              {cartItems.length > 0
                ? `${t('pos.terminal.charge', 'Charge')} ${formatCurrency(total)}`
                : t('pos.terminal.addItemsToStart', 'Add items to start')
              }
            </motion.button>
          </div>
        </div>
      </div>

      {/* ─── Modals ─── */}
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

      <VendorListModal
        isOpen={isVendorModalOpen}
        onClose={() => setIsVendorModalOpen(false)}
        mode="view"
      />

      <CustomerSelector
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSelectCustomer={(customer) => {
          setSelectedCustomer(customer);
          setIsCreditSale(true);
        }}
      />

      <ConfirmDialog
        isOpen={isClearCartConfirmOpen}
        title={t('pos.cart.clearTitle', 'Clear Cart')}
        message={t('pos.messages.clearCartConfirm', 'Are you sure you want to clear the cart?')}
        confirmText={t('common.clear', 'Clear')}
        variant="danger"
        onConfirm={() => { setCartItems([]); setIsClearCartConfirmOpen(false); toast.info('Cart cleared'); }}
        onCancel={() => setIsClearCartConfirmOpen(false)}
      />

      {/* Keyboard Shortcuts Modal */}
      <AnimatePresence>
        {showShortcuts && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setShowShortcuts(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-card rounded-2xl border border-border/50 p-6 max-w-md shadow-xl"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Keyboard className="w-5 h-5 text-primary-400" />
                Keyboard Shortcuts
              </h3>
              <div className="space-y-2">
                {POS_SHORTCUTS.map(shortcut => (
                  <div key={shortcut.key} className="flex items-center justify-between py-2 border-b border-border/30">
                    <span className="text-foreground-muted">{shortcut.description}</span>
                    <span className="px-2 py-1 rounded bg-muted text-primary-500 font-mono text-sm">{shortcut.key}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transaction Complete Modal */}
      <AnimatePresence>
        {completedTransaction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-card rounded-2xl border border-border/50 shadow-xl p-6 max-w-md w-full text-center"
            >
              <div className="p-3 rounded-full bg-success-500/20 text-success-400 w-fit mx-auto mb-4">
                <Receipt className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Transaction Complete!</h3>
              <p className="text-foreground-muted mb-4">#{completedTransaction.transaction_number}</p>

              <div className="bg-muted/50 rounded-lg p-4 mb-6">
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
                  <Printer className="w-4 h-4" /> Print
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={startNewTransaction}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" /> New Sale
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
    </div>
  );
}