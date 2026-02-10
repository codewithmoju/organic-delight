import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Category, EnhancedItem } from '../../lib/types';
import { getUnits, createUnit, Unit } from '../../lib/api/units';
import LoadingSpinner from '../ui/LoadingSpinner';
import { AlertCircle, DollarSign } from 'lucide-react';
import { useAuthStore } from '../../lib/store';
import CustomSelect from '../ui/CustomSelect';

interface ItemFormProps {
  initialData?: Partial<EnhancedItem>;
  categories: Category[];
  onSubmit: (data: Partial<EnhancedItem>) => Promise<void>;
  onCancel: () => void;
}

export default function ItemForm({ initialData, categories, onSubmit, onCancel }: ItemFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [units, setUnits] = useState<Unit[]>([]);
  const [errors, setErrors] = useState<{ name?: string; description?: string; category_id?: string; unit_price?: string; unit?: string }>({});
  const profile = useAuthStore(state => state.profile);

  // State for controlled CustomSelect components
  const [categoryId, setCategoryId] = useState(initialData?.category_id || '');
  const [selectedUnit, setSelectedUnit] = useState(initialData?.unit || 'pcs');

  const loadUnits = async () => {
    const unitsData = await getUnits();
    setUnits(unitsData);
  };

  useEffect(() => {
    loadUnits();
  }, []);

  const handleUnitChange = async (val: string) => {
    const existingUnit = units.find(u => u.symbol === val);

    if (!existingUnit && val) {
      try {
        const newUnit = await createUnit(val);
        await loadUnits();
        setSelectedUnit(newUnit.symbol);
        toast.success(`Unit "${newUnit.name}" created`);
      } catch (error) {
        toast.error('Failed to create unit');
        setSelectedUnit(val);
      }
    } else {
      setSelectedUnit(val);
    }
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      const name = (formData.get('name') as string).trim();
      const description = (formData.get('description') as string).trim();
      // category_id and unit are now from state
      const unit_price = parseFloat(formData.get('unit_price') as string);

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

      if (!categoryId) {
        newErrors.category_id = 'Please select a category';
      }

      if (!selectedUnit) {
        newErrors.unit = 'Please select a unit';
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      await onSubmit({
        name,
        description,
        category_id: categoryId,
        unit: selectedUnit,
        unit_price,
        created_by: profile?.id || 'unknown'
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
    <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8 max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <label htmlFor="name" className="block text-sm font-semibold text-foreground/80 mb-2">
          Item Name *
        </label>
        <input
          type="text"
          name="name"
          id="name"
          defaultValue={initialData?.name}
          required
          maxLength={100}
          className={`w-full h-12 px-4 rounded-xl bg-background border-2 border-border/60 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all duration-300 ${errors.name ? 'border-error-500 focus:border-error-500' : ''
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <CustomSelect
            label="Category *"
            value={categoryId}
            onChange={setCategoryId}
            options={categories.map(cat => ({ value: cat.id, label: cat.name }))}
            placeholder="Select a category"
            error={errors.category_id}
            searchable
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <CustomSelect
            label="Unit *"
            value={selectedUnit}
            onChange={handleUnitChange}
            options={units.length > 0 ? units.map(u => ({ value: u.symbol, label: `${u.name} (${u.symbol})` })) : [
              { value: 'pcs', label: 'Pieces (pcs)' },
              { value: 'kg', label: 'Kilogram (kg)' },
              { value: 'ltr', label: 'Liter (ltr)' },
              { value: 'box', label: 'Box' }
            ]}
            placeholder="Select a unit"
            error={errors.unit}
            creatable
          />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <label htmlFor="description" className="block text-sm font-semibold text-foreground/80 mb-2">
          Description *
        </label>
        <textarea
          name="description"
          id="description"
          rows={4}
          defaultValue={initialData?.description || ''}
          required
          maxLength={1000}
          className={`w-full min-h-[120px] p-4 rounded-xl bg-background border-2 border-border/60 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all duration-300 resize-none ${errors.description ? 'border-error-500' : ''
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
        transition={{ delay: 0.35 }}
      >
        <label htmlFor="unit_price" className="block text-sm font-semibold text-foreground/80 mb-2">
          Unit Price *
        </label>
        <div className="relative group">
          <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            type="number"
            step="0.01"
            name="unit_price"
            id="unit_price"
            defaultValue={initialData?.unit_price}
            className={`w-full h-12 pl-10 pr-4 rounded-xl bg-background border-2 border-border/60 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all duration-300 ${errors.unit_price ? 'border-error-500' : ''
              }`}
            placeholder="0.00"
          />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-primary/5 border border-primary/10 rounded-2xl p-6"
      >
        <h4 className="text-lg font-bold text-primary mb-2 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Important Note
        </h4>
        <p className="text-muted-foreground text-sm leading-relaxed">
          This form is for editing existing items. For new products with pricing and stock, use the "Add New Product" workflow.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-6 border-t border-border/50"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={onCancel}
          className="px-8 py-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary font-medium transition-all duration-200 order-2 sm:order-1"
        >
          Cancel
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="submit"
          disabled={isSubmitting || categories.length === 0}
          className="btn-primary flex items-center gap-2 min-w-[160px] px-8 py-3 rounded-xl shadow-lg hover:shadow-primary/25 order-1 sm:order-2"
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