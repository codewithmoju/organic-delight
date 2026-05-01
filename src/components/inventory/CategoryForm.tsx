import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Category } from '../../lib/types';
import LoadingSpinner from '../ui/LoadingSpinner';
import { AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../lib/store';

interface CategoryFormProps {
  initialData?: Partial<Category>;
  onSubmit: (data: { name: string; description: string; created_by: string }) => Promise<void>;
  onCancel: () => void;
}

export default function CategoryForm({ initialData, onSubmit, onCancel }: CategoryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; description?: string }>({});

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      const name = (formData.get('name') as string).trim();
      const description = (formData.get('description') as string).trim();

      const newErrors: typeof errors = {};
      if (!name) newErrors.name = 'Category name is required';
      else if (name.length < 2) newErrors.name = 'Name must be at least 2 characters';
      else if (name.length > 50) newErrors.name = 'Name must be 50 characters or less';

      if (!description) newErrors.description = 'Description is required';
      else if (description.length < 5) newErrors.description = 'Description must be at least 5 characters';

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      const user = useAuthStore.getState().user;
      await onSubmit({ name, description, created_by: user?.uid || 'unknown' });
      toast.success(`Category ${initialData ? 'updated' : 'created'} successfully`);
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        setErrors({ name: error.message });
      } else {
        toast.error(`Failed to ${initialData ? 'update' : 'create'} category`);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClass = (hasError?: string) =>
    `w-full px-4 py-3 rounded-xl bg-background border text-foreground placeholder:text-foreground-muted/50
     focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all text-sm sm:text-base
     ${hasError ? 'border-error-500 ring-2 ring-error-500/20' : 'border-border/60'}`;

  return (
    <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
      {/* Name */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <label htmlFor="cat-name" className="block text-sm font-semibold text-foreground mb-1.5">
          Category Name <span className="text-error-500">*</span>
        </label>
        <input
          type="text"
          name="name"
          id="cat-name"
          defaultValue={initialData?.name}
          required
          maxLength={50}
          className={inputClass(errors.name)}
          placeholder="e.g., Electronics, Clothing, Groceries"
        />
        {errors.name && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-1.5 flex items-center gap-1 text-xs text-error-500">
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
            {errors.name}
          </motion.p>
        )}
      </motion.div>

      {/* Description */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <label htmlFor="cat-desc" className="block text-sm font-semibold text-foreground mb-1.5">
          Description <span className="text-error-500">*</span>
        </label>
        <textarea
          name="description"
          id="cat-desc"
          rows={3}
          defaultValue={initialData?.description || ''}
          required
          maxLength={500}
          className={`${inputClass(errors.description)} resize-none`}
          placeholder="Describe what types of items belong in this category…"
        />
        {errors.description && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-1.5 flex items-center gap-1 text-xs text-error-500">
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
            {errors.description}
          </motion.p>
        )}
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-border/40"
      >
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary py-2.5 px-6 text-sm sm:text-base"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary flex items-center justify-center gap-2 py-2.5 px-6 text-sm sm:text-base disabled:opacity-50"
        >
          {isSubmitting ? (
            <><LoadingSpinner size="sm" color="white" />{initialData ? 'Updating…' : 'Creating…'}</>
          ) : (
            `${initialData ? 'Update' : 'Create'} Category`
          )}
        </button>
      </motion.div>
    </form>
  );
}
