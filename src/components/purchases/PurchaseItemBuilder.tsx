import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Hash, Barcode as BarcodeIcon, DollarSign, X } from 'lucide-react';
import { toast } from 'sonner';
import { Category, EnhancedItem } from '../../lib/types';
import { generateSKU } from '../../lib/utils/sku';
import { useAuthStore } from '../../lib/store';
import InlineCategoryForm from './InlineCategoryForm';
import LoadingSpinner from '../ui/LoadingSpinner';

export interface PurchaseItemData {
    item_id?: string;           // If selecting existing item
    item_name: string;
    category_id: string;
    sku: string;
    barcode?: string;
    quantity: number;
    purchase_rate: number;      // Cost from vendor
    sale_rate: number;          // Selling price
    expiry_date?: Date;
    shelf_location?: string;
    isNew: boolean;             // Flag to indicate if this is a new item
}

interface PurchaseItemBuilderProps {
    categories: Category[];
    onCategoriesUpdate: () => void;
    items: PurchaseItemData[];
    onItemsChange: (items: PurchaseItemData[]) => void;
}

export default function PurchaseItemBuilder({
    categories,
    onCategoriesUpdate,
    items,
    onItemsChange
}: PurchaseItemBuilderProps) {
    const [showItemForm, setShowItemForm] = useState(false);
    const [showCategoryForm, setShowCategoryForm] = useState(false);
    const user = useAuthStore(state => state.user);

    const [newItem, setNewItem] = useState<PurchaseItemData>({
        item_name: '',
        category_id: '',
        sku: generateSKU(),
        barcode: '',
        quantity: 1,
        purchase_rate: 0,
        sale_rate: 0,
        shelf_location: '',
        isNew: true
    });

    const handleAddItem = () => {
        if (!newItem.item_name.trim()) {
            toast.error('Please enter item name');
            return;
        }
        if (!newItem.category_id) {
            toast.error('Please select a category');
            return;
        }
        if (newItem.quantity <= 0) {
            toast.error('Quantity must be greater than 0');
            return;
        }
        if (newItem.purchase_rate <= 0) {
            toast.error('Purchase rate must be greater than 0');
            return;
        }
        if (newItem.sale_rate <= 0) {
            toast.error('Sale rate must be greater than 0');
            return;
        }

        onItemsChange([...items, { ...newItem }]);

        // Reset form
        setNewItem({
            item_name: '',
            category_id: '',
            sku: generateSKU(),
            barcode: '',
            quantity: 1,
            purchase_rate: 0,
            sale_rate: 0,
            shelf_location: '',
            isNew: true
        });
        setShowItemForm(false);
        toast.success('Item added to purchase');
    };

    const handleRemoveItem = (index: number) => {
        const updated = items.filter((_, i) => i !== index);
        onItemsChange(updated);
    };

    const handleCategoryCreated = (categoryId: string, categoryName: string) => {
        setNewItem(prev => ({ ...prev, category_id: categoryId }));
        setShowCategoryForm(false);
        onCategoriesUpdate();
        toast.success(`Category "${categoryName}" created`);
    };

    const calculateItemTotal = (item: PurchaseItemData) => {
        return item.quantity * item.purchase_rate;
    };

    const calculateGrandTotal = () => {
        return items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Purchase Items</h3>
                {!showItemForm && (
                    <button
                        onClick={() => setShowItemForm(true)}
                        className="btn-primary text-sm flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Add Item
                    </button>
                )}
            </div>

            {/* Inline Item Creation Form */}
            <AnimatePresence>
                {showItemForm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-dark-800/50 border border-success-500/30 rounded-lg p-4"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-semibold text-success-400">Add New Item</h4>
                            <button
                                onClick={() => setShowItemForm(false)}
                                className="p-1 hover:bg-dark-700 rounded transition-colors"
                            >
                                <X className="w-4 h-4 text-gray-400" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Item Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Product Name *
                                </label>
                                <input
                                    type="text"
                                    value={newItem.item_name}
                                    onChange={(e) => setNewItem(prev => ({ ...prev, item_name: e.target.value }))}
                                    placeholder="e.g., Samsung Galaxy S24"
                                    className="w-full input-dark"
                                />
                            </div>

                            {/* Category Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Category *
                                </label>
                                <div className="flex gap-2">
                                    <select
                                        value={newItem.category_id}
                                        onChange={(e) => setNewItem(prev => ({ ...prev, category_id: e.target.value }))}
                                        className="flex-1 input-dark"
                                    >
                                        <option value="">Select category</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={() => setShowCategoryForm(true)}
                                        className="btn-secondary px-3"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Inline Category Form */}
                            <AnimatePresence>
                                {showCategoryForm && (
                                    <InlineCategoryForm
                                        onCategoryCreated={handleCategoryCreated}
                                        onCancel={() => setShowCategoryForm(false)}
                                    />
                                )}
                            </AnimatePresence>

                            {/* SKU and Barcode */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        SKU / Product Code *
                                    </label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="text"
                                                value={newItem.sku}
                                                onChange={(e) => setNewItem(prev => ({ ...prev, sku: e.target.value }))}
                                                className="w-full input-dark pl-10 font-mono text-sm"
                                                placeholder="PROD-XXXXXX"
                                            />
                                        </div>
                                        <button
                                            onClick={() => setNewItem(prev => ({ ...prev, sku: generateSKU() }))}
                                            className="btn-secondary px-3 text-xs"
                                        >
                                            Generate
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Barcode (Optional)
                                    </label>
                                    <div className="relative">
                                        <BarcodeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            value={newItem.barcode}
                                            onChange={(e) => setNewItem(prev => ({ ...prev, barcode: e.target.value }))}
                                            className="w-full input-dark pl-10"
                                            placeholder="Enter barcode"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Quantity and Pricing */}
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Quantity *
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={newItem.quantity || ''}
                                        onChange={(e) => setNewItem(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                                        className="w-full input-dark"
                                        placeholder="0"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Purchase Rate * <span className="text-xs text-gray-500">(Cost)</span>
                                    </label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={newItem.purchase_rate || ''}
                                            onChange={(e) => setNewItem(prev => ({ ...prev, purchase_rate: parseFloat(e.target.value) || 0 }))}
                                            className="w-full input-dark pl-10"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Sale Rate * <span className="text-xs text-gray-500">(Selling)</span>
                                    </label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={newItem.sale_rate || ''}
                                            onChange={(e) => setNewItem(prev => ({ ...prev, sale_rate: parseFloat(e.target.value) || 0 }))}
                                            className="w-full input-dark pl-10"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Profit Margin Indicator */}
                            {newItem.purchase_rate > 0 && newItem.sale_rate > 0 && (
                                <div className="bg-dark-900/50 rounded-lg p-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Profit per unit:</span>
                                        <span className={`font-semibold ${newItem.sale_rate > newItem.purchase_rate ? 'text-success-400' : 'text-error-400'}`}>
                                            Rs {(newItem.sale_rate - newItem.purchase_rate).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm mt-1">
                                        <span className="text-gray-400">Margin:</span>
                                        <span className={`font-semibold ${newItem.sale_rate > newItem.purchase_rate ? 'text-success-400' : 'text-error-400'}`}>
                                            {newItem.purchase_rate > 0 ? (((newItem.sale_rate - newItem.purchase_rate) / newItem.purchase_rate) * 100).toFixed(1) : 0}%
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Shelf Location */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Shelf Location (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={newItem.shelf_location}
                                    onChange={(e) => setNewItem(prev => ({ ...prev, shelf_location: e.target.value }))}
                                    className="w-full input-dark"
                                    placeholder="e.g., Aisle 3, Shelf B"
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={() => setShowItemForm(false)}
                                    className="btn-secondary flex-1"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddItem}
                                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add to Purchase
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Items List */}
            {items.length > 0 ? (
                <div className="space-y-2">
                    {items.map((item, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-dark-800 border border-dark-700 rounded-lg p-4"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h4 className="text-white font-semibold">{item.item_name}</h4>
                                        {item.isNew && (
                                            <span className="text-xs bg-success-500/20 text-success-400 px-2 py-0.5 rounded">
                                                New
                                            </span>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                        <div>
                                            <span className="text-gray-400">SKU:</span>
                                            <span className="text-white font-mono ml-2">{item.sku}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400">Qty:</span>
                                            <span className="text-white ml-2">{item.quantity}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400">Cost:</span>
                                            <span className="text-white ml-2">Rs {item.purchase_rate.toFixed(2)}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400">Sale:</span>
                                            <span className="text-white ml-2">Rs {item.sale_rate.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    <div className="mt-2 text-sm">
                                        <span className="text-gray-400">Line Total:</span>
                                        <span className="text-primary-400 font-bold ml-2">
                                            Rs {calculateItemTotal(item).toFixed(2)}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleRemoveItem(index)}
                                    className="p-2 text-gray-400 hover:text-error-400 hover:bg-error-500/10 rounded transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    ))}

                    {/* Grand Total */}
                    <div className="bg-primary-500/10 border border-primary-500/30 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-300 font-medium">Total Purchase Cost:</span>
                            <span className="text-2xl font-bold text-primary-400">
                                Rs {calculateGrandTotal().toFixed(2)}
                            </span>
                        </div>
                        <div className="text-sm text-gray-400 mt-1">
                            {items.length} item{items.length !== 1 ? 's' : ''} • {items.reduce((sum, item) => sum + item.quantity, 0)} units
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center py-12 bg-dark-800/30 border border-dark-700 rounded-lg">
                    <Plus className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">No items added yet</p>
                    <p className="text-sm text-gray-500 mt-1">Click "Add Item" to start building your purchase</p>
                </div>
            )}
        </div>
    );
}
