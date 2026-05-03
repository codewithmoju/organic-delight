import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Barcode, ChevronDown, ChevronUp, Box, Plus, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Category } from '../../lib/types';
import { getUnits, createUnit, Unit } from '../../lib/api/units';
import { createCategory } from '../../lib/api/categories';
import CustomSelect from '../ui/CustomSelect';
import { useAuthStore } from '../../lib/store';

interface QuickItemFormProps {
    categories: Category[];
    onSubmit: (data: {
        name: string;
        description: string;
        category_id: string;
        base_price: number;
        selling_price: number;
        unit_price: number;
        unit: string;
        barcode?: string;
        sku?: string;
        supplier?: string;
        location?: string;
        reorder_point: number;
        initial_stock?: number;
        created_by: string;
    }) => Promise<void>;
    onCancel: () => void;
    onCategoryCreated?: (category: Category) => void;
}

interface QuickItemFormData {
    category_id: string;
    name: string;
    description: string;
    unit: string;
    base_price: number | '';
    selling_price: number | '';
    total_stock: number | '';
    barcode: string;
    sku: string;
    reorder_point: number | '';
}

export default function QuickItemForm({ categories, onSubmit, onCancel, onCategoryCreated }: QuickItemFormProps) {
    const { t } = useTranslation();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [units, setUnits] = useState<Unit[]>([]);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const user = useAuthStore(state => state.user);
    const profile = useAuthStore(state => state.profile);

    // Inline category creation state
    const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);
    const [localCategories, setLocalCategories] = useState<Category[]>(categories);

    const [formData, setFormData] = useState<QuickItemFormData>({
        category_id: '',
        name: '',
        description: '',
        unit: 'pcs',
        base_price: '',
        selling_price: '',
        total_stock: '',
        barcode: '',
        sku: '',
        reorder_point: 10
    });

    const loadUnits = async () => {
        const unitsData = await getUnits();
        setUnits(unitsData);
    };

    useEffect(() => {
        loadUnits();
    }, []);

    // Keep localCategories in sync with parent categories prop
    useEffect(() => {
        setLocalCategories(categories);
    }, [categories]);

    const handleCreateCategory = async () => {
        const name = newCategoryName.trim();
        if (!name) return;
        setIsCreatingCategory(true);
        try {
            const userId = user?.uid || profile?.id || 'unknown';
            const newCat = await createCategory({ name, description: '', color: '#6366f1', created_by: userId });
            const updatedCategories = [...localCategories, newCat];
            setLocalCategories(updatedCategories);
            updateFormData('category_id', newCat.id);
            setNewCategoryName('');
            setShowNewCategoryForm(false);
            toast.success(`Category "${newCat.name}" created`);
            onCategoryCreated?.(newCat);
        } catch (error: any) {
            toast.error(error.message || 'Failed to create category');
        } finally {
            setIsCreatingCategory(false);
        }
    };

    const handleUnitChange = async (val: string) => {
        const existingUnit = units.find(u => u.symbol === val);

        if (!existingUnit && val) {
            try {
                const newUnit = await createUnit(val);
                await loadUnits();
                updateFormData('unit', newUnit.symbol);
                toast.success(`Unit "${newUnit.name}" created`);
            } catch (error) {
                toast.error('Failed to create unit');
                updateFormData('unit', val);
            }
        } else {
            updateFormData('unit', val);
        }
    };

    const updateFormData = (field: keyof QuickItemFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const validate = (): boolean => {
        const newErrors: { [key: string]: string } = {};

        if (!formData.name.trim()) newErrors.name = t('items.form.nameRequired', 'Product name is required');
        if (!formData.category_id) newErrors.category_id = t('items.wizard.errors.categoryRequired', 'Category is required');
        if (formData.base_price === '' || Number(formData.base_price) < 0) newErrors.base_price = 'Valid base price is required';
        if (formData.selling_price === '' || Number(formData.selling_price) <= 0) newErrors.selling_price = t('items.wizard.errors.priceRequired', 'Valid selling price is required');
        if (Number(formData.total_stock) < 0) newErrors.total_stock = t('items.wizard.errors.stockRequired', 'Stock cannot be negative');

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setIsSubmitting(true);
        try {
            // Auto-generate SKU if empty
            const finalSku = formData.sku.trim() || `SKU-${Date.now().toString().slice(-6)}`;

            const submitData: any = {
                name: formData.name.trim(),
                description: formData.description.trim() || formData.name.trim(), // Fallback description
                category_id: formData.category_id,
                unit: formData.unit,
                base_price: Number(formData.base_price),
                selling_price: Number(formData.selling_price),
                unit_price: Number(formData.selling_price),
                sku: finalSku,
                reorder_point: Number(formData.reorder_point) || 10,
                initial_stock: Number(formData.total_stock) || 0,
                created_by: user?.uid || profile?.id || 'unknown'
            };

            // Only add barcode if it exists and is not empty
            if (formData.barcode && formData.barcode.trim()) {
                submitData.barcode = formData.barcode.trim();
            }

            await onSubmit(submitData);
            // specific success message handled by parent
        } catch (error) {
            console.error(error);
            toast.error(t('items.messages.createError', 'Failed to create item'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Primary Information */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Name */}
                    <div className="col-span-1 sm:col-span-2">
                        <label className="block text-sm font-semibold text-foreground/80 mb-2">{t('items.form.name', 'Product Name')} *</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => updateFormData('name', e.target.value)}
                            className={`w-full h-12 px-4 rounded-xl bg-background border-2 border-border/60 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all duration-300 ${errors.name ? 'border-error-500 focus:border-error-500' : ''}`}
                            placeholder={t('items.form.namePlaceholder', 'e.g., Milk 1L, Lay\'s Chips')}
                            autoFocus
                        />
                        {errors.name && <p className="text-error-500 text-xs mt-1 font-medium ml-1">{errors.name}</p>}
                    </div>

                    {/* Category */}
                    <div>
                        <CustomSelect
                            label={t('items.form.category', 'Category') + " *"}
                            value={formData.category_id}
                            onChange={(value) => updateFormData('category_id', value)}
                            options={localCategories.map(cat => ({ value: cat.id, label: cat.name }))}
                            placeholder={t('items.form.selectCategory', 'Select Category')}
                            error={errors.category_id}
                            searchable
                        />
                        {/* Inline new category creation */}
                        <AnimatePresence>
                            {showNewCategoryForm ? (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mt-2 overflow-hidden"
                                >
                                    <div className="flex gap-2 items-center">
                                        <input
                                            type="text"
                                            value={newCategoryName}
                                            onChange={(e) => setNewCategoryName(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') { e.preventDefault(); handleCreateCategory(); }
                                                if (e.key === 'Escape') { setShowNewCategoryForm(false); setNewCategoryName(''); }
                                            }}
                                            placeholder="New category name..."
                                            className="flex-1 h-9 px-3 rounded-lg bg-background border-2 border-primary/40 focus:border-primary/70 focus:ring-2 focus:ring-primary/10 text-sm transition-all"
                                            autoFocus
                                            disabled={isCreatingCategory}
                                        />
                                        <button
                                            type="button"
                                            onClick={handleCreateCategory}
                                            disabled={isCreatingCategory || !newCategoryName.trim()}
                                            className="h-9 w-9 flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors flex-shrink-0"
                                            title="Create category"
                                        >
                                            {isCreatingCategory ? (
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <Check className="w-4 h-4" />
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setShowNewCategoryForm(false); setNewCategoryName(''); }}
                                            className="h-9 w-9 flex items-center justify-center rounded-lg bg-secondary hover:bg-secondary/80 text-muted-foreground transition-colors flex-shrink-0"
                                            title="Cancel"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.button
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    type="button"
                                    onClick={() => setShowNewCategoryForm(true)}
                                    className="mt-1.5 flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    {t('categories.addNew', 'Create new category')}
                                </motion.button>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Unit */}
                    <div>
                        <CustomSelect
                            label={t('items.wizard.price.perUnit', 'Unit')}
                            value={formData.unit}
                            onChange={handleUnitChange}
                            options={units.length > 0 ? units.map(u => ({ value: u.symbol, label: `${u.name} (${u.symbol})` })) : [
                                { value: 'pcs', label: 'Pieces (pcs)' },
                                { value: 'kg', label: 'Kilogram (kg)' },
                                { value: 'ltr', label: 'Liter (ltr)' },
                                { value: 'box', label: 'Box' }
                            ]}
                            placeholder="Select Unit"
                            creatable
                        />
                    </div>

                    {/* Base Price */}
                    <div>
                        <label className="block text-sm font-semibold text-foreground/80 mb-2">Base Price *</label>
                        <div className="relative group">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none">PKR</span>
                            <input
                                type="number"
                                value={formData.base_price}
                                onChange={(e) => updateFormData('base_price', e.target.value)}
                                className={`w-full h-12 pl-14 pr-4 rounded-xl bg-background border-2 border-border/60 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all duration-300 ${errors.base_price ? 'border-error-500' : ''}`}
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                            />
                        </div>
                        {errors.base_price && <p className="text-error-500 text-xs mt-1 font-medium ml-1">{errors.base_price}</p>}
                    </div>

                    {/* Selling Price */}
                    <div>
                        <label className="block text-sm font-semibold text-foreground/80 mb-2">Selling Price *</label>
                        <div className="relative group">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none">PKR</span>
                            <input
                                type="number"
                                value={formData.selling_price}
                                onChange={(e) => updateFormData('selling_price', e.target.value)}
                                className={`w-full h-12 pl-14 pr-4 rounded-xl bg-background border-2 border-border/60 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all duration-300 ${errors.selling_price ? 'border-error-500' : ''}`}
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                            />
                        </div>
                        {errors.selling_price && <p className="text-error-500 text-xs mt-1 font-medium ml-1">{errors.selling_price}</p>}
                        {Number(formData.selling_price || 0) < Number(formData.base_price || 0) && (
                            <p className="text-warning-500 text-xs mt-1 font-medium ml-1">
                                Selling price is below base price
                            </p>
                        )}
                    </div>

                    {/* Initial Stock */}
                    <div>
                        <label className="block text-sm font-semibold text-foreground/80 mb-2">{t('items.wizard.stock.initialStock', 'Initial Stock')}</label>
                        <div className="relative group">
                            <Box className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <input
                                type="number"
                                value={formData.total_stock}
                                onChange={(e) => updateFormData('total_stock', e.target.value)}
                                className={`w-full h-12 pl-10 pr-4 rounded-xl bg-background border-2 border-border/60 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all duration-300 ${errors.total_stock ? 'border-error-500' : ''}`}
                                placeholder="0"
                                min="0"
                            />
                        </div>
                        {errors.total_stock && <p className="text-error-500 text-xs mt-1 font-medium ml-1">{errors.total_stock}</p>}
                    </div>
                </div>

                {/* Advanced Toggle */}
                <div className="pt-2">
                    <button
                        type="button"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="flex items-center gap-2 text-sm text-primary font-semibold hover:text-primary/80 transition-colors bg-primary/10 px-4 py-2 rounded-lg"
                    >
                        {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        {showAdvanced ? t('common.hide', 'Hide Advanced Options') : t('common.show', 'Show Advanced Options (Barcode, SKU)')}
                    </button>
                </div>

                {/* Advanced Fields */}
                <AnimatePresence>
                    {showAdvanced && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden space-y-6 pt-2"
                        >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-foreground/80 mb-2">{t('items.wizard.stock.barcode', 'Barcode')}</label>
                                    <div className="relative group">
                                        <Barcode className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                        <input
                                            type="text"
                                            value={formData.barcode}
                                            onChange={(e) => updateFormData('barcode', e.target.value)}
                                            className="w-full h-12 pl-10 pr-4 rounded-xl bg-background border-2 border-border/60 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all duration-300"
                                            placeholder={t('items.wizard.stock.barcodePlaceholder', 'Scan or enter barcode')}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-foreground/80 mb-2">SKU</label>
                                    <input
                                        type="text"
                                        value={formData.sku}
                                        onChange={(e) => updateFormData('sku', e.target.value)}
                                        className="w-full h-12 px-4 rounded-xl bg-background border-2 border-border/60 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all duration-300"
                                        placeholder="Optional (Auto-generated if empty)"
                                    />
                                </div>

                                <div className="col-span-1 sm:col-span-2">
                                    <label className="block text-sm font-semibold text-foreground/80 mb-2">{t('items.form.description', 'Description')}</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => updateFormData('description', e.target.value)}
                                        className="w-full min-h-[100px] p-4 rounded-xl bg-background border-2 border-border/60 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all duration-300 resize-none"
                                        placeholder={t('items.form.descriptionPlaceholder', 'Product details...')}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-6 border-t border-border/50">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-6 py-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary font-medium transition-all duration-200"
                    >
                        {t('common.cancel', 'Cancel')}
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn-primary flex items-center gap-2 px-8 py-3 rounded-xl shadow-lg hover:shadow-primary/25 disabled:opacity-50 disabled:shadow-none"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>{t('items.form.creating', 'Saving...')}</span>
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                <span>{t('items.form.create', 'Save Item')}</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
