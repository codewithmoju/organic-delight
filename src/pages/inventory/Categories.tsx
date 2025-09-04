import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, FolderOpen, Package } from 'lucide-react';
import { toast } from 'sonner';
import { getCategories, createCategory, updateCategory, deleteCategory, getCategoryItemCount } from '../../lib/api/categories';
import { Category } from '../../lib/types';
import CategoryForm from '../../components/inventory/CategoryForm';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import AnimatedCard from '../../components/ui/AnimatedCard';

interface CategoryWithCount extends Category {
  itemCount?: number;
}

export default function Categories() {
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const data = await getCategories();
      
      // Get item count for each category
      const categoriesWithCount = await Promise.all(
        data.map(async (category) => {
          try {
            const itemCount = await getCategoryItemCount(category.id);
            return { ...category, itemCount };
          } catch (error) {
            return { ...category, itemCount: 0 };
          }
        })
      );
      
      setCategories(categoriesWithCount);
    } catch (error) {
      toast.error('Failed to load categories');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(data: Partial<Category>) {
    try {
      if (selectedCategory) {
        await updateCategory(selectedCategory.id, data);
      } else {
        await createCategory(data as Omit<Category, 'id'>);
      }
      await loadData();
      setIsFormOpen(false);
      setSelectedCategory(null);
    } catch (error) {
      throw error;
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      await deleteCategory(id);
      await loadData();
      toast.success('Category deleted successfully');
    } catch (error) {
      toast.error('Failed to delete category');
      console.error(error);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" text="Loading categories..." />
      </div>
    );
  }

  if (isFormOpen) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gradient">
            {selectedCategory ? 'Edit Category' : 'Add New Category'}
          </h1>
          <p className="text-gray-400 mt-2">
            {selectedCategory ? 'Update category information' : 'Create a new inventory category'}
          </p>
        </div>
        
        <AnimatedCard>
          <div className="p-6">
            <CategoryForm
              initialData={selectedCategory || undefined}
              onSubmit={handleSubmit}
              onCancel={() => {
                setIsFormOpen(false);
                setSelectedCategory(null);
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
        className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gradient">Categories</h1>
          <p className="text-gray-400 mt-1 text-sm sm:text-base">
            Organize your inventory with custom categories
          </p>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={() => setIsFormOpen(true)}
          className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center"
        >
          <Plus className="h-4 w-4" />
          Add Category
        </motion.button>
      </motion.div>

      {/* Categories Grid */}
      <motion.div 
        layout
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6 px-2 sm:px-0"
      >
        <AnimatePresence>
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -8, scale: 1.03 }}
              className="card-dark p-4 sm:p-6 group cursor-pointer relative overflow-hidden w-full"
            >
              {/* Background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-accent-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <div className="flex items-center flex-1 min-w-0">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 group-hover:from-primary-500/30 group-hover:to-accent-500/30 transition-all duration-300">
                      <FolderOpen className="w-6 h-6 text-primary-400" />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        setSelectedCategory(category);
                        setIsFormOpen(true);
                      }}
                      className="p-1.5 sm:p-2 rounded-lg bg-primary-500/20 text-primary-400 hover:bg-primary-500/30 transition-colors duration-200"
                    >
                      <Pencil className="h-4 w-4" />
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDelete(category.id)}
                      className="p-1.5 sm:p-2 rounded-lg bg-error-500/20 text-error-400 hover:bg-error-500/30 transition-colors duration-200"
                    >
                      <Trash2 className="h-4 w-4" />
                    </motion.button>
                  </div>
                </div>
                
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-white group-hover:text-primary-300 transition-colors duration-200 mb-2 truncate">
                    {category.name}
                  </h3>
                  
                  {category.description && (
                    <p className="text-gray-400 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2">
                      {category.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-gray-400 text-xs sm:text-sm">
                      <Package className="w-4 h-4 mr-1" />
                      {category.itemCount || 0} items
                    </div>
                    
                    <div className="w-2 h-2 bg-primary-500 rounded-full group-hover:scale-150 transition-transform duration-300" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Empty state */}
      {categories.length === 0 && !isLoading && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12 sm:py-16 px-4"
        >
          <FolderOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg sm:text-xl font-semibold text-gray-400 mb-2">No categories yet</h3>
          <p className="text-gray-500 mb-6 text-sm sm:text-base">
            Create your first category to organize your inventory
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsFormOpen(true)}
            className="btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create First Category
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}