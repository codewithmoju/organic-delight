import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Item, Category, SUPPORTED_CURRENCIES, SUPPORTED_UNITS } from '../../lib/types';
import LoadingSpinner from '../ui/LoadingSpinner';

interface ItemFormProps {
  initialData?: Partial<Item>;
  categories: Category[];
  onSubmit: (data: Partial<Item>) => Promise<void>;
  onCancel: () => void;
}

export default function ItemForm({ initialData, categories, onSubmit, onCancel }: ItemFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      const data = {
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        category_id: formData.get('category_id') as string,
        quantity: parseInt(formData.get('quantity') as string, 10),
        unit: formData.get('unit') as Item['unit'],
        currency: formData.get('currency') as string,
        unit_price: parseFloat(formData.get('unit_price') as string),
        reorder_point: parseInt(formData.get('reorder_point') as string, 10),
        sku: formData.get('sku') as string,
        supplier: formData.get('supplier') as string,
        location: formData.get('location') as string,
        created_by: 'current-user'
      };

      await onSubmit(data);
      toast.success('Item saved successfully');
    } catch (error) {
      toast.error('Failed to save item');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
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
            className="w-full input-dark input-large"
            placeholder="Enter item name"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <label htmlFor="category_id" className="block text-base font-medium text-gray-300 mb-3">
            Category
          </label>
          <select
            name="category_id"
            id="category_id"
            defaultValue={initialData?.category_id || ''}
            className="w-full input-dark input-large"
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="sm:col-span-2"
        >
          <label htmlFor="description" className="block text-base font-medium text-gray-300 mb-3">
            Description
          </label>
          <textarea
            name="description"
            id="description"
            rows={4}
            defaultValue={initialData?.description || ''}
            className="w-full input-dark input-large"
            placeholder="Enter item description"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <label htmlFor="sku" className="block text-base font-medium text-gray-300 mb-3">
            SKU
          </label>
          <input
            type="text"
            name="sku"
            id="sku"
            defaultValue={initialData?.sku || ''}
            className="w-full input-dark input-large"
            placeholder="Enter SKU"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <label htmlFor="supplier" className="block text-base font-medium text-gray-300 mb-3">
            Supplier
          </label>
          <input
            type="text"
            name="supplier"
            id="supplier"
            defaultValue={initialData?.supplier || ''}
            className="w-full input-dark input-large"
            placeholder="Enter supplier name"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <label htmlFor="location" className="block text-base font-medium text-gray-300 mb-3">
            Location
          </label>
          <input
            type="text"
            name="location"
            id="location"
            defaultValue={initialData?.location || ''}
            className="w-full input-dark input-large"
            placeholder="Enter storage location"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <label htmlFor="quantity" className="block text-base font-medium text-gray-300 mb-3">
            Quantity *
          </label>
          <input
            type="number"
            name="quantity"
            id="quantity"
            min="0"
            defaultValue={initialData?.quantity || 0}
            required
            className="w-full input-dark input-large"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <label htmlFor="unit" className="block text-base font-medium text-gray-300 mb-3">
            Unit *
          </label>
          <select
            name="unit"
            id="unit"
            defaultValue={initialData?.unit || 'units'}
            required
            className="w-full input-dark input-large"
          >
            {SUPPORTED_UNITS.map((unit) => (
              <option key={unit.value} value={unit.value}>
                {unit.label}
              </option>
            ))}
          </select>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <label htmlFor="currency" className="block text-base font-medium text-gray-300 mb-3">
            Currency *
          </label>
          <select
            name="currency"
            id="currency"
            defaultValue={initialData?.currency || 'USD'}
            required
            className="w-full input-dark input-large"
          >
            {SUPPORTED_CURRENCIES.map((currency) => (
              <option key={currency.code} value={currency.code}>
                {currency.code} ({currency.symbol})
              </option>
            ))}
          </select>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
        >
          <label htmlFor="unit_price" className="block text-base font-medium text-gray-300 mb-3">
            Unit Price *
          </label>
          <input
            type="number"
            name="unit_price"
            id="unit_price"
            min="0"
            step="0.01"
            defaultValue={initialData?.unit_price || 0}
            required
            className="w-full input-dark input-large"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
        >
          <label htmlFor="reorder_point" className="block text-base font-medium text-gray-300 mb-3">
            Reorder Point *
          </label>
          <input
            type="number"
            name="reorder_point"
            id="reorder_point"
            min="0"
            defaultValue={initialData?.reorder_point || 10}
            required
            className="w-full input-dark input-large"
          />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
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
            'Save Item'
          )}
        </motion.button>
      </motion.div>
    </form>
  );
}