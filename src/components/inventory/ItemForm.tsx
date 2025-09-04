import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Item, Category } from '../../lib/types';
import LoadingSpinner from '../ui/LoadingSpinner';
import { AlertCircle } from 'lucide-react';

interface ItemFormProps {
  initialData?: Partial<Item>;
  categories: Category[];
  onSubmit: (data: { name: string; description: string; category_id: string; created_by: string }) => Promise<void>;
  onCancel: () => void;
}

export default function ItemForm({ initialData, categories, onSubmit, onCancel }: ItemFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; description?: string; category_id?: string }>({});

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      const name = (formData.get('name') as string).trim();
      const description = (formData.get('description') as string).trim();
      const category_id = formData.get('category_id') as string;

      // Validation
      const newErrors: typeof errors = {};
      
      if (!name) {
        newErrors.name = 'Item name is required';
      } else if (name.length < 2) {
        newErrors.name = 'Item name must be at least 2 characters';
      } else if (name.length > 100) {
        newErrors.name = 'Item name must be 100 characters or less';
      }
      
      if (!description) {
        newErrors.description = 'Description is required';
      } else if (description.length < 5) {
        newErrors.description = 'Description must be at least 5 characters';
      }
      
      if (!category_id) {
        newErrors.category_id = 'Please select a category';
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      await onSubmit({
        name,
        description,
        category_id,
        created_by: 'current-user'
      });
      
      toast.success(`Item ${initialData ? 'updated' : 'created'} successfully`);
      
      // Add a small delay to ensure the item appears in lists
      setTimeout(() => {
        console.log('Item operation completed, lists should refresh');
      }, 500);
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        setErrors({ name: error.message });
      } else {
        toast.error(`Failed to ${initialData ? 'update' : 'create'} item`);
      }
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <label htmlFor="name" className="block text-base font-medium text-gray-300 mb-3">
          Item Name *
        </label>
        <input
          type="text"
          name="name"
          id="name"
          defaultValue={initialData?.name}
          required
          maxLength={100}
          className={`w-full input-dark input-large ${
            errors.name ? 'ring-error-500 border-error-500' : ''
          }`}
          placeholder="Enter item name (e.g., iPhone 15, Nike Air Max)"
        />
        {errors.name && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-2 flex items-center text-sm text-error-400"
          >
            <AlertCircle className="h-4 w-4 mr-1" />
            {errors.name}
          </motion.div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <label htmlFor="category_id" className="block text-base font-medium text-gray-300 mb-3">
          Category *
        </label>
        <select
          name="category_id"
          id="category_id"
          defaultValue={initialData?.category_id || ''}
          required
          className={`w-full input-dark input-large ${
            errors.category_id ? 'ring-error-500 border-error-500' : ''
          }`}
        >
          <option value="">Select a category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        {errors.category_id && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-2 flex items-center text-sm text-error-400"
          >
            <AlertCircle className="h-4 w-4 mr-1" />
            {errors.category_id}
          </motion.div>
        )}
        {categories.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-2 flex items-center text-sm text-warning-400"
          >
            <AlertCircle className="h-4 w-4 mr-1" />
            No categories available. Please create a category first.
          </motion.div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <label htmlFor="description" className="block text-base font-medium text-gray-300 mb-3">
          Description *
        </label>
        <textarea
          name="description"
          id="description"
          rows={4}
          defaultValue={initialData?.description || ''}
          required
          maxLength={1000}
          className={`w-full input-dark input-large resize-none ${
            errors.description ? 'ring-error-500 border-error-500' : ''
          }`}
          placeholder="Describe the item, its features, specifications, or any relevant details..."
        />
        {errors.description && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-2 flex items-center text-sm text-error-400"
          >
            <AlertCircle className="h-4 w-4 mr-1" />
            {errors.description}
          </motion.div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-dark-800/30 border border-dark-700/50 rounded-xl p-4 sm:p-6"
      >
        <h4 className="text-lg font-semibold text-white mb-3">📋 Important Note</h4>
        <p className="text-gray-300 text-sm leading-relaxed">
          Stock quantities and pricing will be managed through the <strong>Transactions</strong> section. 
          This form only defines the basic item information and category assignment.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-6 sm:pt-8 border-t border-dark-700/50"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={onCancel}
          className="btn-secondary px-6 sm:px-8 py-3 text-base sm:text-lg order-2 sm:order-1"
        >
          Cancel
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="submit"
          disabled={isSubmitting || categories.length === 0}
          className="btn-primary flex items-center gap-2 min-w-[140px] px-6 sm:px-8 py-3 text-base sm:text-lg order-1 sm:order-2"
        >
          {isSubmitting ? (
            <>
              <LoadingSpinner size="sm" color="white" />
              {initialData ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            `${initialData ? 'Update' : 'Create'} Item`
          )}
        </motion.button>
      </motion.div>
    </form>
  );
}