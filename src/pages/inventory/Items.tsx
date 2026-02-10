import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, Package, Calendar, LayoutGrid, List, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { getItems, createItem, updateItem, deleteItem, reconcileAllItemsStock } from '../../lib/api/items';
import { getCategories } from '../../lib/api/categories';
import { createItemWithInitialStock } from '../../lib/api/enhancedItems';

import { Category, EnhancedItem } from '../../lib/types';
import QuickItemForm from '../../components/inventory/QuickItemForm';
import ItemForm from '../../components/inventory/ItemForm';
import AnimatedCard from '../../components/ui/AnimatedCard';
import SearchInput from '../../components/ui/SearchInput';
import { formatCurrency, formatDate } from '../../lib/utils/notifications';
import { usePagination } from '../../lib/hooks/usePagination';
import PaginationControls from '../../components/ui/PaginationControls';
import { PageSkeleton, TableSkeleton } from '../../components/ui/SkeletonLoader';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

export default function Items() {
  const { t } = useTranslation();
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
  const [isSyncing, setIsSyncing] = useState(false);

  // Inline editing state for price
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [editingPriceValue, setEditingPriceValue] = useState<number>(0);



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



  const handleInlinePriceUpdate = async (itemId: string) => {
    const previousItems = [...items];
    setItems(prevItems => prevItems.map(item => item.id === itemId ? { ...item, unit_price: editingPriceValue } : item));
    setEditingPriceId(null);
    toast.success(t('items.messages.priceUpdated', 'Price updated!'));
    try {
      await updateItem(itemId, { unit_price: editingPriceValue });
    } catch (error: any) {
      setItems(previousItems);
      toast.error(t('items.messages.priceError', 'Failed to update price.'));
    }
  };

  async function handleSubmit(data: {
    name: string;
    description: string;
    category_id: string;
    unit?: string;
    unit_price?: number;
    barcode?: string;
    sku?: string;
    supplier?: string;
    location?: string;
    reorder_point?: number;
    created_by: string;
  }, initialStock?: number) {
    // --- Optimistic UI: Update state immediately ---
    const previousItems = [...items];
    const tempId = `temp-${Date.now()}`;
    const categoryData = categories.find(c => c.id === data.category_id);

    const optimisticItem: EnhancedItem = {
      id: selectedItem?.id || tempId,
      name: data.name,
      description: data.description,
      category_id: data.category_id,
      category: categoryData,
      unit: data.unit || 'pcs',
      unit_price: data.unit_price || 0,
      barcode: data.barcode,
      sku: data.sku,
      reorder_point: data.reorder_point || 10,
      current_quantity: initialStock ?? selectedItem?.current_quantity ?? 0,
      average_unit_cost: selectedItem?.average_unit_cost || 0,
      total_value: selectedItem?.total_value || 0,
      created_at: selectedItem?.created_at || new Date(),
      updated_at: new Date(),
      created_by: data.created_by,
    };

    if (selectedItem) {
      // Update existing item in state
      setItems(prevItems => prevItems.map(item => item.id === selectedItem.id ? { ...item, ...optimisticItem } : item));
      toast.success(t('items.messages.updateSuccess', 'Item updated!'));
    } else {
      // Add new item to state
      setItems(prevItems => [optimisticItem, ...prevItems]);
      toast.success(t('items.messages.createSuccess', 'Item created!'));
    }
    setIsFormOpen(false);
    setSelectedItem(null);

    // --- Perform the actual API call in the background ---
    try {
      let createdItem;
      if (selectedItem) {
        await updateItem(selectedItem.id, data);
      } else if (initialStock !== undefined) {
        createdItem = await createItemWithInitialStock(data as any, initialStock);
      } else {
        createdItem = await createItem(data);
      }

      // Update the temporary item with the real ID after successful creation
      if (createdItem && !selectedItem) {
        setItems(prevItems => prevItems.map(item => item.id === tempId ? { ...item, id: createdItem.id } : item));
      }
      // Reload data in the background to sync with server (e.g., for stock levels)
      loadData();
    } catch (error: any) {
      // --- Rollback: Revert to previous state on error ---
      setItems(previousItems);
      toast.error(error.message || t('items.messages.error', 'Operation failed. Changes reverted.'));
      throw error;
    }
  }

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const handleDeleteClick = (id: string) => {
    setItemToDelete(id);
    setIsDeleteConfirmOpen(true);
  };

  const cancelDelete = () => {
    setIsDeleteConfirmOpen(false);
    setItemToDelete(null);
  };

  async function confirmDelete() {
    if (!itemToDelete) return;

    const id = itemToDelete;
    setIsDeleteConfirmOpen(false);
    setItemToDelete(null);

    // --- Optimistic UI: Remove item from state immediately ---
    const previousItems = [...items];
    setItems(prevItems => prevItems.filter(item => item.id !== id));
    toast.success(t('items.messages.deleteSuccess'));

    // --- Perform the actual API call in the background ---
    try {
      await deleteItem(id);
    } catch (error: any) {
      // --- Rollback: Revert to previous state on error ---
      setItems(previousItems);
      toast.error(t('items.messages.deleteError') + ': ' + (error.message || 'Unknown error'));
      console.error(error);
    }
  }

  if (isFormOpen) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-600 dark:from-primary-400 dark:to-indigo-400">
              {selectedItem ? t('items.editItem') : t('items.addItem')}
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              {selectedItem ? t('items.updateItem') : t('items.createItem')}
            </p>
          </div>
          <button
            onClick={() => { setIsFormOpen(false); setSelectedItem(null); }}
            className="p-3 bg-secondary/50 rounded-full hover:bg-secondary transition-colors"
            title="Close"
          >
            <Plus className="w-6 h-6 rotate-45 text-muted-foreground" />
          </button>
        </div>

        <div className="card-theme p-8 rounded-[2.5rem] shadow-2xl backdrop-blur-xl border border-white/20 dark:border-white/10 relative" style={{ contain: 'none' }}>
          {/* Decorative Background Elements - Clipped */}
          <div className="absolute inset-0 rounded-[2.5rem] overflow-hidden pointer-events-none">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -ml-16 -mb-16" />
          </div>

          <div className="relative z-10">
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
              <QuickItemForm
                categories={categories}
                onSubmit={(data: any) => handleSubmit(data, data.initial_stock)}
                onCancel={() => {
                  setIsFormOpen(false);
                  setSelectedItem(null);
                }}
              />
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="relative">
      <div className="space-y-6">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-gradient">{t('navigation.inventoryManager')}</h1>
            <p className="text-gray-400 text-sm mt-1">
              {t('items.subtitle')}
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
            {t('items.addItem')}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={async () => {
              setIsSyncing(true);
              const toastId = toast.loading('Syncing stock levels...');
              try {
                const result = await reconcileAllItemsStock();
                toast.success(`Synced ${result.updated} items successfully!`, { id: toastId });
                loadData();
              } catch (error) {
                toast.error('Failed to sync stock levels', { id: toastId });
              } finally {
                setIsSyncing(false);
              }
            }}
            disabled={isSyncing}
            className="flex items-center justify-center gap-2 p-3 bg-secondary/50 rounded-2xl hover:bg-secondary transition-colors text-muted-foreground border border-border/50"
            title="Reconcile stock levels with transaction history"
          >
            <Calendar className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span className="text-sm font-semibold hidden sm:inline">Sync Stock</span>
          </motion.button>
        </motion.div>

        {/* Filters and View Controls - Redesigned */}
        <div className="card-theme p-2 rounded-[2rem] sticky top-4 z-30 shadow-xl backdrop-blur-md border border-white/20 bg-white/50 dark:bg-black/50">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4 p-2">
            <div className="w-full lg:w-1/3 relative">
              <SearchInput
                placeholder={t('items.searchPlaceholder')}
                value={searchQuery}
                onChange={setSearchQuery}
                className="w-full h-12 bg-white/80 dark:bg-dark-800/80 border-0 rounded-2xl shadow-sm focus:ring-2 focus:ring-primary-500/50"
              />
            </div>

            <div className="flex items-center gap-3 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 px-2 lg:px-0 scrollbar-hide">
              {/* Category Filter */}
              <div className="relative min-w-[200px]">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full h-12 pl-4 pr-10 appearance-none bg-white/80 dark:bg-dark-800/80 rounded-2xl border-0 shadow-sm focus:ring-2 focus:ring-primary-500/50 text-sm font-medium cursor-pointer"
                >
                  <option value="">{t('items.allCategories')}</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                  <List className="w-4 h-4" />
                </div>
              </div>

              <div className="h-8 w-px bg-border/50 mx-2 hidden lg:block" />

              {/* View Toggles */}
              <div className="flex bg-white/80 dark:bg-dark-800/80 rounded-2xl p-1 shadow-sm border border-white/10">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2.5 rounded-xl transition-all duration-300 ${viewMode === 'grid' ? 'bg-primary text-primary-foreground shadow-md scale-105' : 'text-muted-foreground hover:bg-secondary/50'}`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('analysis')}
                  className={`p-2.5 rounded-xl transition-all duration-300 ${viewMode === 'analysis' ? 'bg-primary text-primary-foreground shadow-md scale-105' : 'text-muted-foreground hover:bg-secondary/50'}`}
                  title="List View"
                >
                  <List className="w-5 h-5" />
                </button>
              </div>

              {/* Low Stock Toggle */}
              <button
                onClick={() => setShowLowStockOnly(!showLowStockOnly)}
                className={`flex items-center gap-2 px-4 h-12 rounded-2xl transition-all duration-300 shadow-sm border ${showLowStockOnly ? 'bg-warning-500/10 border-warning-500 text-warning-600 dark:text-warning-400' : 'bg-white/80 dark:bg-dark-800/80 border-transparent text-muted-foreground hover:bg-secondary/50'}`}
              >
                <AlertTriangle className={`w-5 h-5 ${showLowStockOnly ? 'animate-pulse' : ''}`} />
                <span className="text-sm font-semibold whitespace-nowrap">{t('common.lowStock')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* View Content */}
        {isLoading ? (
          viewMode === 'grid' ? <PageSkeleton /> : <TableSkeleton rows={8} />
        ) : viewMode === 'grid' ? (
          <motion.div
            layout
            data-tour="items-grid"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            <AnimatePresence>
              {pagination.paginatedData.map((item: any, index) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  whileHover={{ y: -8, transition: { duration: 0.2 } }}
                  className="card-theme p-6 rounded-[2.5rem] group cursor-pointer relative overflow-hidden flex flex-col justify-between h-full border border-border/50 hover:border-primary/30 hover:shadow-2xl transition-all duration-300"
                  onClick={() => {
                    setSelectedItem(item);
                    setIsFormOpen(true);
                  }}
                >
                  {/* Decorative Background Gradient */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:bg-primary/10 transition-colors" />

                  {/* Stock Status Badge (Absolute Top Right) */}
                  <div className={`absolute top-5 right-5 z-20`}>
                    <span className={`flex h-3 w-3 relative`}>
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${(item.current_quantity || 0) === 0 ? 'bg-error-400' : (item.current_quantity || 0) <= (item.low_stock_threshold || 10) ? 'bg-warning-400' : 'bg-success-400'}`}></span>
                      <span className={`relative inline-flex rounded-full h-3 w-3 ${(item.current_quantity || 0) === 0 ? 'bg-error-500' : (item.current_quantity || 0) <= (item.low_stock_threshold || 10) ? 'bg-warning-500' : 'bg-success-500'}`}></span>
                    </span>
                  </div>


                  <div className="relative z-10 mb-6">
                    <div className="flex flex-col gap-1 pr-8">
                      <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors duration-200 truncate leading-tight">
                        {item.name}
                      </h3>
                      <p className="text-sm font-medium text-muted-foreground truncate bg-secondary/30 self-start px-2 py-0.5 rounded-lg border border-border/50">
                        {item.category?.name || t('items.uncategorized')}
                      </p>
                    </div>

                    <p className="text-muted-foreground/80 text-sm mt-4 line-clamp-2 h-10 leading-relaxed">
                      {item.description || "No description provided."}
                    </p>
                  </div>

                  <div className="space-y-4 relative z-10">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-secondary/30 rounded-2xl p-3 border border-border/50">
                        <span className="text-xs text-muted-foreground block mb-1 font-medium tracking-wide uppercase">{t('items.currentStock')}</span>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-lg font-bold ${(item.current_quantity || 0) === 0 ? 'text-error-500' : (item.current_quantity || 0) <= (item.low_stock_threshold || 10) ? 'text-warning-500' : 'text-success-500'}`}>
                            {item.current_quantity || 0}
                          </span>
                          <span className="text-xs text-muted-foreground font-medium">{item.unit || 'pcs'}</span>
                        </div>
                      </div>
                      <div className="bg-secondary/30 rounded-2xl p-3 border border-border/50">
                        <span className="text-xs text-muted-foreground block mb-1 font-medium tracking-wide uppercase">{t('items.salePrice')}</span>
                        <span className="text-lg font-bold text-foreground">
                          {formatCurrency(item.unit_price || item.sale_rate || item.last_sale_rate || 0)}
                        </span>
                      </div>
                    </div>

                    {/* Quick SKU/Tag Info */}
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1">
                      <span className="font-mono bg-secondary/50 px-1.5 py-0.5 rounded border border-border/30">ID: {item.sku || 'N/A'}</span>
                      {item.last_transaction_date && (
                        <span className="flex items-center gap-1 opacity-70">
                          <Calendar className="w-3 h-3" />
                          {formatDate(item.last_transaction_date)}
                        </span>
                      )}
                    </div>

                    {/* Hover Actions */}
                    <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedItem(item);
                          setIsFormOpen(true);
                        }}
                        className="h-9 w-9 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90"
                        title="Edit Details"
                      >
                        <Pencil className="h-4 w-4" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => { e.stopPropagation(); handleDeleteClick(item.id); }}
                        className="h-9 w-9 rounded-full bg-destructive text-destructive-foreground shadow-lg flex items-center justify-center hover:bg-destructive/90"
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
          <div className="card-theme rounded-[2.5rem] overflow-hidden border border-border/50 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-secondary/30 border-b border-white/10 dark:border-white/5">
                    <th className="px-6 py-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('items.table.productInfo')}</th>
                    <th className="px-6 py-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('items.table.category')}</th>
                    <th className="px-6 py-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">{t('items.table.stock')}</th>
                    <th className="px-6 py-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">{t('items.table.avgCost')}</th>
                    <th className="px-6 py-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">{t('items.table.selling')}</th>
                    <th className="px-6 py-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">{t('items.table.valuation')}</th>
                    <th className="px-6 py-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">{t('items.table.status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {pagination.paginatedData.map((item: any) => (
                    <tr
                      key={item.id}
                      className="hover:bg-secondary/20 transition-colors cursor-pointer group"
                      onClick={() => {
                        setSelectedItem(item);
                        setIsFormOpen(true);
                      }}
                    >
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="text-foreground font-semibold group-hover:text-primary transition-colors text-base">{item.name}</span>
                          <span className="text-xs text-muted-foreground uppercase tracking-tight font-mono mt-0.5">SKU: {item.sku || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-sm text-foreground/80 bg-secondary/30 px-2 py-1 rounded-md border border-border/50">
                          {item.category?.name || 'Uncategorized'}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className={`text-base font-bold ${(item.current_quantity || 0) <= (item.low_stock_threshold || 10)
                          ? 'text-warning-500'
                          : 'text-foreground'
                          }`}>
                          {item.current_quantity || 0} <span className="text-xs text-muted-foreground font-normal ml-1">{item.unit || 'pcs'}</span>
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right text-muted-foreground font-medium">
                        {formatCurrency(item.average_unit_cost || 0)}
                      </td>
                      <td
                        className="px-6 py-5 text-right"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingPriceId(item.id);
                          setEditingPriceValue(item.unit_price || 0);
                        }}
                      >
                        {editingPriceId === item.id ? (
                          <input
                            type="number"
                            step="0.01"
                            value={editingPriceValue}
                            onChange={(e) => setEditingPriceValue(parseFloat(e.target.value) || 0)}
                            onBlur={() => handleInlinePriceUpdate(item.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleInlinePriceUpdate(item.id);
                              if (e.key === 'Escape') setEditingPriceId(null);
                            }}
                            className="input-dark w-24 text-right py-1 px-2 text-sm bg-white dark:bg-black border border-primary ring-2 ring-primary/20 rounded-md"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <span className="text-foreground font-bold cursor-pointer hover:text-primary transition-colors">
                            {formatCurrency(item.unit_price || item.last_sale_rate || 0)}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <span className="text-primary font-bold">{formatCurrency(item.total_value || 0)}</span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <div className={`inline-flex px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${(item.current_quantity || 0) === 0
                          ? 'bg-error-500/10 text-error-600 border-error-200 dark:text-error-400 dark:border-error-900'
                          : (item.current_quantity || 0) <= (item.low_stock_threshold || 10)
                            ? 'bg-warning-500/10 text-warning-600 border-warning-200 dark:text-warning-400 dark:border-warning-900'
                            : 'bg-success-500/10 text-success-600 border-success-200 dark:text-success-400 dark:border-success-900'
                          }`}>
                          {(item.current_quantity || 0) === 0 ? t('items.status.outOfStock') : (item.current_quantity || 0) <= (item.low_stock_threshold || 10) ? t('items.status.lowStock') : t('items.status.good')}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
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
            <h3 className="text-lg sm:text-xl font-semibold text-gray-400 mb-2">{t('items.noItems')}</h3>
            <p className="text-gray-500 mb-6 text-sm sm:text-base">
              {searchQuery || selectedCategory
                ? t('items.noItemsDescription')
                : t('items.noItemsEmpty')
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
                {t('items.addFirstItem')}
              </motion.button>
            )}
          </motion.div>
        )}
      </div>
      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        title={t('items.messages.deleteTitle', 'Delete Item')}
        message={t('items.messages.deleteConfirm', 'Are you sure you want to delete this item? Items with transaction history will be archived instead of permanently deleted.')}
        confirmText={t('common.delete', 'Delete')}
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
}