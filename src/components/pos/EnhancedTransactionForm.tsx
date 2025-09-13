import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Item, Category } from '../../lib/types';
import { getItemStockLevel } from '../../lib/api/items';
import LoadingSpinner from '../ui/LoadingSpinner';
import { AlertCircle, Calculator, Package, DollarSign, Lock } from 'lucide-react';
import { formatCurrency } from '../../lib/utils/notifications';

interface EnhancedTransactionFormProps {
  items: Item[];
  categories: Category[];
  onComplete: () => void;
  onCancel: () => void;
  onSubmit: (data: {
    item_id: string;
    type: 'stock_in' | 'stock_out';
    quantity: number;
    unit_price: number;
    transaction_date: Date;
    supplier_customer: string;
    reference_number?: string;
    notes?: string;
    created_by: string;
  }) => Promise<void>;
}

export default function EnhancedTransactionForm({ 
  items, 
  categories, 
  onComplete, 
  onCancel, 
  onSubmit 
}: EnhancedTransactionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [transactionType, setTransactionType] = useState<'stock_in' | 'stock_out'>('stock_in');
  const [quantity, setQuantity] = useState<number>(0);
  const [currentStock, setCurrentStock] = useState<number>(0);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Filter items by selected category
  const filteredItems = selectedCategory 
    ? items.filter(item => item.category_id === selectedCategory)
    : items;

  // Load current stock when item is selected
  useEffect(() => {
    if (selectedItem) {
      loadCurrentStock();
    }
  }, [selectedItem]);

  const loadCurrentStock = async () => {
    if (!selectedItem) return;
    
    try {
      const stockLevel = await getItemStockLevel(selectedItem.id);
      setCurrentStock(stockLevel?.current_quantity || 0);
    } catch (error) {
      console.error('Error loading stock level:', error);
      setCurrentStock(0);
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSelectedItem(null); // Reset item selection when category changes
  };

  const handleItemChange = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    setSelectedItem(item || null);
  };

  const totalValue = quantity * (selectedItem?.unit_price || 0);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      const supplier_customer = (formData.get('supplier_customer') as string).trim();
      const reference_number = (formData.get('reference_number') as string).trim();
      const notes = (formData.get('notes') as string).trim();
      const transaction_date = new Date(formData.get('transaction_date') as string);

      // Validation
      const newErrors: typeof errors = {};
      
      if (!selectedItem) {
        newErrors.item_id = 'Please select an item';
      }
      
      if (!quantity || quantity <= 0) {
        newErrors.quantity = 'Quantity must be greater than 0';
      }
      
      if (transactionType === 'stock_out' && quantity > currentStock) {
        newErrors.quantity = `Insufficient stock. Available: ${currentStock}`;
      }
      
      if (!supplier_customer) {
        newErrors.supplier_customer = `${transactionType === 'stock_in' ? 'Supplier' : 'Customer'} name is required`;
      }
      
      if (transaction_date > new Date()) {
        newErrors.transaction_date = 'Transaction date cannot be in the future';
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      await onSubmit({
        item_id: selectedItem!.id,
        type: transactionType,
        quantity,
        unit_price: selectedItem!.unit_price || 0, // Use item's fixed price
        transaction_date,
        supplier_customer,
        reference_number: reference_number || undefined,
        notes: notes || undefined,
        created_by: 'current-user'
      });
      
      toast.success('Transaction recorded successfully');
      onComplete();
    } catch (error: any) {
      if (error.message.includes('Insufficient stock')) {
        setErrors({ quantity: error.message });
      } else {
        toast.error('Failed to record transaction');
      }
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
      {/* Transaction Type */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <label className="block text-base font-medium text-gray-300 mb-4">
          Transaction Type *
        </label>
        <div className="grid grid-cols-2 gap-4">
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setTransactionType('stock_in')}
            className={`p-4 rounded-xl border-2 transition-all duration-200 ${
              transactionType === 'stock_in'
                ? 'border-success-500 bg-success-500/10 text-success-400'
                : 'border-dark-600 bg-dark-700/30 text-gray-400 hover:border-success-500/50'
            }`}
          >
            <Package className="w-6 h-6 mx-auto mb-2" />
            <div className="font-semibold">Stock In</div>
            <div className="text-sm opacity-75">Add inventory</div>
          </motion.button>
          
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setTransactionType('stock_out')}
            className={`p-4 rounded-xl border-2 transition-all duration-200 ${
              transactionType === 'stock_out'
                ? 'border-error-500 bg-error-500/10 text-error-400'
                : 'border-dark-600 bg-dark-700/30 text-gray-400 hover:border-error-500/50'
            }`}
          >
            <Package className="w-6 h-6 mx-auto mb-2" />
            <div className="font-semibold">Stock Out</div>
            <div className="text-sm opacity-75">Remove inventory</div>
          </motion.button>
        </div>
      </motion.div>

      {/* Category Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <label htmlFor="category" className="block text-base font-medium text-gray-300 mb-3">
          Select Category *
        </label>
        <select
          id="category"
          value={selectedCategory}
          onChange={(e) => handleCategoryChange(e.target.value)}
          className="w-full input-dark input-large"
        >
          <option value="">Choose a category first</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </motion.div>

      {/* Item Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <label htmlFor="item_id" className="block text-base font-medium text-gray-300 mb-3">
          Select Product *
        </label>
        <select
          id="item_id"
          value={selectedItem?.id || ''}
          onChange={(e) => handleItemChange(e.target.value)}
          disabled={!selectedCategory}
          className={`w-full input-dark input-large ${
            errors.item_id ? 'ring-error-500 border-error-500' : ''
          } ${!selectedCategory ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <option value="">
            {selectedCategory ? 'Choose a product' : 'Select category first'}
          </option>
          {filteredItems.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} - Current Stock: {item.current_quantity || 0}
            </option>
          ))}
        </select>
        {errors.item_id && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-2 flex items-center text-sm text-error-400"
          >
            <AlertCircle className="h-4 w-4 mr-1" />
            {errors.item_id}
          </motion.div>
        )}
      </motion.div>

      {/* Selected Item Info */}
      {selectedItem && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-dark-800/30 border border-dark-700/50 rounded-xl p-4"
        >
          <h4 className="text-white font-semibold mb-2 flex items-center">
            <Package className="w-5 h-5 mr-2 text-primary-400" />
            {selectedItem.name}
          </h4>
          <p className="text-gray-400 text-sm mb-3">{selectedItem.description}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Current Stock:</span>
              <div className={`font-semibold text-lg ${
                currentStock === 0 ? 'text-error-400' : 
                currentStock < 10 ? 'text-warning-400' : 'text-success-400'
              }`}>
                {currentStock}
              </div>
            </div>
            <div>
              <span className="text-gray-400">Unit Price:</span>
              <div className="text-primary-400 font-semibold text-lg">
                {formatCurrency(selectedItem.unit_price || 0)}
              </div>
            </div>
            <div>
              <span className="text-gray-400">Category:</span>
              <div className="text-white font-medium">
                {selectedItem.category?.name || 'Uncategorized'}
              </div>
            </div>
            <div>
              <span className="text-gray-400">SKU:</span>
              <div className="text-white font-mono text-sm">
                {selectedItem.sku || 'N/A'}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Quantity Input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <label htmlFor="quantity" className="block text-base font-medium text-gray-300 mb-3">
          Quantity *
        </label>
        <input
          type="number"
          id="quantity"
          min="0.01"
          step="0.01"
          value={quantity || ''}
          onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
          disabled={!selectedItem}
          className={`w-full input-dark input-large ${
            errors.quantity ? 'ring-error-500 border-error-500' : ''
          } ${!selectedItem ? 'opacity-50 cursor-not-allowed' : ''}`}
          placeholder="Enter quantity"
        />
        {errors.quantity && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-2 flex items-center text-sm text-error-400"
          >
            <AlertCircle className="h-4 w-4 mr-1" />
            {errors.quantity}
          </motion.div>
        )}
        
        {transactionType === 'stock_out' && selectedItem && quantity > currentStock && (
          <div className="mt-2 flex items-center text-sm text-warning-400">
            <AlertCircle className="h-4 w-4 mr-1" />
            Warning: Quantity exceeds available stock ({currentStock})
          </div>
        )}
      </motion.div>

      {/* Price Display (Read-only) */}
      {selectedItem && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <label className="block text-base font-medium text-gray-300 mb-3">
            Unit Price (Fixed)
          </label>
          <div className="relative">
            <input
              type="text"
              value={formatCurrency(selectedItem.unit_price || 0)}
              readOnly
              className="w-full input-dark input-large bg-dark-800/50 cursor-not-allowed pr-10"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <Lock className="w-5 h-5 text-gray-500" />
            </div>
          </div>
          <p className="text-gray-500 text-sm mt-2">
            Price is automatically set from product definition and cannot be modified
          </p>
        </motion.div>
      )}

      {/* Total Value Display */}
      {selectedItem && quantity > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-primary-500/10 to-accent-500/10 border border-primary-500/20 rounded-xl p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Calculator className="w-5 h-5 text-primary-400 mr-3" />
              <span className="text-gray-300 font-medium">Total Transaction Value:</span>
            </div>
            <span className="text-2xl font-bold text-primary-400">
              {formatCurrency(totalValue)}
            </span>
          </div>
          <div className="mt-2 text-sm text-gray-400 text-center">
            {quantity} × {formatCurrency(selectedItem.unit_price || 0)} = {formatCurrency(totalValue)}
          </div>
        </motion.div>
      )}

      {/* Transaction Date */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <label htmlFor="transaction_date" className="block text-base font-medium text-gray-300 mb-3">
          Transaction Date *
        </label>
        <input
          type="datetime-local"
          name="transaction_date"
          id="transaction_date"
          defaultValue={new Date().toISOString().slice(0, 16)}
          required
          className={`w-full input-dark input-large ${
            errors.transaction_date ? 'ring-error-500 border-error-500' : ''
          }`}
        />
        {errors.transaction_date && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-2 flex items-center text-sm text-error-400"
          >
            <AlertCircle className="h-4 w-4 mr-1" />
            {errors.transaction_date}
          </motion.div>
        )}
      </motion.div>

      {/* Supplier/Customer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <label htmlFor="supplier_customer" className="block text-base font-medium text-gray-300 mb-3">
          {transactionType === 'stock_in' ? 'Supplier' : 'Customer'} *
        </label>
        <input
          type="text"
          name="supplier_customer"
          id="supplier_customer"
          required
          maxLength={200}
          className={`w-full input-dark input-large ${
            errors.supplier_customer ? 'ring-error-500 border-error-500' : ''
          }`}
          placeholder={`Enter ${transactionType === 'stock_in' ? 'supplier' : 'customer'} name`}
        />
        {errors.supplier_customer && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-2 flex items-center text-sm text-error-400"
          >
            <AlertCircle className="h-4 w-4 mr-1" />
            {errors.supplier_customer}
          </motion.div>
        )}
      </motion.div>

      {/* Reference Number */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <label htmlFor="reference_number" className="block text-base font-medium text-gray-300 mb-3">
          Reference Number (Optional)
        </label>
        <input
          type="text"
          name="reference_number"
          id="reference_number"
          maxLength={100}
          className="w-full input-dark input-large"
          placeholder="Enter invoice/receipt number"
        />
      </motion.div>

      {/* Notes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
      >
        <label htmlFor="notes" className="block text-base font-medium text-gray-300 mb-3">
          Notes (Optional)
        </label>
        <textarea
          name="notes"
          id="notes"
          rows={3}
          maxLength={1000}
          className="w-full input-dark input-large resize-none"
          placeholder="Add any additional notes about this transaction..."
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
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
          disabled={isSubmitting || !selectedItem || quantity <= 0}
          className="btn-primary flex items-center gap-2 min-w-[180px] px-6 sm:px-8 py-3 text-base sm:text-lg order-1 sm:order-2"
        >
          {isSubmitting ? (
            <>
              <LoadingSpinner size="sm" color="white" />
              Recording...
            </>
          ) : (
            'Record Transaction'
          )}
        </motion.button>
      </motion.div>
    </form>
  );
}