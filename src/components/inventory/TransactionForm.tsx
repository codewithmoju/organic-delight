import { useState } from 'react';
import { toast } from 'sonner';
import { Item } from '../../lib/types';
import { supabase } from '../../lib/supabase';

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

      // Start a transaction
      const { data: item } = await supabase
        .from('items')
        .select('quantity, unit_price')
        .eq('id', itemId)
        .single();

      if (!item) throw new Error('Item not found');

      const newQuantity = type === 'in' 
        ? item.quantity + quantity
        : item.quantity - quantity;

      if (newQuantity < 0) {
        throw new Error('Insufficient stock');
      }

      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          item_id: itemId,
          quantity_changed: type === 'in' ? quantity : -quantity,
          type,
          notes
        });

      if (transactionError) throw transactionError;

      const { error: updateError } = await supabase
        .from('items')
        .update({ quantity: newQuantity })
        .eq('id', itemId);

      if (updateError) throw updateError;

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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="type" className="block text-sm font-medium text-[#4B2600]">
          Transaction Type
        </label>
        <select
          name="type"
          id="type"
          required
          className="mt-1 block w-full rounded-md border-[#964B00] shadow-sm focus:border-[#F59E0B] focus:ring-[#F59E0B] sm:text-sm"
        >
          <option value="in">Stock In</option>
          <option value="out">Stock Out</option>
        </select>
      </div>

      <div>
        <label htmlFor="item_id" className="block text-sm font-medium text-[#4B2600]">
          Item
        </label>
        <select
          name="item_id"
          id="item_id"
          required
          onChange={(e) => setSelectedItem(items.find(item => item.id === e.target.value) || null)}
          className="mt-1 block w-full rounded-md border-[#964B00] shadow-sm focus:border-[#F59E0B] focus:ring-[#F59E0B] sm:text-sm"
        >
          <option value="">Select an item</option>
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} - Current Stock: {item.quantity} {item.unit}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="quantity" className="block text-sm font-medium text-[#4B2600]">
          Quantity ({selectedItem?.unit || 'units'})
        </label>
        <input
          type="number"
          name="quantity"
          id="quantity"
          min="1"
          required
          className="mt-1 block w-full rounded-md border-[#964B00] shadow-sm focus:border-[#F59E0B] focus:ring-[#F59E0B] sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-[#4B2600]">
          Notes
        </label>
        <textarea
          name="notes"
          id="notes"
          rows={3}
          className="mt-1 block w-full rounded-md border-[#964B00] shadow-sm focus:border-[#F59E0B] focus:ring-[#F59E0B] sm:text-sm"
        />
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-[#964B00] bg-white px-4 py-2 text-sm font-medium text-[#4B2600] hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-[#F59E0B] focus:ring-offset-2"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex justify-center rounded-md border border-transparent bg-[#964B00] px-4 py-2 text-sm font-medium text-white hover:bg-[#4B2600] focus:outline-none focus:ring-2 focus:ring-[#F59E0B] focus:ring-offset-2 disabled:opacity-50"
        >
          {isSubmitting ? 'Processing...' : 'Submit Transaction'}
        </button>
      </div>
    </form>
  );
}