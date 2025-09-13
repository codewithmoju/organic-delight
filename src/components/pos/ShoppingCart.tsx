import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart as CartIcon, Plus, Minus, Trash2, Package, DollarSign, Calculator } from 'lucide-react';
import { CartItem } from '../../lib/types';
import { useCurrency } from '../../lib/hooks/useCurrency';
import { useCurrency } from '../../lib/hooks/useCurrency';

interface ShoppingCartProps {
  items: CartItem[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClearCart: () => void;
  subtotal: number;
  taxAmount: number;
  total: number;
  taxRate: number;
  className?: string;
}

export default function ShoppingCart({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  subtotal,
  taxAmount,
  total,
  taxRate,
  className = ''
}: ShoppingCartProps) {
  const { formatCurrency } = useCurrency();
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className={`card-dark ${className}`}>
      {/* Cart Header */}
      <div className="p-4 sm:p-6 border-b border-dark-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-primary-500/20 text-primary-400">
              <CartIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Shopping Cart</h3>
              <p className="text-gray-400 text-sm">
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsExpanded(!isExpanded)}
              className="btn-secondary px-3 py-2 text-sm"
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </motion.button>
            
            {items.length > 0 && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClearCart}
                className="p-2 rounded-lg bg-error-500/20 text-error-400 hover:bg-error-500/30 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* Cart Items */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="max-h-96 overflow-y-auto">
              {items.length === 0 ? (
                <div className="p-6 text-center">
                  <Package className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">Cart is empty</p>
                  <p className="text-gray-500 text-sm mt-1">
                    Scan or search for products to add them
                  </p>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  <AnimatePresence>
                    {items.map((item, index) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-3 rounded-lg bg-dark-800/30 border border-dark-700/30 hover:border-primary-500/30 transition-all duration-200"
                      >
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-medium truncate">{item.name}</h4>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-gray-400 text-sm">
                              {formatCurrency(item.unit_price)} each
                            </span>
                            {item.category && (
                              <span className="text-gray-500 text-xs">
                                {item.category}
                              </span>
                            )}
                          </div>
                          {item.barcode && (
                            <div className="text-gray-500 text-xs mt-1">
                              Barcode: {item.barcode}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          {/* Quantity Controls */}
                          <div className="flex items-center space-x-2">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                              className="p-1 rounded bg-dark-600/50 text-gray-300 hover:bg-dark-600/70 hover:text-white transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </motion.button>
                            
                            <span className="text-white font-semibold min-w-[2rem] text-center">
                              {item.quantity}
                            </span>
                            
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => {
                                if (item.quantity < item.available_stock) {
                                  onUpdateQuantity(item.id, item.quantity + 1);
                                } else {
                                  toast.warning(`Only ${item.available_stock} units available`);
                                }
                              }}
                              disabled={item.quantity >= item.available_stock}
                              className={`p-1 rounded transition-colors ${
                                item.quantity >= item.available_stock
                                  ? 'bg-gray-600/30 text-gray-500 cursor-not-allowed'
                                  : 'bg-dark-600/50 text-gray-300 hover:bg-dark-600/70 hover:text-white'
                              }`}
                            >
                              <Plus className="w-4 h-4" />
                            </motion.button>
                          </div>
                          
                          {/* Line Total */}
                          <div className="text-right min-w-[80px]">
                            <div className="text-primary-400 font-semibold">
                              {formatCurrency(item.line_total)}
                            </div>
                            {item.available_stock <= 5 && (
                              <div className="text-warning-400 text-xs">
                                {item.available_stock} left
                              </div>
                            )}
                          </div>
                          
                          {/* Remove Button */}
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => onRemoveItem(item.id)}
                            className="p-2 rounded-lg bg-error-500/20 text-error-400 hover:bg-error-500/30 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Summary */}
      {items.length > 0 && (
        <div className="p-4 sm:p-6 border-t border-dark-700/50 bg-dark-800/30">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Subtotal:</span>
              <span className="text-white font-semibold">{formatCurrency(subtotal)}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Tax ({(taxRate * 100).toFixed(1)}%):</span>
              <span className="text-white font-semibold">{formatCurrency(taxAmount)}</span>
            </div>
            
            <div className="border-t border-dark-700/50 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-white">Total:</span>
                <span className="text-xl font-bold text-primary-400">{formatCurrency(total)}</span>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-dark-700/50">
              <div className="text-center">
                <div className="text-primary-400 font-semibold">
                  {items.reduce((sum, item) => sum + item.quantity, 0)}
                </div>
                <div className="text-gray-400 text-xs">Total Items</div>
              </div>
              <div className="text-center">
                <div className="text-primary-400 font-semibold">
                  {formatCurrency(subtotal / items.reduce((sum, item) => sum + item.quantity, 0) || 0)}
                </div>
                <div className="text-gray-400 text-xs">Avg. Price</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}