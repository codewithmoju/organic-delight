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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gradient">
            {t('categories.title', 'Categories')}
          </h1>
          <p className="text-gray-400 mt-1 text-sm sm:text-base">
            {t('categories.subtitle', 'Organize your inventory')} • {categories.length} {t('common.total', 'total')}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="relative flex-1 sm:flex-none sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('common.search', 'Search categories...')}
              className="w-full pl-10 pr-8 py-2 input-dark"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Add button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setIsAddFormOpen(true);
              setEditingCategory(null);
            }}
            disabled={isAddFormOpen}
            className="btn-primary flex items-center gap-2 whitespace-nowrap"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <CategorySkeleton key={i} />
          ))}
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredCategories.map((category) => (
              <motion.div
                key={category.id}
                layout
                variants={itemVariants}
                exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                whileHover={editingCategory?.id !== category.id ? { y: -8, transition: { duration: 0.2 } } : undefined}
                className={`card-theme p-6 rounded-[2.5rem] group relative h-full flex flex-col justify-between border border-border/50 hover:border-primary/30 hover:shadow-2xl transition-all duration-300 ${editingCategory?.id === category.id ? 'z-10 ring-2 ring-primary-500/50' : 'overflow-hidden'
                  }`}
              >
                {/* Decorative Background Gradient */}
                <div
                  className="absolute top-0 right-0 w-32 h-32 opacity-10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none transition-colors group-hover:opacity-20"
                  style={{ backgroundColor: category.color || 'var(--primary)' }}
                />

                {editingCategory?.id === category.id ? (
                  <InlineCategoryForm
                    initialData={category}
                    onSubmit={handleUpdate}
                    onCancel={() => setEditingCategory(null)}
                    isEdit
                  />
                ) : (
                  <>
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-6">
                        <div
                          className="p-3 rounded-2xl transition-transform duration-300 group-hover:scale-110 shadow-sm"
                          style={{
                            backgroundColor: `${category.color || '#6366f1'}15`,
                            color: category.color || '#6366f1'
                          }}
                        >
                          <FolderOpen className="w-6 h-6" />
                        </div>
                      </div>

                      <div className="space-y-2 mb-6">
                        <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors duration-200 truncate leading-tight" title={category.name}>
                          {category.name}
                        </h3>
                        {/* Items count badge */}
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary/50 border border-border/50 text-xs font-medium text-muted-foreground">
                          <Package className="w-3.5 h-3.5" />
                          <span>{category.itemCount || 0} {t('common.items', 'items')}</span>
                        </div>
                      </div>

                      {category.description && (
                        <p className="text-muted-foreground/80 text-sm line-clamp-2 h-10 leading-relaxed" title={category.description}>
                          {category.description}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-20">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setEditingCategory(category)}
                        className="h-9 w-9 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90"
                        title={t('common.edit', 'Edit')}
                      >
                        <Pencil className="h-4 w-4" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDeleteClick(category)}
                        className="h-9 w-9 rounded-full bg-destructive text-destructive-foreground shadow-lg flex items-center justify-center hover:bg-destructive/90"
                        title={t('common.delete', 'Delete')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </motion.button>
                    </div>
                  </>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Empty state */}
      {filteredCategories.length === 0 && !isLoading && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12 sm:py-16 px-4"
        >
          <div className="bg-secondary/30 rounded-full p-6 inline-block mb-4">
            <FolderOpen className="w-12 h-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-muted-foreground mb-2">
            {searchQuery
              ? t('categories.noResults', 'No categories found')
              : t('categories.noCategories', 'No categories yet')}
          </h3>
          <p className="text-muted-foreground/70 mb-6 max-w-md mx-auto">
            {searchQuery
              ? t('categories.tryDifferentSearch', 'Try a different search term')
              : t('categories.createFirstCategory', 'Create your first category to organize your inventory efficiently.')}
          </p>
          {!searchQuery && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
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