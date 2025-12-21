import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, Package, Calendar, LayoutGrid, List, AlertTriangle, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { getItems, createItem, updateItem, deleteItem } from '../../lib/api/items';
import { getCategories } from '../../lib/api/categories';
import { createItemWithInitialStock } from '../../lib/api/enhancedItems';
import { updateLowStockThreshold } from '../../lib/api/lowStock';
import { Category, EnhancedItem } from '../../lib/types';
import MultiStepItemForm from '../../components/inventory/MultiStepItemForm';
import ItemForm from '../../components/inventory/ItemForm';
import AnimatedCard from '../../components/ui/AnimatedCard';
import SearchInput from '../../components/ui/SearchInput';
import { formatCurrency, formatDate } from '../../lib/utils/notifications';
import { usePagination } from '../../lib/hooks/usePagination';
import PaginationControls from '../../components/ui/PaginationControls';
import ContextualLoader from '../../components/ui/ContextualLoader';

export default function Items() {
  const [items, setItems] = useState<EnhancedItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<EnhancedItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedItem, setSelectedItem] = useState<EnhancedItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'analysis'>('grid');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [editingThreshold, setEditingThreshold] = useState<string | null>(null);
  const [newThresholdValue, setNewThresholdValue] = useState<number>(10);

  const [useMultiStepForm] = useState(true);

  const pagination = usePagination({
    data: filteredItems,
    defaultItemsPerPage: viewMode === 'grid' ? 20 : 50
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterItems();
  }, [items, searchQuery, selectedCategory, showLowStockOnly]);

  async function loadData() {
    setIsLoading(true);
    try {
      const [itemsData, categoriesData] = await Promise.all([
        getItems(),
        getCategories(),
      ]);
      setItems(itemsData.items || itemsData);
      setCategories(categoriesData);
    } catch (error) {
      toast.error('Failed to load data');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  function filterItems() {
    let filtered = items;

    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.barcode?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(item => item.category_id === selectedCategory);
    }

    if (showLowStockOnly) {
      filtered = filtered.filter(item => (item.current_quantity || 0) <= (item.low_stock_threshold || 10));
    }

    setFilteredItems(filtered);
  }

  const handleUpdateThreshold = async (itemId: string) => {
    try {
      await updateLowStockThreshold(itemId, newThresholdValue);
      toast.success('Threshold updated');
      setEditingThreshold(null);
      await loadData();
    } catch (error) {
      toast.error('Failed to update threshold');
    }
  };

  async function handleSubmit(data: {
    name: string;
    description: string;
    category_id: string;
    unit_price?: number;
    barcode?: string;
    sku?: string;
    supplier?: string;
    location?: string;
    reorder_point?: number;
    created_by: string;
  }, initialStock?: number) {
    try {
      console.log('Creating/updating item:', data);
      if (selectedItem) {
        await updateItem(selectedItem.id, data);
      } else if (useMultiStepForm && initialStock !== undefined) {
        await createItemWithInitialStock(data as any, initialStock);
      } else {
        await createItem(data);
      }
      console.log('Item operation successful, reloading data...');
      await loadData();
      setIsFormOpen(false);
      setSelectedItem(null);
    } catch (error) {
      throw error;
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this item? Items with transaction history will be archived instead of permanently deleted.')) return;

    try {
      await deleteItem(id);
      await loadData();
      toast.success('Item processed successfully');
    } catch (error: any) {
      toast.error('Failed to process item');
      console.error(error);
    }
  }

  if (isFormOpen) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gradient">
            {selectedItem ? 'Edit Item' : 'Add New Item'}
          </h1>
          <p className="text-gray-400 mt-2">
            {selectedItem ? 'Update item information' : 'Create a new inventory item'}
          </p>
        </div>

        <AnimatedCard>
          <div className="p-6">
            {selectedItem ? (
              <ItemForm
                initialData={selectedItem}
                categories={categories}
                onSubmit={(data: any) => handleSubmit(data)}
                onCancel={() => {
                  setIsFormOpen(false);
                  setSelectedItem(null);
                }}
              />
            ) : (
              <MultiStepItemForm
                categories={categories}
                onSubmit={(data: any) => handleSubmit(data, data.total_stock)}
                onCancel={() => {
                  setIsFormOpen(false);
                  setSelectedItem(null);
                }}
              />
            )}
          </div>
        </AnimatedCard>
      </motion.div>
    );
  }

  return (
    <div className="relative">
      <ContextualLoader
        isLoading={isLoading}
        context="items"
        variant="overlay"
      />

      <div className="space-y-6">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-gradient">Inventory Manager</h1>
            <p className="text-gray-400 text-sm mt-1">
              Unified view for item management, stock analysis, and low-stock alerts.
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setSelectedItem(null);
              setIsFormOpen(true);
            }}
            className="btn-primary flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add New Item
          </motion.button>
        </motion.div>

        {/* Filters and View Controls */}
        <AnimatedCard delay={0.1}>
          <div className="p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-2">
                <SearchInput
                  placeholder="Search by name, SKU, or barcode..."
                  value={searchQuery}
                  onChange={setSearchQuery}
                  className="w-full"
                />
              </div>

              <div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full input-dark"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex bg-dark-900 rounded-xl p-1 border border-dark-700/50">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-primary-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    title="Grid View"
                  >
                    <LayoutGrid className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('analysis')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'analysis' ? 'bg-primary-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    title="Stock Analysis View"
                  >
                    <List className="w-5 h-5" />
                  </button>
                </div>

                <button
                  onClick={() => setShowLowStockOnly(!showLowStockOnly)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${showLowStockOnly ? 'bg-error-500/20 border-error-500 text-error-400' : 'bg-dark-900 border-dark-700/50 text-gray-400 hover:text-white'}`}
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium whitespace-nowrap">Low Stock</span>
                </button>
              </div>
            </div>
          </div>
        </AnimatedCard>

        {/* View Content */}
        {viewMode === 'grid' ? (
          <motion.div
            layout
            data-tour="items-grid"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
          >
            <AnimatePresence>
              {pagination.paginatedData.map((item: any, index) => (
                <motion.div
                  key={item.id}
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
                  <div className={`absolute top-4 right-4 w-3 h-3 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.5)] ${(item.current_quantity || 0) === 0
                    ? 'bg-error-500 shadow-error-500/50'
                    : (item.current_quantity || 0) <= (item.low_stock_threshold || 10)
                      ? 'bg-warning-500 shadow-warning-500/50'
                      : 'bg-success-500 shadow-success-500/50'
                    }`} />

                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-semibold text-white group-hover:text-primary-300 transition-colors duration-200 truncate">
                          {item.name}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-400 mt-1 truncate">
                          {item.category?.name || 'Uncategorized'}
                        </p>
                      </div>
                    </div>

                    <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                      {item.description}
                    </p>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-sm">Current Stock</span>
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold ${(item.current_quantity || 0) === 0
                            ? 'text-error-400'
                            : (item.current_quantity || 0) <= (item.low_stock_threshold || 10)
                              ? 'text-warning-400'
                              : 'text-success-400'
                            }`}>
                            {item.current_quantity || 0}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-sm">Sale Price</span>
                        <span className="text-white font-semibold">
                          {formatCurrency(item.unit_price || item.last_sale_rate || 0)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-sm">Avg. Cost</span>
                        <span className="text-gray-300 font-medium">
                          {formatCurrency(item.average_unit_cost || 0)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between border-t border-dark-700/50 pt-2">
                        <span className="text-gray-400 text-xs">Total Position</span>
                        <span className="text-primary-400 font-bold">
                          {formatCurrency(item.total_value || 0)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <div className="text-[10px] text-gray-500">
                          SKU ID: <span className="text-gray-400">{item.sku || 'N/A'}</span>
                        </div>
                        {item.barcode && (
                          <div className="text-[10px] text-gray-500 text-right">
                            Tag: <span className="text-gray-400">{item.barcode}</span>
                          </div>
                        )}
                      </div>

                      {item.last_transaction_date && (
                        <div className="pt-1">
                          <div className="flex items-center text-[10px] text-gray-500">
                            <Calendar className="w-2.5 h-2.5 mr-1" />
                            Active: {formatDate(item.last_transaction_date)}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Quick Threshold Edit */}
                    <div className={`mt-3 p-2 rounded-lg bg-dark-900/50 border border-dark-700/30 transition-all ${editingThreshold === item.id ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden group-hover:h-auto group-hover:opacity-100'}`}>
                      {editingThreshold === item.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={newThresholdValue}
                            onChange={(e) => setNewThresholdValue(parseInt(e.target.value))}
                            className="input-dark py-1 px-2 text-xs flex-1"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          />
                          <button
                            onClick={(e) => { e.stopPropagation(); handleUpdateThreshold(item.id); }}
                            className="bg-primary-500 text-white p-1 rounded hover:bg-primary-600 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingThreshold(item.id);
                            setNewThresholdValue(item.low_stock_threshold || 10);
                          }}
                          className="w-full flex items-center justify-between text-[10px] text-gray-400 hover:text-white"
                        >
                          <span className="flex items-center gap-1">
                            <Settings className="w-3 h-3" />
                            Threshold: {item.low_stock_threshold || 10}
                          </span>
                          <span className="text-primary-400 hover:underline">Edit</span>
                        </button>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedItem(item);
                          setIsFormOpen(true);
                        }}
                        className="p-2 rounded-lg bg-primary-500/20 text-primary-400 hover:bg-primary-500/30 transition-colors duration-200"
                        title="Edit Details"
                      >
                        <Pencil className="h-4 w-4" />
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                        className="p-2 rounded-lg bg-error-500/20 text-error-400 hover:bg-error-500/30 transition-colors duration-200"
                        title="Delete Product"
                      >
                        <Trash2 className="h-4 w-4" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <AnimatedCard>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-dark-900 border-b border-dark-700/50">
                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Product Info</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">Stock</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Avg. Cost</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Selling</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Valuation</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-700/30">
                  {pagination.paginatedData.map((item: any) => (
                    <tr
                      key={item.id}
                      className="hover:bg-dark-700/20 transition-colors cursor-pointer group"
                      onClick={() => {
                        setSelectedItem(item);
                        setIsFormOpen(true);
                      }}
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-white font-medium group-hover:text-primary-400 transition-colors">{item.name}</span>
                          <span className="text-[10px] text-gray-500 uppercase tracking-tight">SKU: {item.sku || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-400 text-sm">{item.category?.name || 'Uncategorized'}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-lg font-bold ${(item.current_quantity || 0) <= (item.low_stock_threshold || 10)
                          ? 'text-warning-400'
                          : 'text-white'
                          }`}>
                          {item.current_quantity || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-gray-300 font-medium">
                        {formatCurrency(item.average_unit_cost || 0)}
                      </td>
                      <td className="px-6 py-4 text-right text-white font-semibold">
                        {formatCurrency(item.unit_price || item.last_sale_rate || 0)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-primary-400 font-bold">{formatCurrency(item.total_value || 0)}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className={`inline-flex px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${(item.current_quantity || 0) === 0
                          ? 'bg-error-500/10 text-error-400'
                          : (item.current_quantity || 0) <= (item.low_stock_threshold || 10)
                            ? 'bg-warning-500/10 text-warning-400'
                            : 'bg-success-500/10 text-success-400'
                          }`}>
                          {(item.current_quantity || 0) === 0 ? 'Out of Stock' : (item.current_quantity || 0) <= (item.low_stock_threshold || 10) ? 'Low Stock' : 'Good'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AnimatedCard>
        )}

        {/* Pagination */}
        {filteredItems.length > 0 && (
          <AnimatedCard delay={0.2}>
            <div className="p-4 sm:p-6">
              <PaginationControls
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={pagination.goToPage}
                hasNextPage={pagination.hasNextPage}
                hasPrevPage={pagination.hasPrevPage}
                startIndex={pagination.startIndex}
                endIndex={pagination.endIndex}
                totalItems={pagination.totalItems}
              />
            </div>
          </AnimatedCard>
        )}

        {/* Empty state */}
        {filteredItems.length === 0 && !isLoading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12 sm:py-16 px-4"
          >
            <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-400 mb-2">No items found</h3>
            <p className="text-gray-500 mb-6 text-sm sm:text-base">
              {searchQuery || selectedCategory
                ? 'Try adjusting your search or filter criteria'
                : 'Get started by adding your first item'
              }
            </p>
            {!searchQuery && !selectedCategory && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsFormOpen(true)}
                className="btn-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Item
              </motion.button>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}