import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Hash, Barcode as BarcodeIcon, DollarSign, X, Search, Package, ArrowRight, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { Category, Item } from '../../lib/types';
import { generateSKU } from '../../lib/utils/sku';
import { getItems } from '../../lib/api/items';
import { createCategory } from '../../lib/api/categories';
import { getUnits, createUnit, Unit } from '../../lib/api/units';
import InlineCategoryForm from '../inventory/InlineCategoryForm';
import LoadingSpinner from '../ui/LoadingSpinner';
import CustomSelect from '../ui/CustomSelect';

export interface PurchaseItemData {
    item_id?: string;           // If selecting existing item
    item_name: string;
    category_id: string;
    sku: string;
    barcode?: string;
    quantity: number;
    purchase_rate: number;      // Cost from vendor
    sale_rate: number;          // Selling price
    unit: string;
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

type TabMode = 'select' | 'create';

export default function PurchaseItemBuilder({
    categories,
    onCategoriesUpdate,
    items,
    onItemsChange
}: PurchaseItemBuilderProps) {
    const [showItemForm, setShowItemForm] = useState(false);
    const [activeTab, setActiveTab] = useState<TabMode>('select');
    const [showCategoryForm, setShowCategoryForm] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    // Existing Items State
    const [allItems, setAllItems] = useState<Item[]>([]);
    const [filteredItems, setFilteredItems] = useState<Item[]>([]);
    const [isLoadingItems, setIsLoadingItems] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedItem, setSelectedItem] = useState<Item | null>(null);
    const [units, setUnits] = useState<Unit[]>([]);

    // New Item State
    const [newItem, setNewItem] = useState<PurchaseItemData>({
        item_name: '',
        category_id: '',
        sku: generateSKU(),
        barcode: '',
        quantity: 1,
        unit: 'pcs',
        purchase_rate: 0,
        sale_rate: 0,
        shelf_location: '',
        isNew: true
    });

    // Load available items and units on mount
    useEffect(() => {
        loadItems();
        loadUnits();
    }, []);

    // Filter items based on search
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredItems(allItems.slice(0, 10)); // Show specifically 10 for performance
        } else {
            const query = searchQuery.toLowerCase();
            const filtered = allItems.filter(item =>
                item.name.toLowerCase().includes(query) ||
                item.sku?.toLowerCase().includes(query) ||
                item.barcode?.toLowerCase().includes(query)
            ).slice(0, 20);
            setFilteredItems(filtered);
        }
    }, [searchQuery, allItems]);

    const loadItems = async () => {
        setIsLoadingItems(true);
        try {
            const result = await getItems(1000); // Fetch a good chunk of items
            setAllItems(result.items);
            setFilteredItems(result.items.slice(0, 10));
        } catch (error) {
            console.error('Failed to load items:', error);
            toast.error('Failed to load existing items');
        } finally {
            setIsLoadingItems(false);
        }
    };

    const loadUnits = async () => {
        const unitsData = await getUnits();
        setUnits(unitsData);
    };

    const handleUnitChange = async (val: string) => {
        // Check if unit exists
        const existingUnit = units.find(u => u.symbol === val);

        if (!existingUnit && val) {
            try {
                // Create new unit
                const newUnit = await createUnit(val);
                // Refresh units list
                await loadUnits();
                // Select the new unit's symbol
                setNewItem(prev => ({ ...prev, unit: newUnit.symbol }));
                toast.success(`Unit "${newUnit.name}" created`);
            } catch (error) {
                toast.error('Failed to create unit');
                setNewItem(prev => ({ ...prev, unit: val })); // Fallback to raw value
            }
        } else {
            setNewItem(prev => ({ ...prev, unit: val }));
        }
    };

    const handleSelectItem = (item: Item) => {
        setSelectedItem(item);

        // Safely handle location which might be an object
        let locationStr = '';
        if (typeof item.location === 'object' && item.location) {
            locationStr = item.location.shelf || '';
            if (item.location.rack) locationStr += ` / ${item.location.rack}`;
        } else if (typeof item.location === 'string') {
            locationStr = item.location;
        }

        // Pre-fill form with existing item details
        setNewItem({
            item_id: item.id,
            item_name: item.name,
            category_id: item.category_id,
            sku: item.sku || '',
            barcode: item.barcode || '',
            quantity: 1,
            unit: item.unit || 'pcs',
            purchase_rate: item.purchase_rate || 0,
            sale_rate: item.sale_rate || 0,
            shelf_location: locationStr,
            isNew: false
        });
    };

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
        resetForm();
        toast.success(newItem.isNew ? 'New item added to purchase' : 'Stock added to purchase');
    };

    const resetForm = () => {
        setNewItem({
            item_name: '',
            category_id: '',
            sku: generateSKU(),
            barcode: '',
            quantity: 1,
            unit: 'pcs',
            purchase_rate: 0,
            sale_rate: 0,
            shelf_location: '',
            isNew: true
        });
        setSelectedItem(null);
        setSearchQuery('');
        setShowItemForm(false);
        setActiveTab('select'); // Reset to select tab
    };

    const handleRemoveItem = (index: number) => {
        const updated = items.filter((_, i) => i !== index);
        onItemsChange(updated);
    };

    const handleEditItem = (index: number) => {
        const item = items[index];
        setEditingIndex(index);
        setNewItem({ ...item });
        setActiveTab('create');
        setShowItemForm(true);
        setSelectedItem(null);
    };

    const handleSaveEditedItem = () => {
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

        if (editingIndex !== null) {
            const updated = [...items];
            updated[editingIndex] = { ...newItem };
            onItemsChange(updated);
            setEditingIndex(null);
            resetForm();
            toast.success('Item updated');
        }
    };

    const handleCreateCategory = async (data: { name: string; description: string; color: string; created_by: string }) => {
        try {
            const newCategory = await createCategory(data);
            setNewItem(prev => ({ ...prev, category_id: newCategory.id }));
            setShowCategoryForm(false);
            onCategoriesUpdate();
            toast.success(`Category "${newCategory.name}" created`);
        } catch (error) {
            console.error('Failed to create category:', error);
            throw error;
        }
    };

    const calculateItemTotal = (item: PurchaseItemData) => {
        return item.quantity * item.purchase_rate;
    };

    const calculateGrandTotal = () => {
        return items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold flex items-center gap-2 text-foreground">
                    <Package className="w-6 h-6 text-primary" />
                    Purchase Items
                </h3>
                {!showItemForm && (
                    <button
                        onClick={() => setShowItemForm(true)}
                        className="bg-primary text-primary-foreground px-4 py-2 rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all font-bold flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Add Items
                    </button>
                )}
            </div>

            {/* Add Item Form / Selection Area */}
            <AnimatePresence mode="wait">
                {showItemForm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
                        animate={{ opacity: 1, height: 'auto', transitionEnd: { overflow: 'visible' } }}
                        exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                        className="card-theme rounded-2xl border border-border/50"
                        style={{ contain: 'none' }}
                    >
                        {/* Header & Tabs */}
                        <div className="bg-secondary/30 border-b border-border/50 p-4 flex items-center justify-between">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => { setActiveTab('select'); setSelectedItem(null); }}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'select'
                                        ? 'bg-primary text-primary-foreground shadow-md'
                                        : 'text-muted-foreground hover:bg-secondary'
                                        }`}
                                >
                                    Select Existing Product
                                </button>
                                <button
                                    onClick={() => {
                                        setActiveTab('create');
                                        setSelectedItem(null);
                                        // Fully reset form for new item
                                        setNewItem({
                                            item_name: '',
                                            category_id: '',
                                            sku: generateSKU(),
                                            barcode: '',
                                            quantity: 1,
                                            unit: 'pcs',
                                            purchase_rate: 0,
                                            sale_rate: 0,
                                            shelf_location: '',
                                            isNew: true
                                        });
                                    }}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'create'
                                        ? 'bg-primary text-primary-foreground shadow-md'
                                        : 'text-muted-foreground hover:bg-secondary'
                                        }`}
                                >
                                    Create New Product
                                </button>
                            </div>
                            <button
                                onClick={resetForm}
                                className="p-2 hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6">
                            {/* SELECT EXISTING ITEM MODE */}
                            {activeTab === 'select' && !selectedItem && (
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="space-y-4"
                                >
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Search by name, SKU, or barcode..."
                                            className="w-full pl-11 pr-4 py-3 bg-secondary/30 border border-border/50 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                            autoFocus
                                        />
                                    </div>

                                    {isLoadingItems ? (
                                        <div className="py-12 flex justify-center">
                                            <LoadingSpinner size="lg" />
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                            {filteredItems.length > 0 ? (
                                                filteredItems.map(item => (
                                                    <button
                                                        key={item.id}
                                                        onClick={() => handleSelectItem(item)}
                                                        className="flex items-center justify-between p-3 rounded-xl border border-border/30 bg-card hover:bg-secondary/50 hover:border-primary/30 transition-all group text-left"
                                                    >
                                                        <div>
                                                            <h4 className="font-bold text-foreground group-hover:text-primary transition-colors">{item.name}</h4>
                                                            <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                                                                <span className="bg-secondary px-2 py-0.5 rounded font-mono">{item.sku || 'No SKU'}</span>
                                                                <span>Stock: {item.current_quantity || 0} {item.unit}</span>
                                                            </div>
                                                        </div>
                                                        <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-1" />
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="text-center py-8 text-muted-foreground">
                                                    <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                                    <p>No items found matching "{searchQuery}"</p>
                                                    <button
                                                        onClick={() => setActiveTab('create')}
                                                        className="text-primary font-bold hover:underline mt-2 text-sm"
                                                    >
                                                        Create "{searchQuery}" as new product?
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {/* CREATE NEW OR ADD STOCK FORM */}
                            {(activeTab === 'create' || selectedItem) && (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="space-y-6"
                                >
                                    {selectedItem && (
                                        <div className="flex items-center justify-between bg-primary/5 p-3 rounded-xl border border-primary/10 mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-primary/20 text-primary rounded-lg">
                                                    <Package className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Adding Stock To</p>
                                                    <p className="font-bold text-lg">{selectedItem.name}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setSelectedItem(null)}
                                                className="text-xs text-muted-foreground hover:text-foreground underline"
                                            >
                                                Change Item
                                            </button>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Basic Info - Always editable */}
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-sm font-medium text-muted-foreground">Product Name *</label>
                                            <input
                                                type="text"
                                                value={newItem.item_name}
                                                onChange={(e) => setNewItem(prev => ({ ...prev, item_name: e.target.value }))}
                                                className="w-full px-4 py-2.5 bg-secondary/30 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                                                placeholder="e.g. Samsung Galaxy S24"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <CustomSelect
                                                label="Category *"
                                                value={newItem.category_id}
                                                onChange={(val) => setNewItem(prev => ({ ...prev, category_id: val }))}
                                                options={categories.map(cat => ({ value: cat.id, label: cat.name }))}
                                                placeholder="Select Category"
                                                searchable
                                                className="flex-1"
                                            />
                                            <div className="flex justify-end">
                                                <button
                                                    onClick={() => setShowCategoryForm(true)}
                                                    className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
                                                >
                                                    <Plus className="w-3 h-3" /> Create New Category
                                                </button>
                                            </div>
                                        </div>

                                        {/* Inline Category Form */}
                                        <AnimatePresence>
                                            {showCategoryForm && (
                                                <div className="md:col-span-2">
                                                    <InlineCategoryForm
                                                        onSubmit={handleCreateCategory}
                                                        onCancel={() => setShowCategoryForm(false)}
                                                    />
                                                </div>
                                            )}
                                        </AnimatePresence>

                                        {/* SKU & Barcode - ReadOnly if existing */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-muted-foreground">SKU / Code</label>
                                            <div className="relative">
                                                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                <input
                                                    type="text"
                                                    value={newItem.sku}
                                                    onChange={(e) => setNewItem(prev => ({ ...prev, sku: e.target.value }))}
                                                    className={`w-full pl-10 pr-4 py-2.5 bg-secondary/30 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-mono ${!newItem.isNew ? 'opacity-70 cursor-not-allowed' : ''}`}
                                                    readOnly={!newItem.isNew}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-muted-foreground">Barcode (Optional)</label>
                                            <div className="relative">
                                                <BarcodeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                <input
                                                    type="text"
                                                    value={newItem.barcode}
                                                    onChange={(e) => setNewItem(prev => ({ ...prev, barcode: e.target.value }))}
                                                    className="w-full pl-10 pr-4 py-2.5 bg-secondary/30 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                                                    placeholder="Scan barcode..."
                                                />
                                            </div>
                                        </div>

                                        {/* Purchase Details - Always Editable */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-muted-foreground">Quantity *</label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={newItem.quantity || ''}
                                                onChange={(e) => setNewItem(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                                                className="w-full px-4 py-2.5 bg-secondary/30 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-bold text-lg"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <CustomSelect
                                                label="Unit"
                                                value={newItem.unit}
                                                onChange={handleUnitChange}
                                                options={units.length > 0 ? units.map(u => ({ value: u.symbol, label: `${u.name} (${u.symbol})` })) : [
                                                    { value: 'pcs', label: 'Pieces (pcs)' },
                                                    { value: 'kg', label: 'Kilogram (kg)' },
                                                    { value: 'ltr', label: 'Liter (ltr)' },
                                                    { value: 'box', label: 'Box' }
                                                ]}
                                                placeholder="Unit"
                                                creatable
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-muted-foreground">Purchase Rate (Cost) *</label>
                                            <div className="relative">
                                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={newItem.purchase_rate || ''}
                                                    onChange={(e) => setNewItem(prev => ({ ...prev, purchase_rate: parseFloat(e.target.value) || 0 }))}
                                                    className="w-full pl-10 pr-4 py-2.5 bg-secondary/30 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-medium"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-muted-foreground">Sale Rate (Price) *</label>
                                            <div className="relative">
                                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={newItem.sale_rate || ''}
                                                    onChange={(e) => setNewItem(prev => ({ ...prev, sale_rate: parseFloat(e.target.value) || 0 }))}
                                                    className="w-full pl-10 pr-4 py-2.5 bg-secondary/30 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-medium"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-muted-foreground">Shelf / Location</label>
                                            <input
                                                type="text"
                                                value={newItem.shelf_location}
                                                onChange={(e) => setNewItem(prev => ({ ...prev, shelf_location: e.target.value }))}
                                                className="w-full px-4 py-2.5 bg-secondary/30 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                                                placeholder="e.g. Aisle 3"
                                            />
                                        </div>
                                    </div>

                                    {/* Profit Preview */}
                                    {newItem.purchase_rate > 0 && newItem.sale_rate > 0 && (
                                        <div className="bg-card p-4 rounded-xl border border-border/50 flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-muted-foreground">Estimated Margin</p>
                                                <p className={`text-xl font-bold ${newItem.sale_rate > newItem.purchase_rate ? 'text-success' : 'text-destructive'}`}>
                                                    {newItem.purchase_rate > 0 ? (((newItem.sale_rate - newItem.purchase_rate) / newItem.purchase_rate) * 100).toFixed(1) : 0}%
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-muted-foreground">Profit per unit</p>
                                                <p className={`text-xl font-bold ${newItem.sale_rate > newItem.purchase_rate ? 'text-success' : 'text-destructive'}`}>
                                                    Rs {(newItem.sale_rate - newItem.purchase_rate).toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex gap-4 pt-4 border-t border-border/50">
                                        <button
                                            onClick={() => { setSelectedItem(null); setEditingIndex(null); if (activeTab === 'select') resetForm(); else setActiveTab('select'); }}
                                            className="flex-1 py-3 rounded-xl border border-border hover:bg-secondary transition-colors font-medium"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={editingIndex !== null ? handleSaveEditedItem : handleAddItem}
                                            className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all font-bold"
                                        >
                                            {editingIndex !== null ? 'Save Changes' : selectedItem ? 'Add Stock to Purchase' : 'Create & Add Item'}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Added Items List */}
            {items.length > 0 ? (
                <div className="space-y-3">
                    {items.map((item, index) => (
                        <motion.div
                            key={index}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-card border border-border/50 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow group"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                            <Package className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-foreground text-lg">{item.item_name}</h4>
                                            <div className="flex items-center gap-2 text-xs">
                                                {item.isNew && (
                                                    <span className="bg-primary/20 text-primary px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">New Product</span>
                                                )}
                                                <span className="text-muted-foreground font-mono bg-secondary/50 px-2 py-0.5 rounded">{item.sku}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 bg-secondary/20 p-3 rounded-lg">
                                        <div>
                                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Quantity</p>
                                            <p className="font-bold text-lg">{item.quantity}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Unit Cost</p>
                                            <p className="font-medium">Rs {item.purchase_rate.toFixed(2)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Selling Price</p>
                                            <p className="font-medium">Rs {item.sale_rate.toFixed(2)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Line Total</p>
                                            <p className="font-bold text-lg text-primary">Rs {calculateItemTotal(item).toFixed(2)}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 ml-4">
                                    <button
                                        onClick={() => handleEditItem(index)}
                                        className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                        title="Edit Item"
                                    >
                                        <Pencil className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => handleRemoveItem(index)}
                                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                        title="Remove Item"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}

                    <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6 mt-6">
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-primary font-bold uppercase tracking-wider text-sm mb-1">Total Purchase Amount</p>
                                <p className="text-sm text-muted-foreground">
                                    {items.length} item{items.length !== 1 ? 's' : ''} • {items.reduce((sum, item) => sum + item.quantity, 0)} units total
                                </p>
                            </div>
                            <p className="text-4xl font-bold text-primary">
                                Rs {calculateGrandTotal().toFixed(2)}
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                !showItemForm && (
                    <div className="text-center py-16 bg-card/30 border border-border/30 border-dashed rounded-[2rem] flex flex-col items-center justify-center group cursor-pointer hover:bg-card/50 transition-colors"
                        onClick={() => setShowItemForm(true)}
                    >
                        <div className="p-4 rounded-full bg-secondary/50 mb-4 group-hover:scale-110 transition-transform duration-300">
                            <Plus className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-2">No Items Added Yet</h3>
                        <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                            Start building your purchase order by adding items. You can select existing products or create new ones.
                        </p>
                        <button className="text-primary font-bold hover:underline flex items-center gap-2">
                            Add Items Now <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                )
            )}
        </div>
    );
}
