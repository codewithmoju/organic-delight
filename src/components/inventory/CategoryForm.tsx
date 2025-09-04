import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Category } from '../../lib/types';
import LoadingSpinner from '../ui/LoadingSpinner';

interface CategoryFormProps {
  initialData?: Partial<Category>;
  onSubmit: (data: Partial<Category>) => Promise<void>;
  onCancel: () => void;
}

export default function CategoryForm({ initialData, onSubmit, onCancel }: CategoryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      const data = {
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        created_by: 'current-user'
      };

      await onSubmit(data);
      toast.success('Category saved successfully');
    } catch (error) {
      toast.error('Failed to save category');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <label htmlFor="name" className="block text-base font-medium text-gray-300 mb-3">
          Category Name *
        </label>
        <input
          type="text"
          name="name"
          id="name"
          defaultValue={initialData?.name}
          required
          className="w-full input-dark input-large"
          placeholder="Enter category name"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <label htmlFor="description" className="block text-base font-medium text-gray-300 mb-3">
          Description
        </label>
        <textarea
          name="description"
          id="description"
          rows={5}
          defaultValue={initialData?.description || ''}
          className="w-full input-dark input-large"
          placeholder="Enter category description"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex justify-end gap-4 pt-8 border-t border-dark-700/50"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={onCancel}
          className="btn-secondary px-8 py-3 text-lg"
        >
          Cancel
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="submit"
          disabled={isSubmitting}
          className="btn-primary flex items-center gap-2 min-w-[140px] px-8 py-3 text-lg"
        >
          {isSubmitting ? (
            <>
              <LoadingSpinner size="sm" color="white" />
              Saving...
            </>
          ) : (
            'Save Category'
          )}
        </motion.button>
      </motion.div>
    </form>
  );
}