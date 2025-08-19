import { useState } from 'react';
import { toast } from 'sonner';
import { Item, Category, SUPPORTED_CURRENCIES, SUPPORTED_UNITS } from '../../lib/types';

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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-[#4B2600]">
            Name
          </label>
          <input
            type="text"
            name="name"
            id="name"
            defaultValue={initialData?.name}
            required
            className="mt-1 block w-full rounded-md border-[#964B00] shadow-sm focus:border-[#F59E0B] focus:ring-[#F59E0B] sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="category_id" className="block text-sm font-medium text-[#4B2600]">
            Category
          </label>
          <select
            name="category_id"
            id="category_id"
            defaultValue={initialData?.category_id || ''}
            className="mt-1 block w-full rounded-md border-[#964B00] shadow-sm focus:border-[#F59E0B] focus:ring-[#F59E0B] sm:text-sm"
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="description" className="block text-sm font-medium text-[#4B2600]">
            Description
          </label>
          <textarea
            name="description"
            id="description"
            rows={3}
            defaultValue={initialData?.description || ''}
            className="mt-1 block w-full rounded-md border-[#964B00] shadow-sm focus:border-[#F59E0B] focus:ring-[#F59E0B] sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="quantity" className="block text-sm font-medium text-[#4B2600]">
            Quantity
          </label>
          <input
            type="number"
            name="quantity"
            id="quantity"
            min="0"
            defaultValue={initialData?.quantity || 0}
            required
            className="mt-1 block w-full rounded-md border-[#964B00] shadow-sm focus:border-[#F59E0B] focus:ring-[#F59E0B] sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="unit" className="block text-sm font-medium text-[#4B2600]">
            Unit
          </label>
          <select
            name="unit"
            id="unit"
            defaultValue={initialData?.unit || 'units'}
            required
            className="mt-1 block w-full rounded-md border-[#964B00] shadow-sm focus:border-[#F59E0B] focus:ring-[#F59E0B] sm:text-sm"
          >
            {SUPPORTED_UNITS.map((unit) => (
              <option key={unit.value} value={unit.value}>
                {unit.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="currency" className="block text-sm font-medium text-[#4B2600]">
            Currency
          </label>
          <select
            name="currency"
            id="currency"
            defaultValue={initialData?.currency || 'USD'}
            required
            className="mt-1 block w-full rounded-md border-[#964B00] shadow-sm focus:border-[#F59E0B] focus:ring-[#F59E0B] sm:text-sm"
          >
            {SUPPORTED_CURRENCIES.map((currency) => (
              <option key={currency.code} value={currency.code}>
                {currency.code} ({currency.symbol})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="unit_price" className="block text-sm font-medium text-[#4B2600]">
            Unit Price
          </label>
          <input
            type="number"
            name="unit_price"
            id="unit_price"
            min="0"
            step="0.01"
            defaultValue={initialData?.unit_price || 0}
            required
            className="mt-1 block w-full rounded-md border-[#964B00] shadow-sm focus:border-[#F59E0B] focus:ring-[#F59E0B] sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="reorder_point" className="block text-sm font-medium text-[#4B2600]">
            Reorder Point
          </label>
          <input
            type="number"
            name="reorder_point"
            id="reorder_point"
            min="0"
            defaultValue={initialData?.reorder_point || 10}
            required
            className="mt-1 block w-full rounded-md border-[#964B00] shadow-sm focus:border-[#F59E0B] focus:ring-[#F59E0B] sm:text-sm"
          />
        </div>
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
          {isSubmitting ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
}