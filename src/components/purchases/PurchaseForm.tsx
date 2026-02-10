import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, ArrowLeft, CheckCircle2, ShoppingBag, Calendar, Receipt } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Vendor, Category } from '../../lib/types';
import { getCategories } from '../../lib/api/categories';
import { createPurchase } from '../../lib/api/purchases';
import { createItem } from '../../lib/api/items';
import { useAuthStore } from '../../lib/store';
import { toast } from 'sonner';
import { formatCurrency } from '../../lib/utils/notifications';
import { generatePurchaseBillId } from '../../lib/utils/billId';
import VendorSelector from './VendorSelector';
import PurchaseItemBuilder, { PurchaseItemData } from './PurchaseItemBuilder';
import LoadingSpinner from '../ui/LoadingSpinner';



interface PurchaseFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function PurchaseForm({ isOpen, onClose, onSuccess }: PurchaseFormProps) {
    const { t } = useTranslation();
    const profile = useAuthStore(state => state.profile);
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Step 1: Vendor
    const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

    // Step 2: Items
    const [categories, setCategories] = useState<Category[]>([]);
    const [purchaseItems, setPurchaseItems] = useState<PurchaseItemData[]>([]);

    // Step 3: Summary
    const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
    const [billNumber, setBillNumber] = useState('');
    const [paymentStatus, setPaymentStatus] = useState<'paid' | 'partial' | 'unpaid'>('unpaid');
    const [paidAmount, setPaidAmount] = useState(0);
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (isOpen) {
            loadCategories();
            resetForm();
        }
    }, [isOpen]);

    const loadCategories = async () => {
        try {
            const cats = await getCategories();
            setCategories(cats);
        } catch (error) {
            console.error('Error loading categories:', error);
            toast.error(t('purchases.messages.loadError'));
        }
    };

    const resetForm = () => {
        setCurrentStep(1);
        setSelectedVendor(null);
        setPurchaseItems([]);
        setPurchaseDate(new Date().toISOString().split('T')[0]);
        setBillNumber('');
        setPaymentStatus('unpaid');
        setPaidAmount(0);
        setNotes('');
    };

    const calculateSubtotal = () => {
        return purchaseItems.reduce((sum, item) => sum + (item.quantity * item.purchase_rate), 0);
    };

    const calculateTotal = () => {
        return calculateSubtotal();
    };

    const handleNext = () => {
        if (currentStep === 1 && !selectedVendor) {
            toast.error(t('purchases.messages.selectVendor'));
            return;
        }
        if (currentStep === 2 && purchaseItems.length === 0) {
            toast.error(t('purchases.messages.addItems'));
            return;
        }
        setCurrentStep(prev => Math.min(prev + 1, 3));
    };

    const handleBack = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    const handleSubmit = async () => {
        if (!selectedVendor) {
            toast.error(t('purchases.messages.selectVendor'));
            return;
        }
        if (purchaseItems.length === 0) {
            toast.error(t('purchases.messages.addItems'));
            return;
        }

        setIsSubmitting(true);
        try {
            // Create new items first
            const itemsWithIds = await Promise.all(
                purchaseItems.map(async (item) => {
                    if (item.isNew) {
                        // Create new item
                        const newItem = await createItem({
                            name: item.item_name,
                            description: `Purchased from ${selectedVendor.name}`,
                            category_id: item.category_id,
                            sku: item.sku,
                            barcode: item.barcode,
                            purchase_rate: item.purchase_rate,
                            sale_rate: item.sale_rate,
                            unit_price: item.sale_rate,
                            reorder_point: 10,
                            created_by: profile?.id || 'unknown'
                        });
                        return {
                            ...item,
                            item_id: newItem.id
                        };
                    }
                    return item;
                })
            );

            // Create purchase
            const total = calculateTotal();
            const paid = paymentStatus === 'paid' ? total : (paymentStatus === 'partial' ? paidAmount : 0);

            await createPurchase({
                vendor_id: selectedVendor.id,
                vendor_name: selectedVendor.name,
                bill_number: billNumber,
                items: itemsWithIds.map(item => ({
                    item_id: item.item_id!,
                    item_name: item.item_name,
                    barcode: item.barcode,
                    quantity: item.quantity,
                    purchase_rate: item.purchase_rate,
                    sale_rate: item.sale_rate,
                    expiry_date: item.expiry_date,
                    shelf_location: item.shelf_location,
                    line_total: item.quantity * item.purchase_rate
                })),
                subtotal: total,
                tax_amount: 0,
                discount_amount: 0,
                total_amount: total,
                payment_status: paymentStatus,
                paid_amount: paid,
                purchase_date: new Date(purchaseDate),
                created_by: profile?.id || 'unknown',
                notes
            });

            toast.success(t('purchases.messages.success'));
            onSuccess?.();
            onClose();
        } catch (error: any) {
            console.error('Purchase error:', error);
            toast.error(error.message || t('purchases.messages.error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="w-full max-w-4xl max-h-[90vh] bg-dark-900 rounded-2xl shadow-2xl border border-dark-700 flex flex-col"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-dark-700">
                        <div>
                            <h2 className="text-2xl font-bold text-gradient">{t('purchases.newPurchase')}</h2>
                            <p className="text-sm text-gray-400 mt-1">
                                {t('purchases.step', { current: currentStep, total: 3 })}: {
                                    currentStep === 1 ? t('purchases.selectVendor') :
                                        currentStep === 2 ? t('purchases.addItems') :
                                            t('purchases.reviewComplete')
                                }
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
                        >
                            <X className="w-6 h-6 text-gray-400" />
                        </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="px-6 pt-4">
                        <div className="flex items-center justify-between mb-2">
                            {[1, 2, 3].map((step) => (
                                <div
                                    key={step}
                                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${step <= currentStep
                                        ? 'border-primary-500 bg-primary-500 text-white'
                                        : 'border-gray-600 text-gray-400'
                                        }`}
                                >
                                    {step < currentStep ? <CheckCircle2 className="w-5 h-5" /> : step}
                                </div>
                            ))}
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                            <motion.div
                                className="bg-gradient-to-r from-primary-500 to-accent-500 h-2 rounded-full"
                                initial={{ width: '33%' }}
                                animate={{ width: `${(currentStep / 3) * 100}%` }}
                                transition={{ duration: 0.3 }}
                            />
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        <AnimatePresence mode="wait">
                            {/* Step 1: Vendor Selection */}
                            {currentStep === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                >
                                    <VendorSelector
                                        onVendorSelected={setSelectedVendor}
                                        selectedVendor={selectedVendor}
                                    />
                                </motion.div>
                            )}

                            {/* Step 2: Items */}
                            {currentStep === 2 && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                >
                                    <PurchaseItemBuilder
                                        categories={categories}
                                        onCategoriesUpdate={loadCategories}
                                        items={purchaseItems}
                                        onItemsChange={setPurchaseItems}
                                    />
                                </motion.div>
                            )}

                            {/* Step 3: Summary */}
                            {currentStep === 3 && (
                                <motion.div
                                    key="step3"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="bg-dark-800 rounded-lg p-6 border border-dark-700">
                                        <h3 className="text-lg font-semibold text-white mb-4">{t('purchases.purchaseDetails')}</h3>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                                    {t('purchases.purchaseDate')}
                                                </label>
                                                <div className="relative">
                                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                    <input
                                                        type="date"
                                                        value={purchaseDate}
                                                        onChange={(e) => setPurchaseDate(e.target.value)}
                                                        className="w-full input-dark pl-10"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                                    {t('purchases.billNumberOptional')}
                                                </label>
                                                <div className="relative">
                                                    <Receipt className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                    <input
                                                        type="text"
                                                        value={billNumber}
                                                        onChange={(e) => setBillNumber(e.target.value)}
                                                        placeholder={t('purchases.vendorInvoiceNumber')}
                                                        className="w-full input-dark pl-10"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-4">
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                {t('purchases.paymentStatus')}
                                            </label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {(['paid', 'partial', 'unpaid'] as const).map((status) => (
                                                    <button
                                                        key={status}
                                                        onClick={() => setPaymentStatus(status)}
                                                        className={`py-2 px-4 rounded-lg border-2 transition-all ${paymentStatus === status
                                                            ? 'border-primary-500 bg-primary-500/20 text-primary-400'
                                                            : 'border-dark-600 text-gray-400 hover:border-dark-500'
                                                            }`}
                                                    >
                                                        {t(`purchases.${status}`)}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {paymentStatus === 'partial' && (
                                            <div className="mt-4">
                                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                                    {t('purchases.paidAmount')}
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={paidAmount}
                                                    onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                                                    className="w-full input-dark"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        )}

                                        <div className="mt-4">
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                {t('purchases.notesOptional')}
                                            </label>
                                            <textarea
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                                rows={3}
                                                className="w-full input-dark resize-none"
                                                placeholder={t('purchases.addNotes')}
                                            />
                                        </div>
                                    </div>

                                    {/* Summary Card */}
                                    <div className="bg-primary-500/10 border border-primary-500/30 rounded-lg p-6">
                                        <h3 className="text-lg font-semibold text-white mb-4">{t('purchases.orderSummary')}</h3>

                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">{t('vendors.title')}:</span>
                                                <span className="text-white font-medium">{selectedVendor?.name}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">{t('pos.terminal.items')}:</span>
                                                <span className="text-white">{purchaseItems.length}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">{t('purchases.totalUnits')}:</span>
                                                <span className="text-white">{purchaseItems.reduce((sum, item) => sum + item.quantity, 0)}</span>
                                            </div>
                                            <div className="border-t border-primary-500/30 pt-2 mt-2">
                                                <div className="flex justify-between text-lg">
                                                    <span className="text-gray-300 font-semibold">{t('purchases.totalAmount')}:</span>
                                                    <span className="text-primary-400 font-bold">{formatCurrency(calculateTotal())}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between p-6 border-t border-dark-700">
                        <button
                            onClick={currentStep === 1 ? onClose : handleBack}
                            className="btn-secondary flex items-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            {currentStep === 1 ? t('common.cancel') : t('common.back')}
                        </button>

                        {currentStep < 3 ? (
                            <button
                                onClick={handleNext}
                                className="btn-primary flex items-center gap-2"
                            >
                                {t('common.next')}
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="btn-primary flex items-center gap-2 min-w-[160px]"
                            >
                                {isSubmitting ? (
                                    <>
                                        <LoadingSpinner size="sm" color="white" />
                                        {t('purchases.creating')}
                                    </>
                                ) : (
                                    <>
                                        <ShoppingBag className="w-4 h-4" />
                                        {t('purchases.completePurchase')}
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
