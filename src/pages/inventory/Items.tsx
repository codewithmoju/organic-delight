import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, Search, Filter, Package, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { getItems, createItem, updateItem, deleteItem } from '../../lib/api/items';
import { getCategories } from '../../lib/api/categories';
import { Item, Category } from '../../lib/types';
import ItemForm from '../../components/inventory/ItemForm';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import AnimatedCard from '../../components/ui/AnimatedCard';
import SearchInput from '../../components/ui/SearchInput';
import { formatCurrency } from '../../lib/utils/notifications';

export default function Items() {
  const [items, setItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterItems();
  }, [items, searchQuery, selectedCategory]);

  async function loadData() {
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
        item.sku?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(item => item.category_id === selectedCategory);
    }

    setFilteredItems(filtered);
  }

  async function handleSubmit(data: Partial<Item>) {
    try {
      if (selectedItem) {
        await updateItem(selectedItem.id, data);
      } else {
        await createItem(data as Omit<Item, 'id'>);
      }
      await loadData();
      setIsFormOpen(false);
      setSelectedItem(null);
    } catch (error) {
      throw error;
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      await deleteItem(id);
      await loadData();
      toast.success('Item deleted successfully');
    } catch (error) {
      toast.error('Failed to delete item');
      console.error(error);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" text="Loading items..." />
      </div>
    );
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
            <ItemForm
              initialData={selectedItem || undefined}
              categories={categories}
              onSubmit={handleSubmit}
              onCancel={() => {
                setIsFormOpen(false);
                setSelectedItem(null);
              }}
            />
          </div>
        </AnimatedCard>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-gradient">Inventory Items</h1>
          <p className="text-gray-400 mt-1">
            Manage your inventory items and stock levels
          </p>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={() => setIsFormOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Item
        </motion.button>
      </motion.div>

      {/* Filters */}
      <AnimatedCard delay={0.1}>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <SearchInput
                placeholder="Search items by name, description, or SKU..."
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
          </div>
        </div>
      </AnimatedCard>

      {/* Items Grid */}
      <motion.div 
        layout
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      >
        <AnimatePresence>
          {filteredItems.map((item, index) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -8, scale: 1.03 }}
              className="card-dark p-6 group cursor-pointer relative overflow-hidden"
            >
              {/* Background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-accent-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Stock status indicator */}
              <div className={`absolute top-4 right-4 w-3 h-3 rounded-full ${
                item.quantity === 0 
                  ? 'bg-error-500' 
                  : item.quantity <= item.reorder_point 
                    ? 'bg-warning-500' 
                    : 'bg-success-500'
              }`} />
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white group-hover:text-primary-300 transition-colors duration-200">
                      {item.name}
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">
                      {item.category?.name || 'Uncategorized'}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Stock</span>
                    <span className={`font-semibold ${
                      item.quantity === 0 
                        ? 'text-error-400' 
                        : item.quantity <= item.reorder_point 
                          ? 'text-warning-400' 
                          : 'text-success-400'
                    }`}>
                      {item.quantity} {item.unit}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Price</span>
                    <span className="text-white font-semibold">
                      {formatCurrency(item.unit_price, item.currency)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Total Value</span>
                    <span className="text-primary-400 font-semibold">
                      {formatCurrency(item.quantity * item.unit_price, item.currency)}
                    </span>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex items-center justify-end gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setSelectedItem(item);
                      setIsFormOpen(true);
                    }}
                    className="p-2 rounded-lg bg-primary-500/20 text-primary-400 hover:bg-primary-500/30 transition-colors duration-200"
                  >
                    <Pencil className="h-4 w-4" />
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleDelete(item.id)}
                    className="p-2 rounded-lg bg-error-500/20 text-error-400 hover:bg-error-500/30 transition-colors duration-200"
                  >
                    <Trash2 className="h-4 w-4" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Empty state */}
      {filteredItems.length === 0 && !isLoading && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-16"
        >
          <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">No items found</h3>
          <p className="text-gray-500 mb-6">
            {searchQuery || selectedCategory 
              ? 'Try adjusting your search or filter criteria'
              : 'Get started by adding your first inventory item'
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
  );
}