import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Scan, Plus, Receipt } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { CartItem, BarcodeProduct } from '../../lib/types';
import { mobileBarcodeService } from '../../lib/capacitor/barcode';
import { hapticsService } from '../../lib/capacitor/haptics';
import { notificationService } from '../../lib/capacitor/notifications';
import MobileBarcodeScanner from './MobileBarcodeScanner';
import { getProductByBarcode } from '../../lib/api/pos';
import { toast } from 'sonner';

export default function MobileOptimizedPOS() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const subtotal = cartItems.reduce((sum, item) => sum + item.line_total, 0);
  const taxAmount = subtotal * 0.08; // 8% tax
  const total = subtotal + taxAmount;

  const handleBarcodeScan = async (barcode: string) => {
    setIsLoading(true);
    
    try {
      const product = await getProductByBarcode(barcode);
      
      if (!product) {
        await hapticsService.errorFeedback();
        toast.error(`Product not found for barcode: ${barcode}`);
        return;
      }
      
      if (product.stock === 0) {
        await hapticsService.warningFeedback();
        toast.error(`${product.name} is out of stock`);
        return;
      }
      
      addToCart(product, 1);
      await hapticsService.successFeedback();
      toast.success(`Added ${product.name} to cart`);
    } catch (error: any) {
      console.error('Barcode scan error:', error);
      await hapticsService.errorFeedback();
      toast.error('Failed to process barcode');
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = (product: BarcodeProduct, quantity: number) => {
    const existingItemIndex = cartItems.findIndex(item => item.item_id === product.id);
    
    if (existingItemIndex >= 0) {
      // Update existing item
      const newQuantity = cartItems[existingItemIndex].quantity + quantity;
      if (newQuantity <= product.stock) {
        updateCartItemQuantity(cartItems[existingItemIndex].id, newQuantity);
      } else {
        toast.warning(`Only ${product.stock} items available in stock`);
      }
    } else {
      // Add new item
      const newCartItem: CartItem = {
        id: generateCartItemId(),
        item_id: product.id,
        name: product.name,
        quantity,
        unit_price: product.price,
        line_total: product.price * quantity,
        available_stock: product.stock,
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

  const generateCartItemId = () => {
    return Math.random().toString(36).substr(2, 9);
  };

  return (
    <div className="space-y-6">
      {/* Mobile POS Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gradient mb-2">Point of Sale</h1>
        <p className="text-gray-400">Mobile checkout system</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsScannerOpen(true)}
          className="btn-primary p-6 rounded-xl flex flex-col items-center gap-3"
          style={{ touchAction: 'manipulation' }}
        >
          <Scan className="w-8 h-8" />
          <span className="font-semibold">Scan Barcode</span>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.95 }}
          className="btn-secondary p-6 rounded-xl flex flex-col items-center gap-3"
          style={{ touchAction: 'manipulation' }}
        >
          <Plus className="w-8 h-8" />
          <span className="font-semibold">Add Manual</span>
        </motion.button>
      </div>

      {/* Shopping Cart */}
      <div className="card-dark p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <ShoppingCart className="w-5 h-5 mr-2" />
            Cart ({cartItems.length})
          </h3>
        </div>

        {cartItems.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-600" />
            <p>Cart is empty</p>
            <p className="text-sm mt-1">Scan items to add them</p>
          </div>
        ) : (
          <div className="space-y-3">
            {cartItems.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center justify-between p-4 bg-dark-800/30 rounded-lg border border-dark-700/30"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-medium truncate">{item.name}</h4>
                  <p className="text-gray-400 text-sm">
                    ${item.unit_price.toFixed(2)} each
                  </p>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => updateCartItemQuantity(item.id, Math.max(1, item.quantity - 1))}
                      className="p-2 rounded bg-dark-600/50 text-gray-300"
                      style={{ touchAction: 'manipulation', minWidth: '44px', minHeight: '44px' }}
                    >
                      -
                    </motion.button>
                    
                    <span className="text-white font-semibold min-w-[2rem] text-center">
                      {item.quantity}
                    </span>
                    
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                      className="p-2 rounded bg-dark-600/50 text-gray-300"
                      style={{ touchAction: 'manipulation', minWidth: '44px', minHeight: '44px' }}
                    >
                      +
                    </motion.button>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-primary-400 font-semibold">
                      ${item.line_total.toFixed(2)}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Cart Summary */}
        {cartItems.length > 0 && (
          <div className="mt-6 pt-6 border-t border-dark-700/50">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-300">Subtotal:</span>
                <span className="text-white font-semibold">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Tax (8%):</span>
                <span className="text-white font-semibold">${taxAmount.toFixed(2)}</span>
              </div>
              <div className="border-t border-dark-700/50 pt-2">
                <div className="flex justify-between">
                  <span className="text-lg font-semibold text-white">Total:</span>
                  <span className="text-xl font-bold text-primary-400">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              className="w-full mt-6 btn-primary py-4 text-lg font-semibold flex items-center justify-center gap-2"
              style={{ touchAction: 'manipulation' }}
            >
              <Receipt className="w-5 h-5" />
              Checkout
            </motion.button>
          </div>
        )}
      </div>

      {/* Mobile Barcode Scanner */}
      <MobileBarcodeScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleBarcodeScan}
      />
    </div>
  );
}