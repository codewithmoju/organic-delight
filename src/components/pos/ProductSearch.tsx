import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Package, Plus, Barcode } from 'lucide-react';
import { searchProducts } from '../../lib/api/pos';
import { BarcodeProduct } from '../../lib/types';
import { useCurrency } from '../../lib/hooks/useCurrency';
import LoadingSpinner from '../ui/LoadingSpinner';

interface ProductSearchProps {
  onAddToCart: (product: BarcodeProduct, quantity: number) => void;
  className?: string;
}

export default function ProductSearch({ onAddToCart, className = '' }: ProductSearchProps) {
  const { formatCurrency } = useCurrency();
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
    
    // Reset quantity for this product
    setSelectedQuantities(prev => ({ ...prev, [product.id]: 1 }));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setSelectedQuantities(prev => ({ ...prev, [productId]: Math.max(1, quantity) }));
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
            <p className="text-gray-400 text-sm">Search and add products manually</p>
          </div>
        </div>
        
        {/* Search Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search products by name, description, or barcode..."
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
                Try a different search term
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
                      <span className="text-primary-400 font-semibold">
                        {formatCurrency(product.price)}
                      </span>
                      <span className={`text-sm ${
                        product.stock === 0 
                          ? 'text-error-400' 
                          : product.stock <= 5 
                            ? 'text-warning-400' 
                            : 'text-success-400'
                      }`}>
                        {product.stock} in stock
                      </span>
                      {product.category && (
                        <span className="text-gray-500 text-xs">
                          {product.category}
                        </span>
                      )}
                    </div>
                    {product.barcode && (
                      <div className="flex items-center text-gray-500 text-xs mt-1">
                        <Barcode className="w-3 h-3 mr-1" />
                        {product.barcode}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {/* Quantity Selector */}
                    <div className="flex items-center space-x-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => updateQuantity(product.id, (selectedQuantities[product.id] || 1) - 1)}
                        disabled={(selectedQuantities[product.id] || 1) <= 1}
                        className="p-1 rounded bg-dark-600/50 text-gray-300 hover:bg-dark-600/70 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Minus className="w-3 h-3" />
                      </motion.button>
                      
                      <span className="text-white font-semibold min-w-[2rem] text-center">
                        {selectedQuantities[product.id] || 1}
                      </span>
                      
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => updateQuantity(product.id, (selectedQuantities[product.id] || 1) + 1)}
                        disabled={(selectedQuantities[product.id] || 1) >= product.stock}
                        className="p-1 rounded bg-dark-600/50 text-gray-300 hover:bg-dark-600/70 disabled:opacity-50 disabled:cursor-not-allowed"
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
                      className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                        product.stock === 0
                          ? 'bg-gray-600/30 text-gray-500 cursor-not-allowed'
                          : 'bg-primary-500/20 text-primary-400 hover:bg-primary-500/30 border border-primary-500/50'
                      }`}
                    >
                      {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
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
        <div className="p-4 border-t border-dark-700/50">
          <div className="bg-dark-800/50 rounded-lg p-4 text-center">
            <Package className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-400 text-sm mb-3">
              Product not found in inventory
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-secondary text-sm"
              onClick={() => {
                // Navigate to add new item with pre-filled search query
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