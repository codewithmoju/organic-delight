import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Item } from '../../lib/types';
import { getItem, updateItem } from '../../lib/api/items';
import { createTransaction } from '../../lib/api/transactions';
import LoadingSpinner from '../ui/LoadingSpinner';

interface TransactionFormProps {
  items: Item[];
  onComplete: () => void;
  onCancel: () => void;
}

export default function TransactionForm({ items, onComplete, onCancel }: TransactionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      const type = formData.get('type') as 'in' | 'out';
      const quantity = parseInt(formData.get('quantity') as string, 10);
      const itemId = formData.get('item_id') as string;
      const notes = formData.get('notes') as string;
      const costPerUnit = parseFloat(formData.get('cost_per_unit') as string) || 0;
      const reference = formData.get('reference') as string;

      // Get current item data
      const item = await getItem(itemId);

      const newQuantity = type === 'in' 
        ? item.quantity + quantity
        : item.quantity - quantity;

      if (newQuantity < 0) {
        throw new Error('Insufficient stock');
      }

      // Create transaction record
      await createTransaction({
        item_id: itemId,
        quantity_changed: type === 'in' ? quantity : -quantity,
        type,
        notes,
        cost_per_unit: costPerUnit,
        reference,
        created_by: 'current-user'
      });

      // Update item quantity
      await updateItem(itemId, { quantity: newQuantity });

      toast.success('Transaction completed successfully');
      onComplete();
    } catch (error: any) {
      toast.error(error.message || 'Failed to process transaction');
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
        <label htmlFor="type" className="block text-base font-medium text-gray-300 mb-3">
          Transaction Type *
        </label>
        <select
          name="type"
          id="type"
          required
          className="w-full input-dark input-large"
        >
          <option value="in">Stock In</option>
          <option value="out">Stock Out</option>
        </select>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <label htmlFor="item_id" className="block text-base font-medium text-gray-300 mb-3">
          Item *
        </label>
        <select
          name="item_id"
          id="item_id"
          required
          onChange={(e) => setSelectedItem(items.find(item => item.id === e.target.value) || null)}
          className="w-full input-dark input-large"
        >
          <option value="">Select an item</option>
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} - Current Stock: {item.quantity} {item.unit}
            </option>
          ))}
        </select>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <label htmlFor="quantity" className="block text-base font-medium text-gray-300 mb-3">
            Quantity ({selectedItem?.unit || 'units'}) *
          </label>
          <input
            type="number"
            name="quantity"
            id="quantity"
            min="1"
            required
            className="w-full input-dark input-large"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <label htmlFor="cost_per_unit" className="block text-base font-medium text-gray-300 mb-3">
            Cost per Unit
          </label>
          <input
            type="number"
            name="cost_per_unit"
            id="cost_per_unit"
            min="0"
            step="0.01"
            className="w-full input-dark input-large"
            placeholder="0.00"
          />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <label htmlFor="reference" className="block text-base font-medium text-gray-300 mb-3">
          Reference Number
        </label>
        <input
          type="text"
          name="reference"
          id="reference"
          className="w-full input-dark input-large"
          placeholder="Enter reference number"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <label htmlFor="notes" className="block text-base font-medium text-gray-300 mb-3">
          Notes
        </label>
        <textarea
          name="notes"
          id="notes"
          rows={4}
          className="w-full input-dark input-large"
          placeholder="Enter transaction notes"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
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
          className="btn-primary flex items-center gap-2 min-w-[180px] px-8 py-3 text-lg"
        >
          {isSubmitting ? (
            <>
              <LoadingSpinner size="sm" color="white" />
              Processing...
            </>
          ) : (
            'Submit Transaction'
          )}
        </motion.button>
      </motion.div>
    </form>
  );
}