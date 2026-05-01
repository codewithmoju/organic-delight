import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Package, Plus, Minus, Barcode } from 'lucide-react';
import { searchProducts } from '../../lib/api/pos';
import { BarcodeProduct } from '../../lib/types';
import { formatCurrency } from '../../lib/utils/notifications';
import LoadingSpinner from '../ui/LoadingSpinner';

interface ProductSearchProps {
  onAddToCart: (product: BarcodeProduct, quantity: number) => void;
  className?: string;
}

export default function ProductSearch({ onAddToCart, className = '' }: ProductSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<BarcodeProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedQuantities, setSelectedQuantities] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
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

  const handleAddToCart = (product: BarcodeProduct) => {
    const quantity = selectedQuantities[product.id] || 1;
    onAddToCart(product, quantity);
    setSelectedQuantities(prev => ({ ...prev, [product.id]: 1 }));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setSelectedQuantities(prev => ({ ...prev, [productId]: Math.max(1, quantity) }));
  };

  return (
    <div className={`bg-card border border-border/50 rounded-2xl overflow-hidden ${className}`}>
      {/* Search Header */}
      <div className="p-4 sm:p-6 border-b border-border/50">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 rounded-lg bg-primary-500/20 text-primary-400">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-foreground">Product Search</h3>
            <p className="text-foreground-muted text-xs sm:text-sm">Search and add products manually</p>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4 w-4 sm:h-5 sm:w-5 text-foreground-muted/50" />
          </div>
          <input
            type="text"
            placeholder="Search products by name or barcode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-foreground placeholder-foreground-muted/50 text-sm sm:text-base"
          />
          {isSearching && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <LoadingSpinner size="sm" color="primary" />
            </div>
          )}
        </div>
      </div>

      {/* Search Results */}
      <div className="max-h-80 sm:max-h-96 overflow-y-auto custom-scrollbar">
        <AnimatePresence>
          {searchResults.length === 0 && searchQuery && !isSearching ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-6 text-center"
            >
              <Package className="w-10 h-10 sm:w-12 sm:h-12 text-foreground-muted/30 mx-auto mb-3" />
              <p className="text-foreground-muted font-medium">No products found</p>
              <p className="text-foreground-muted/60 text-sm mt-1">Try a different search term</p>
            </motion.div>
          ) : (
            <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
              {searchResults.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-muted/20 border border-border/50 hover:border-primary-500/30 hover:bg-muted/40 transition-all duration-200"
                >
                  <div className="flex-1 min-w-0 mr-3">
                    <h4 className="text-foreground font-medium text-sm truncate">{product.name}</h4>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-1">
                      <span className="text-primary-400 font-semibold text-sm">
                        {formatCurrency(product.price)}
                      </span>
                      <span className={`text-xs font-medium ${
                        product.stock === 0
                          ? 'text-error-400'
                          : product.stock <= 5
                            ? 'text-warning-400'
                            : 'text-success-400'
                      }`}>
                        {product.stock} in stock
                      </span>
                      {product.category && (
                        <span className="text-foreground-muted/60 text-xs hidden sm:inline">
                          {product.category}
                        </span>
                      )}
                    </div>
                    {product.barcode && (
                      <div className="flex items-center text-foreground-muted/50 text-xs mt-1">
                        <Barcode className="w-3 h-3 mr-1 flex-shrink-0" />
                        <span className="truncate">{product.barcode}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Quantity Selector */}
                    <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5 border border-border/30">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => updateQuantity(product.id, (selectedQuantities[product.id] || 1) - 1)}
                        disabled={(selectedQuantities[product.id] || 1) <= 1}
                        className="p-1.5 rounded-md text-foreground-muted hover:bg-card hover:text-primary-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3 h-3" />
                      </motion.button>

                      <span className="text-foreground font-bold text-sm min-w-[1.5rem] text-center tabular-nums">
                        {selectedQuantities[product.id] || 1}
                      </span>

                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => updateQuantity(product.id, (selectedQuantities[product.id] || 1) + 1)}
                        disabled={(selectedQuantities[product.id] || 1) >= product.stock}
                        className="p-1.5 rounded-md text-foreground-muted hover:bg-card hover:text-primary-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3 h-3" />
                      </motion.button>
                    </div>

                    {/* Add to Cart Button */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleAddToCart(product)}
                      disabled={product.stock === 0}
                      className={`px-3 py-2 rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 whitespace-nowrap ${
                        product.stock === 0
                          ? 'bg-muted/30 text-foreground-muted/50 cursor-not-allowed'
                          : 'bg-primary-500/20 text-primary-400 hover:bg-primary-500/30 border border-primary-500/50'
                      }`}
                    >
                      {product.stock === 0 ? 'Out of Stock' : 'Add'}
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Quick Add Section */}
      {searchQuery && searchResults.length === 0 && !isSearching && (
        <div className="p-4 border-t border-border/50">
          <div className="bg-muted/30 rounded-xl p-4 text-center">
            <Package className="w-8 h-8 text-foreground-muted/40 mx-auto mb-2" />
            <p className="text-foreground-muted text-sm mb-3">
              Product not found in inventory
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-secondary text-sm"
              onClick={() => {
                window.open(`/inventory/items?name=${encodeURIComponent(searchQuery)}`, '_blank');
              }}
            >
              Add New Product
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
}
