import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, TrendingUp, TrendingDown, Calendar, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { useCurrency } from '../../lib/hooks/useCurrency';
import { getStockLevels } from '../../lib/api/dashboard';
import { StockLevel } from '../../lib/types';
import LoadingSpinner from '../ui/LoadingSpinner';
import AnimatedCard from '../ui/AnimatedCard';
import SearchInput from '../ui/SearchInput';
import { formatCurrency, formatDate } from '../../lib/utils/notifications';
import ContextualLoader from '../ui/ContextualLoader';

export default function StockLevelsView() {
  const { formatCurrency } = useCurrency();
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([]);
  const [filteredLevels, setFilteredLevels] = useState<StockLevel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'quantity' | 'value' | 'date'>('name');

  useEffect(() => {
    loadStockLevels();
  }, []);

  useEffect(() => {
    filterAndSortLevels();
  }, [stockLevels, searchQuery, sortBy]);

  async function loadStockLevels() {
    try {
      const levels = await getStockLevels();
      setStockLevels(levels);
    } catch (error) {
      toast.error('Failed to load stock levels');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  function filterAndSortLevels() {
    let filtered = stockLevels;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(level =>
        level.item?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        level.item?.category?.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.item?.name || '').localeCompare(b.item?.name || '');
        case 'quantity':
          return b.current_quantity - a.current_quantity;
        case 'value':
          return b.total_value - a.total_value;
        case 'date':
          const dateA = new Date(a.last_transaction_date.toDate ? a.last_transaction_date.toDate() : a.last_transaction_date);
          const dateB = new Date(b.last_transaction_date.toDate ? b.last_transaction_date.toDate() : b.last_transaction_date);
          return dateB.getTime() - dateA.getTime();
        default:
          return 0;
      }
    });

    setFilteredLevels(filtered);
  }

  return (
    <div className="relative">
      <ContextualLoader
        isLoading={isLoading}
        context="dashboard"
        variant="overlay"
      />
      
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gradient">Stock Levels</h1>
          <p className="text-gray-400 mt-1 text-sm sm:text-base">
            Real-time inventory levels calculated from transaction history
          </p>
        </div>
      </motion.div>

      {/* Filters */}
      <AnimatedCard delay={0.1}>
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <SearchInput
                placeholder="Search items by name or category..."
                value={searchQuery}
                onChange={setSearchQuery}
                className="w-full"
              />
            </div>
            
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full input-dark"
              >
                <option value="name">Sort by Name</option>
                <option value="quantity">Sort by Quantity</option>
                <option value="value">Sort by Total Value</option>
                <option value="date">Sort by Last Transaction</option>
              </select>
            </div>
          </div>
        </div>
      </AnimatedCard>

      {/* Stock Levels Grid */}
      <motion.div 
        layout
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
      >
        <AnimatePresence>
          {filteredLevels.map((level, index) => (
            <motion.div
              key={level.item_id}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -8, scale: 1.03 }}
              className="card-dark p-4 sm:p-6 group cursor-pointer relative overflow-hidden"
            >
              {/* Background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-accent-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Stock status indicator */}
              <div className={`absolute top-4 right-4 w-3 h-3 rounded-full ${
                level.current_quantity === 0 
                  ? 'bg-error-500' 
                  : level.current_quantity < 10 
                    ? 'bg-warning-500' 
                    : 'bg-success-500'
              }`} />
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold text-white group-hover:text-primary-300 transition-colors duration-200 truncate">
                      {level.item?.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-400 mt-1 truncate">
                      {level.item?.category?.name || 'Uncategorized'}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Current Stock</span>
                    <span className={`font-semibold text-lg ${
                      level.current_quantity === 0 
                        ? 'text-error-400' 
                        : level.current_quantity < 10 
                          ? 'text-warning-400' 
                          : 'text-success-400'
                    }`}>
                      {level.current_quantity}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Avg. Unit Cost</span>
                    <span className="text-white font-semibold">
                      {formatCurrency(level.average_unit_cost)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Total Value</span>
                    <span className="text-primary-400 font-semibold">
                      {formatCurrency(level.total_value)}
                    </span>
                  </div>
                  
                  <div className="pt-2 border-t border-dark-700/50">
                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar className="w-3 h-3 mr-1" />
                      Last updated: {formatDate(level.last_transaction_date)}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Empty state */}
      {filteredLevels.length === 0 && !isLoading && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12 sm:py-16 px-4"
        >
          <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg sm:text-xl font-semibold text-gray-400 mb-2">No stock data found</h3>
          <p className="text-gray-500 mb-6 text-sm sm:text-base">
            {searchQuery 
              ? 'Try adjusting your search criteria'
              : 'Stock levels will appear here after recording transactions'
            }
          </p>
        </motion.div>
      )}
    </div>
    </div>
  );
}