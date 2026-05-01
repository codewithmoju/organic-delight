import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, FolderOpen, Package, Search, X, Undo2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../lib/api/categories';
import { Category } from '../../lib/types';
import InlineCategoryForm from '../../components/inventory/InlineCategoryForm';
import CategorySkeleton from '../../components/inventory/CategorySkeleton';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

interface CategoryWithCount extends Category {
  itemCount?: number;
}

// Undo delete state
interface DeletedCategory {
  category: CategoryWithCount;
  timeoutId: ReturnType<typeof setTimeout>;
}

export default function Categories() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<CategoryWithCount[]>(() => {
    try {
      const cached = localStorage.getItem('inventory_categories_cache');
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
  const [isLoading, setIsLoading] = useState(() => !localStorage.getItem('inventory_categories_cache'));
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryWithCount | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletedCategory, setDeletedCategory] = useState<DeletedCategory | null>(null);
  const deletedCategoryRef = React.useRef<DeletedCategory | null>(null);

  // Sync ref with state
  useEffect(() => {
    deletedCategoryRef.current = deletedCategory;
  }, [deletedCategory]);

  // Handle cleanup on unmount
  useEffect(() => {
    return () => {
      if (deletedCategoryRef.current) {
        clearTimeout(deletedCategoryRef.current.timeoutId);
        // Execute pending delete
        deleteCategory(deletedCategoryRef.current.category.id).catch(console.error);
      }
    };
  }, []);

  // Delete confirmation state
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryWithCount | null>(null);


  // Filtered categories based on search
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const query = searchQuery.toLowerCase();
    return categories.filter(
      (cat) =>
        cat.name.toLowerCase().includes(query) ||
        cat.description?.toLowerCase().includes(query)
    );
  }, [categories, searchQuery]);

  useEffect(() => {
    const hasCache = categories.length > 0;
    loadData(!hasCache);
  }, []);

  async function loadData(showLoading = true) {
    if (showLoading) setIsLoading(true);
    try {
      // Intentional delay to show off the skeleton loading for a split second if data loads too fast
      // (Optional, but good for UX perception in demos)
      const data = await getCategories();
      const enrichedData = data.map(cat => ({ ...cat, itemCount: cat.item_count || 0 }));
      setCategories(enrichedData);
      localStorage.setItem('inventory_categories_cache', JSON.stringify(enrichedData));
    } catch (error) {
      toast.error(t('categories.messages.loadError', 'Failed to load categories'));
      console.error(error);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }

  // Optimistic create
  async function handleCreate(data: { name: string; description: string; color: string; created_by: string }) {
    // Optimistic: add immediately with temp ID
    const tempId = `temp-${Date.now()}`;
    const newCategory: CategoryWithCount = {
      id: tempId,
      name: data.name,
      description: data.description,
      color: data.color,
      created_by: data.created_by,
      created_at: new Date(),
      updated_at: new Date(),
      itemCount: 0
    };

    setCategories(prev => [newCategory, ...prev]);
    setIsAddFormOpen(false);

    try {
      const created = await createCategory(data);
      // Replace temp with real
      setCategories(prev =>
        prev.map(cat => cat.id === tempId ? { ...created, itemCount: 0 } : cat)
      );
      toast.success(t('categories.messages.createSuccess', 'Category created successfully'));
    } catch (error: any) {
      // Rollback
      setCategories(prev => prev.filter(cat => cat.id !== tempId));
      throw error;
    }
  }

  // Optimistic update - instant feedback
  async function handleUpdate(data: { name: string; description: string; color: string; created_by: string }) {
    if (!editingCategory) return;

    const originalCategory = { ...editingCategory };
    const categoryId = editingCategory.id;

    // Optimistic update - apply immediately
    setCategories(prev =>
      prev.map(cat =>
        cat.id === categoryId
          ? { ...cat, name: data.name, description: data.description, color: data.color }
          : cat
      )
    );
    setEditingCategory(null);
    toast.success(t('categories.messages.updateSuccess', 'Category updated'));

    try {
      await updateCategory(categoryId, {
        name: data.name,
        description: data.description,
        color: data.color
      });
    } catch (error: any) {
      // Rollback on error
      setCategories(prev =>
        prev.map(cat => (cat.id === categoryId ? originalCategory : cat))
      );
      toast.error(error.message || t('categories.messages.updateError', 'Failed to update'));
    }
  }

  // Handle delete click - open confirmation dialog
  const handleDeleteClick = (category: CategoryWithCount) => {
    // Check if category has items
    if ((category.itemCount || 0) > 0) {
      toast.error(t('categories.messages.hasItems', 'Cannot delete category with items. Move or delete items first.'));
      return;
    }
    setCategoryToDelete(category);
    setIsDeleteConfirmOpen(true);
  };

  // Confirm delete action
  const confirmDelete = () => {
    if (!categoryToDelete) return;

    const category = categoryToDelete;
    setIsDeleteConfirmOpen(false);
    setCategoryToDelete(null);

    // Cancel any existing undo
    if (deletedCategory) {
      clearTimeout(deletedCategory.timeoutId);
      // Actually delete the previous one
      deleteCategory(deletedCategory.category.id).catch(console.error);
    }

    // Optimistic remove
    setCategories(prev => prev.filter(cat => cat.id !== category.id));

    // Set up undo timeout (5 seconds)
    const timeoutId = setTimeout(() => {
      deleteCategory(category.id)
        .then(() => {
          setDeletedCategory(null);
        })
        .catch((err) => {
          // Restore on error
          setCategories(prev => [...prev, category]);
          toast.error(t('categories.messages.deleteError', 'Failed to delete category'));
          console.error(err);
        });
    }, 5000);

    setDeletedCategory({ category, timeoutId });

    // Show toast with undo
    toast(
      <div className="flex items-center justify-between gap-4">
        <span>{t('categories.messages.deleted', 'Category deleted')}</span>
        <button
          onClick={() => {
            clearTimeout(timeoutId);
            setCategories(prev => [...prev, category]);
            setDeletedCategory(null);
            toast.success(t('categories.messages.restored', 'Category restored'));
          }}
          className="flex items-center gap-1 px-3 py-1 bg-primary-500 hover:bg-primary-600 rounded-lg text-sm font-medium transition-colors"
        >
          <Undo2 className="w-4 h-4" />
          {t('common.undo', 'Undo')}
        </button>
      </div>,
      { duration: 5000 }
    );
  };

  const cancelDelete = () => {
    setIsDeleteConfirmOpen(false);
    setCategoryToDelete(null);
  };

  // Container animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  // Item animation variants
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="app-page-title">
            {t('categories.title', 'Categories')}
          </h1>
          <p className="app-page-subtitle">
            {t('categories.subtitle', 'Organize your inventory')}
            {categories.length > 0 && (
              <span className="ml-1.5 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                {categories.length}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted/50 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('common.search', 'Search…')}
              className="w-full h-10 pl-9 pr-8 rounded-xl bg-card border border-border/60 text-sm text-foreground placeholder:text-foreground-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-foreground-muted hover:text-foreground transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Add button */}
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => { setIsAddFormOpen(true); setEditingCategory(null); }}
            disabled={isAddFormOpen}
            className="btn-primary h-10 px-4 flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">{t('categories.addCategory', 'Add Category')}</span>
          </motion.button>
        </div>
      </div>

      {/* Inline Add Form */}
      <AnimatePresence>
        {isAddFormOpen && (
          <InlineCategoryForm
            onSubmit={handleCreate}
            onCancel={() => setIsAddFormOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Categories Grid or Skeleton */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {[...Array(8)].map((_, i) => (
            <CategorySkeleton key={i} />
          ))}
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4"
        >
          <AnimatePresence mode="popLayout">
            {filteredCategories.map((category) => (
              <motion.div
                key={category.id}
                layout
                variants={itemVariants}
                exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                className={`card-theme rounded-2xl sm:rounded-[2rem] group relative flex flex-col border border-border/50 hover:border-primary/30 hover:shadow-xl transition-all duration-300 overflow-hidden ${
                  editingCategory?.id === category.id ? 'z-10 ring-2 ring-primary-500/50' : ''
                }`}
              >
                {/* Decorative gradient */}
                <div
                  className="absolute top-0 right-0 w-24 h-24 opacity-10 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none transition-opacity group-hover:opacity-20"
                  style={{ backgroundColor: category.color || 'var(--primary)' }}
                />

                {editingCategory?.id === category.id ? (
                  <div className="p-3 sm:p-4">
                    <InlineCategoryForm
                      initialData={category}
                      onSubmit={handleUpdate}
                      onCancel={() => setEditingCategory(null)}
                      isEdit
                    />
                  </div>
                ) : (
                  <>
                    {/* Info area */}
                    <div className="relative z-10 p-3 sm:p-4 flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div
                          className="p-2.5 rounded-xl shadow-sm flex-shrink-0"
                          style={{
                            backgroundColor: `${category.color || '#6366f1'}18`,
                            color: category.color || '#6366f1'
                          }}
                        >
                          <FolderOpen className="w-5 h-5" />
                        </div>
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-secondary/50 border border-border/40 text-xs font-medium text-muted-foreground">
                          <Package className="w-3 h-3" />
                          <span>{category.itemCount || 0}</span>
                        </div>
                      </div>

                      <h3 className="text-sm sm:text-base font-bold text-foreground group-hover:text-primary transition-colors truncate leading-tight mb-1" title={category.name}>
                        {category.name}
                      </h3>

                      {category.description && (
                        <p className="text-muted-foreground/70 text-xs line-clamp-2 leading-relaxed" title={category.description}>
                          {category.description}
                        </p>
                      )}
                    </div>

                    {/* Always-visible action row */}
                    <div className="flex items-center justify-end gap-1.5 px-3 pb-3 relative z-10">
                      <button
                        onClick={() => setEditingCategory(category)}
                        className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all"
                        title={t('common.edit', 'Edit')}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(category)}
                        className="h-8 w-8 rounded-xl bg-error-500/10 text-error-500 flex items-center justify-center hover:bg-error-500 hover:text-white transition-all"
                        title={t('common.delete', 'Delete')}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ── Empty state ── */}
      {filteredCategories.length === 0 && !isLoading && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center text-center py-12 sm:py-16 px-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-secondary/40 flex items-center justify-center mb-4">
            <FolderOpen className="w-8 h-8 text-foreground-muted/50" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1">
            {searchQuery
              ? t('categories.noResults', 'No categories found')
              : t('categories.noCategories', 'No categories yet')}
          </h3>
          <p className="text-sm text-foreground-muted/70 mb-5 max-w-xs">
            {searchQuery
              ? t('categories.tryDifferentSearch', 'Try a different search term')
              : t('categories.createFirstCategory', 'Create your first category to start organising your inventory.')}
          </p>
          {!searchQuery && (
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setIsAddFormOpen(true)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {t('categories.addCategory', 'Add Category')}
            </motion.button>
          )}
        </motion.div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        title={t('categories.deleteTitle', 'Delete Category')}
        message={
          categoryToDelete
            ? t('categories.deleteConfirm', 'Are you sure you want to delete {{name}}?', { name: categoryToDelete.name })
            : t('categories.deleteConfirmDefault', 'Are you sure you want to delete this category?')
        }
        confirmText={t('common.delete', 'Delete')}
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
}