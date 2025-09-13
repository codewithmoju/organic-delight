import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Package, Plus, Barcode, Hash, ShoppingCart } from 'lucide-react';
import { searchProducts } from '../../lib/api/pos';
import { BarcodeProduct } from '../../lib/types';
import { formatCurrency } from '../../lib/utils/notifications';
import LoadingSpinner from '../ui/LoadingSpinner';

interface EnhancedProductSearchProps {
  onAddToCart: (product: BarcodeProduct, quantity: number) => void;
  className?: string;
}

export default function EnhancedProductSearch({ onAddToCart, className = '' }: EnhancedProductSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<BarcodeProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchMode, setSearchMode] = useState<'name' | 'id' | 'barcode'>('name');

  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [searchQuery, searchMode]);

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

  const handleQuickAdd = (product: BarcodeProduct) => {
    onAddToCart(product, 1);
    // Clear search after adding
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <div className={`card-dark ${className}`}>
      {/* Search Header */}
      <div className="p-4 sm:p-6 border-b border-dark-700/50">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 rounded-lg bg-accent-500/20 text-accent-400">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Product Search</h3>
            <p className="text-gray-400 text-sm">Find and add products to cart</p>
          </div>
        </div>
        
        {/* Search Mode Selector */}
        <div className="flex gap-2 mb-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSearchMode('name')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              searchMode === 'name'
                ? 'bg-primary-500/20 text-primary-400 border border-primary-500/50'
                : 'bg-dark-700/30 text-gray-400 hover:text-white'
            }`}
          >
            <Package className="w-4 h-4 inline mr-1" />
            Name
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSearchMode('id')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              searchMode === 'id'
                ? 'bg-primary-500/20 text-primary-400 border border-primary-500/50'
                : 'bg-dark-700/30 text-gray-400 hover:text-white'
            }`}
          >
            <Hash className="w-4 h-4 inline mr-1" />
            Product ID
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSearchMode('barcode')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              searchMode === 'barcode'
                ? 'bg-primary-500/20 text-primary-400 border border-primary-500/50'
                : 'bg-dark-700/30 text-gray-400 hover:text-white'
            }`}
          >
            <Barcode className="w-4 h-4 inline mr-1" />
            Barcode
          </motion.button>
        </div>
        
        {/* Search Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder={
              searchMode === 'name' ? 'Search by product name...' :
              searchMode === 'id' ? 'Enter product ID...' :
              'Enter barcode...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 input-dark"
          />
          {isSearching && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <LoadingSpinner size="sm" color="primary" />
            </div>
          )}
        </div>
      </div>

      {/* Search Results */}
      <div className="max-h-96 overflow-y-auto">
        <AnimatePresence>
          {searchResults.length === 0 && searchQuery && !isSearching ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-6 text-center"
            >
              <Package className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No products found</p>
              <p className="text-gray-500 text-sm mt-1">
                Try searching by {searchMode === 'name' ? 'product ID or barcode' : 'product name'}
              </p>
            </motion.div>
          ) : (
            <div className="p-4 space-y-3">
              {searchResults.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 rounded-lg bg-dark-800/30 border border-dark-700/30 hover:border-primary-500/30 transition-all duration-200"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-medium truncate">{product.name}</h4>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-primary-400 font-semibold text-lg">
                        {formatCurrency(product.price)}
                      </span>
                      <span className={`text-sm px-2 py-1 rounded-full ${
                        product.stock === 0 
                          ? 'bg-error-500/20 text-error-400' 
                          : product.stock <= 5 
                            ? 'bg-warning-500/20 text-warning-400' 
                            : 'bg-success-500/20 text-success-400'
                      }`}>
                        {product.stock} in stock
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                      {product.category && (
                        <span>{product.category}</span>
                      )}
                      {product.barcode && (
                        <span className="flex items-center">
                          <Barcode className="w-3 h-3 mr-1" />
                          {product.barcode}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleQuickAdd(product)}
                    disabled={product.stock === 0}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                      product.stock === 0
                        ? 'bg-gray-600/30 text-gray-500 cursor-not-allowed'
                        : 'bg-primary-500/20 text-primary-400 hover:bg-primary-500/30 border border-primary-500/50'
                    }`}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                  </motion.button>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Quick Actions */}
      {!searchQuery && (
        <div className="p-4 border-t border-dark-700/50">
          <div className="text-center">
            <p className="text-gray-400 text-sm mb-3">
              Search for products by name, ID, or barcode to add them to the cart
            </p>
            <div className="flex justify-center space-x-2 text-xs text-gray-500">
              <span>💡 Tip: Use barcode scanner for faster checkout</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}