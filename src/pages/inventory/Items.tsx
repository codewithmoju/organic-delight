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
import EmptyState from '../../components/ui/EmptyState';
import { readScopedRaw, readScopedJSON, writeScopedJSON } from '../../lib/utils/storageScope';

const ITEMS_CACHE_KEY = 'inventory_items_cache';
const CATEGORIES_CACHE_KEY = 'inventory_categories_cache';

export default function Items() {
  const { t } = useTranslation();

  // Initialize from cache to provide instant feedback
  const [items, setItems] = useState<EnhancedItem[]>(() => {
    try {
      const cached = readScopedRaw(ITEMS_CACHE_KEY, ITEMS_CACHE_KEY);
      if (cached) {
        return JSON.parse(cached, (key, value) => {
          if (['created_at', 'updated_at', 'last_transaction_date'].includes(key)) {
            return new Date(value);
          }
          return value;
        });
      }
    } catch (e) {
      console.error('Failed to parse items cache', e);
    }
    return [];
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const cached = readScopedRaw(CATEGORIES_CACHE_KEY, CATEGORIES_CACHE_KEY);
      if (cached) {
        return JSON.parse(cached, (key, value) => {
          if (['created_at', 'updated_at'].includes(key)) return new Date(value);
          return value;
        });
      }
    } catch (e) {
      console.error('Failed to parse categories cache', e);
    }
    return [];
  });

  const [filteredItems, setFilteredItems] = useState<EnhancedItem[]>([]);
  // Use cache presence to determine initial loading state
  const [isLoading, setIsLoading] = useState(() => readScopedRaw(ITEMS_CACHE_KEY, ITEMS_CACHE_KEY) == null);
  const [selectedItem, setSelectedItem] = useState<EnhancedItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'analysis'>('grid');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  // Inline editing state for price
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [editingPriceValue, setEditingPriceValue] = useState<number>(0);



  const pagination = usePagination({
    data: filteredItems,
    defaultItemsPerPage: viewMode === 'grid' ? 20 : 50
  });

  useEffect(() => {
    // If we have cached data, update silently. Otherwise show loading.
    const hasCache = items.length > 0;
    loadData(!hasCache);
  }, []);

  // Automatic Stock Synchronization
  useEffect(() => {
    const autoSyncStock = async () => {
      const LAST_SYNC_KEY = 'stock_last_sync_timestamp';
      const SYNC_COOLDOWN = 60 * 60 * 1000; // 1 hour

      const lastSync = readScopedJSON<number>(LAST_SYNC_KEY, 0, undefined, LAST_SYNC_KEY);
      const now = Date.now();

      if (!lastSync || now - lastSync > SYNC_COOLDOWN) {
        console.log('Running automatic stock synchronization...');
        try {
          const result = await reconcileAllItemsStock();
          if (result.updated > 0) {
            toast.success(`Automatically synced ${result.updated} items`, { duration: 3000 });
            loadData(false);
          }
          writeScopedJSON(LAST_SYNC_KEY, now);
        } catch (error) {
          console.error('Auto sync failed:', error);
        }
      }
    };

    autoSyncStock();
  }, []);

  useEffect(() => {
    filterItems();
  }, [items, searchQuery, selectedCategory, showLowStockOnly]);

  async function loadData(showLoading = true) {
    if (showLoading) setIsLoading(true);
    try {
      const [itemsData, categoriesData] = await Promise.all([
        getItems(),
        getCategories(),
      ]);

      const loadedItems = itemsData.items || itemsData;
      setItems(loadedItems);
      setCategories(categoriesData);

      // Update cache
      writeScopedJSON(ITEMS_CACHE_KEY, loadedItems);
      writeScopedJSON(CATEGORIES_CACHE_KEY, categoriesData);

    } catch (error) {
      toast.error('Failed to load data');
      console.error(error);
    } finally {
      if (showLoading) setIsLoading(false);
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
    setItems(prevItems => prevItems.map(item => item.id === itemId ? {
      ...item,
      selling_price: editingPriceValue,
      unit_price: editingPriceValue,
      sale_rate: editingPriceValue,
    } : item));
    setEditingPriceId(null);
    toast.success(t('items.messages.priceUpdated', 'Price updated!'));
    try {
      await updateItem(itemId, { selling_price: editingPriceValue, unit_price: editingPriceValue, sale_rate: editingPriceValue });
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
    base_price?: number;
    selling_price?: number;
    barcode?: string;
    sku?: string;
    supplier?: string;
    location?: string;
    reorder_point?: number;
    created_by: string;
  }, initialStock?: number) {
    const previousItems = [...items];
    const categoryData = categories.find(c => c.id === data.category_id);
    const isEditing = !!selectedItem;

    const optimisticItem: EnhancedItem = {
      id: selectedItem?.id || `temp-${Date.now()}`,
      name: data.name,
      description: data.description,
      category_id: data.category_id,
      category: categoryData,
      unit: data.unit || 'pcs',
      base_price: data.base_price || 0,
      selling_price: data.selling_price || data.unit_price || 0,
      unit_price: data.selling_price || data.unit_price || 0,
      purchase_rate: data.base_price || 0,
      sale_rate: data.selling_price || data.unit_price || 0,
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

    if (isEditing) {
      // Keep optimistic updates only for edit flow.
      setItems(prevItems => prevItems.map(item => item.id === selectedItem.id ? { ...item, ...optimisticItem } : item));
      toast.success(t('items.messages.updateSuccess', 'Item updated!'));
      setIsFormOpen(false);
      setSelectedItem(null);
    }

    // Run API call and update UI only after successful create.
    try {
      let createdItem;
      if (isEditing && selectedItem) {
        await updateItem(selectedItem.id, data);
      } else if (initialStock !== undefined) {
        createdItem = await createItemWithInitialStock(data as any, initialStock);
      } else {
        createdItem = await createItem(data);
      }

      if (createdItem && !isEditing) {
        const normalizedCreatedItem: EnhancedItem = {
          ...(createdItem as EnhancedItem),
          category: categoryData,
          current_quantity: initialStock ?? 0,
        };
        setItems(prevItems => [normalizedCreatedItem, ...prevItems]);
        setIsFormOpen(false);
        setSelectedItem(null);
        toast.success(t('items.messages.createSuccess', 'Item created!'));
      }

      // Reload data in the background to sync with server (e.g., for stock levels)
      loadData(false);
    } catch (error: any) {
      if (isEditing) {
        // Rollback optimistic edit state only when edit fails.
        setItems(previousItems);
      }
      toast.error(error.message || t('items.messages.error', 'Operation failed.'));
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
        <div className="mb-6 sm:mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {selectedItem ? t('items.editItem') : t('items.addItem')}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              {selectedItem ? t('items.updateItem') : t('items.createItem')}
            </p>
          </div>
          <button
            onClick={() => { setIsFormOpen(false); setSelectedItem(null); }}
            className="p-2.5 bg-secondary/50 rounded-full hover:bg-secondary transition-colors flex-shrink-0"
            title="Close"
          >
            <Plus className="w-5 h-5 rotate-45 text-muted-foreground" />
          </button>
        </div>

        <div className="card-theme p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-[2.5rem] shadow-xl border border-border/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/3 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none" />

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
                onCategoryCreated={(newCat) => {
                  setCategories(prev => [...prev, newCat]);
                  writeScopedJSON(CATEGORIES_CACHE_KEY, [...categories, newCat]);
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
          className="app-page-header"
        >
          <div>
            <h1 className="app-page-title">{t('navigation.inventoryManager')}</h1>
            <p className="app-page-subtitle">
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

          {/* specific manual sync button removed in favor of auto-sync */}
        </motion.div>

        {/* Filters and View Controls - Redesigned */}
        <div className="app-toolbar-surface p-2 sticky top-4 z-30">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-3 p-2">
            <div className="w-full lg:w-1/3 relative">
              <SearchInput
                placeholder={t('items.searchPlaceholder')}
                value={searchQuery}
                onChange={setSearchQuery}
                className="w-full h-11 bg-background/70 border border-border/50 rounded-xl shadow-sm focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div className="flex items-center gap-2 w-full lg:w-auto flex-wrap">
              {/* Category Filter */}
              <div className="relative flex-1 min-w-[140px]">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full h-11 pl-3 pr-8 appearance-none bg-background/70 rounded-xl border border-border/50 shadow-sm focus:ring-2 focus:ring-primary/50 text-sm font-medium cursor-pointer text-foreground"
                >
                  <option value="">{t('items.allCategories')}</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                  <List className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* View Toggles */}
              <div className="flex bg-background/70 rounded-xl p-1 shadow-sm border border-border/50 flex-shrink-0">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all duration-200 ${viewMode === 'grid' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-secondary/50'}`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('analysis')}
                  className={`p-2 rounded-lg transition-all duration-200 ${viewMode === 'analysis' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-secondary/50'}`}
                  title="List View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              {/* Low Stock Toggle */}
              <button
                onClick={() => setShowLowStockOnly(!showLowStockOnly)}
                className={`flex items-center gap-1.5 px-3 h-11 rounded-xl transition-all duration-200 border flex-shrink-0 ${showLowStockOnly
                  ? 'bg-warning-500/10 border-warning-500/50 text-warning-600 dark:text-warning-400'
                  : 'bg-background/70 border-border/50 text-muted-foreground hover:bg-secondary/50'}`}
              >
                <AlertTriangle className={`w-4 h-4 ${showLowStockOnly ? 'animate-pulse' : ''}`} />
                <span className="text-xs font-semibold whitespace-nowrap">{t('common.lowStock', 'Low Stock')}</span>
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
            className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4"
          >
            <AnimatePresence>
              {pagination.paginatedData.map((item: any, index) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                  transition={{ duration: 0.3, delay: index * 0.04 }}
                  className="card-theme rounded-2xl sm:rounded-[2rem] group relative overflow-hidden flex flex-col border border-border/50 hover:border-primary/30 hover:shadow-xl transition-all duration-300"
                >
                  {/* Decorative gradient */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none group-hover:bg-primary/10 transition-colors" />

                  {/* Stock status dot */}
                  <div className="absolute top-3 right-3 z-20">
                    <span className="flex h-2.5 w-2.5 relative">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${(item.current_quantity || 0) === 0 ? 'bg-error-400' : (item.current_quantity || 0) <= (item.low_stock_threshold || 10) ? 'bg-warning-400' : 'bg-success-400'}`} />
                      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${(item.current_quantity || 0) === 0 ? 'bg-error-500' : (item.current_quantity || 0) <= (item.low_stock_threshold || 10) ? 'bg-warning-500' : 'bg-success-500'}`} />
                    </span>
                  </div>

                  {/* Tappable info area */}
                  <button
                    className="flex-1 text-left p-3 sm:p-4 pr-6"
                    onClick={() => { setSelectedItem(item); setIsFormOpen(true); }}
                  >
                    <h3 className="text-sm sm:text-base font-bold text-foreground group-hover:text-primary transition-colors truncate leading-tight mb-0.5">
                      {item.name}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate bg-secondary/30 self-start px-1.5 py-0.5 rounded-md border border-border/40 inline-block mb-2">
                      {item.category?.name || t('items.uncategorized')}
                    </p>

                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="bg-secondary/30 rounded-xl p-2 border border-border/40">
                        <span className="text-[10px] text-muted-foreground block font-medium uppercase tracking-wide">{t('items.currentStock', 'Stock')}</span>
                        <div className="flex items-baseline gap-1">
                          <span className={`text-sm font-bold ${(item.current_quantity || 0) === 0 ? 'text-error-500' : (item.current_quantity || 0) <= (item.low_stock_threshold || 10) ? 'text-warning-500' : 'text-success-500'}`}>
                            {item.current_quantity || 0}
                          </span>
                          <span className="text-[10px] text-muted-foreground">{item.unit || 'pcs'}</span>
                        </div>
                      </div>
                      <div className="bg-secondary/30 rounded-xl p-2 border border-border/40">
                        <span className="text-[10px] text-muted-foreground block font-medium uppercase tracking-wide">{t('items.salePrice', 'Price')}</span>
                        <span className="text-sm font-bold text-foreground">
                          {formatCurrency(item.selling_price || item.unit_price || item.sale_rate || 0)}
                        </span>
                        {(item.selling_price || item.unit_price || item.sale_rate || 0) < (item.base_price || item.purchase_rate || 0) && (
                          <div className="text-[10px] text-warning-500 mt-1">Below base</div>
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Always-visible action row */}
                  <div className="flex items-center justify-between px-3 pb-3 gap-2">
                    <span className="text-[10px] font-mono text-muted-foreground/60 bg-secondary/40 px-1.5 py-0.5 rounded border border-border/30 truncate max-w-[80px]">
                      {item.sku || 'N/A'}
                    </span>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedItem(item); setIsFormOpen(true); }}
                        className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all"
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteClick(item.id); }}
                        className="h-8 w-8 rounded-xl bg-error-500/10 text-error-500 flex items-center justify-center hover:bg-error-500 hover:text-white transition-all"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
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
                          setEditingPriceValue(item.selling_price || item.unit_price || 0);
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
                            className="w-20 text-right py-1 px-2 text-sm bg-background border border-primary ring-2 ring-primary/20 rounded-md text-foreground"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <span className="text-foreground font-bold cursor-pointer hover:text-primary transition-colors">
                            {formatCurrency(item.selling_price || item.unit_price || item.last_sale_rate || 0)}
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
          <EmptyState
            icon={Package}
            title={t('items.noItems')}
            description={searchQuery || selectedCategory
              ? t('items.noItemsDescription')
              : t('items.noItemsEmpty')
            }
            action={!searchQuery && !selectedCategory ? {
              label: t('items.addFirstItem'),
              onClick: () => setIsFormOpen(true)
            } : undefined}
            className="max-w-2xl mx-auto mt-4"
          />
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