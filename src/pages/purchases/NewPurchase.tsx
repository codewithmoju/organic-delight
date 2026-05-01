import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, CheckCircle2, Calendar, Receipt,
    Save, ChevronRight, Package, Building2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Vendor, Category } from '../../lib/types';
import { getCategories } from '../../lib/api/categories';
import { createPurchase } from '../../lib/api/purchases';
import { createItem } from '../../lib/api/items';
import { useAuthStore } from '../../lib/store';
import { toast } from 'sonner';
import { formatCurrency } from '../../lib/utils/notifications';
import VendorSelector from '../../components/purchases/VendorSelector';
import PurchaseItemBuilder, { PurchaseItemData } from '../../components/purchases/PurchaseItemBuilder';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function NewPurchase() {
    const { t } = useTranslation();
    const navigate = useNavigate();
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
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const cats = await getCategories();
            setCategories(cats);
        } catch (error) {
            console.error('Error loading categories:', error);
            toast.error(t('purchases.messages.loadError'));
        }
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
        if (currentStep === 1) {
            navigate(-1);
        } else {
            setCurrentStep(prev => Math.max(prev - 1, 1));
        }
    };

    const handleSubmit = async () => {
        if (!selectedVendor || purchaseItems.length === 0) return;

        setIsSubmitting(true);
        try {
            // Create new items first, skip items that already have an ID
            const itemsWithIds = await Promise.all(
                purchaseItems.map(async (item) => {
                    if (item.isNew && !item.item_id) {
                        const newItem = await createItem({
                            name: item.item_name,
                            description: `Purchased from ${selectedVendor.name}`,
                            category_id: item.category_id,
                            sku: item.sku,
                            barcode: item.barcode || undefined,
                            purchase_rate: item.purchase_rate,
                            sale_rate: item.sale_rate,
                            reorder_point: 10,
                            created_by: profile?.id || 'unknown'
                        });
                        return { ...item, item_id: newItem.id };
                    }
                    return item;
                })
            );

            const total = calculateTotal();
            const paid = paymentStatus === 'paid' ? total : (paymentStatus === 'partial' ? paidAmount : 0);

            await createPurchase({
                vendor_id: selectedVendor.id,
                vendor_name: selectedVendor.name,
                bill_number: billNumber || undefined,
                items: itemsWithIds.map(item => ({
                    item_id: item.item_id!,
                    item_name: item.item_name,
                    barcode: item.barcode || undefined,
                    quantity: item.quantity,
                    purchase_rate: item.purchase_rate,
                    sale_rate: item.sale_rate,
                    expiry_date: item.expiry_date || undefined,
                    shelf_location: item.shelf_location || undefined,
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
                notes: notes || undefined
            });

            toast.success(t('purchases.messages.success'));
            navigate('/transactions');
        } catch (error: any) {
            console.error('Purchase error:', error);
            toast.error(error.message || t('purchases.messages.error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const steps = [
        { id: 1, title: 'Select Vendor', icon: Building2 },
        { id: 2, title: 'Add Items', icon: Package },
        { id: 3, title: 'Review & Pay', icon: Receipt },
    ];

    return (
        <div className="min-h-screen pb-24">
            {/* ── Sticky Header ── */}
            <div className="bg-card/80 backdrop-blur-xl border-b border-border/50 sticky top-0 z-40">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <button
                                onClick={handleBack}
                                className="p-2 rounded-xl hover:bg-secondary/50 transition-colors text-foreground-muted hover:text-foreground flex-shrink-0"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div className="min-w-0">
                                <h1 className="text-base sm:text-xl font-bold text-foreground truncate">
                                    New Purchase Order
                                </h1>
                                <p className="text-xs text-foreground-muted hidden sm:block">
                                    Create a new stock-in record
                                </p>
                            </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                            <div className="text-xs font-medium text-foreground-muted">Total</div>
                            <div className="text-lg sm:text-2xl font-bold text-foreground tabular-nums">{formatCurrency(calculateTotal())}</div>
                        </div>
                    </div>

                    {/* ── Stepper ── */}
                    <div className="mt-4 mb-1">
                        <div className="flex items-center justify-between relative">
                            <div className="absolute left-0 top-5 w-full h-0.5 bg-secondary rounded-full -z-10" />
                            <div
                                className="absolute left-0 top-5 h-0.5 bg-primary rounded-full -z-10 transition-all duration-500"
                                style={{ width: `${((currentStep - 1) / 2) * 100}%` }}
                            />
                            {steps.map((step) => {
                                const isActive = step.id === currentStep;
                                const isCompleted = step.id < currentStep;
                                const Icon = step.icon;
                                return (
                                    <div key={step.id} className="flex flex-col items-center gap-1.5">
                                        <motion.div
                                            initial={false}
                                            animate={{
                                                scale: isActive ? 1.1 : 1,
                                                backgroundColor: isActive || isCompleted ? 'rgb(var(--primary))' : 'rgb(var(--card))',
                                                borderColor: isActive || isCompleted ? 'rgb(var(--primary))' : 'rgb(var(--border))'
                                            }}
                                            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 flex items-center justify-center z-10 shadow-sm ${
                                                isActive || isCompleted ? 'text-white' : 'text-foreground-muted'
                                            }`}
                                        >
                                            {isCompleted ? <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <Icon className="w-4 h-4" />}
                                        </motion.div>
                                        <span className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-center max-w-[56px] sm:max-w-none leading-tight ${
                                            isActive ? 'text-primary' : isCompleted ? 'text-foreground' : 'text-foreground-muted'
                                        }`}>
                                            {step.title}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Content ── */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
                <AnimatePresence mode="wait">
                    {/* Step 1: Vendor Selection */}
                    {currentStep === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -16 }}
                            transition={{ duration: 0.25 }}
                            className="space-y-4"
                        >
                            <div className="card-theme p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-border/50">
                                <div className="text-center mb-5">
                                    <h2 className="text-lg sm:text-xl font-bold mb-1">Select a Vendor</h2>
                                    <p className="text-sm text-foreground-muted">
                                        Search for an existing vendor or add a new one.
                                    </p>
                                </div>
                                <VendorSelector
                                    onVendorSelected={setSelectedVendor}
                                    selectedVendor={selectedVendor}
                                />
                            </div>
                        </motion.div>
                    )}

                    {/* Step 2: Items */}
                    {currentStep === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -16 }}
                            transition={{ duration: 0.25 }}
                        >
                            <div className="card-theme p-4 sm:p-5 rounded-2xl sm:rounded-[2rem] border border-border/50">
                                <PurchaseItemBuilder
                                    categories={categories}
                                    onCategoriesUpdate={loadCategories}
                                    items={purchaseItems}
                                    onItemsChange={setPurchaseItems}
                                />
                            </div>
                        </motion.div>
                    )}

                    {/* Step 3: Summary */}
                    {currentStep === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -16 }}
                            transition={{ duration: 0.25 }}
                            className="space-y-4"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Details */}
                                <div className="md:col-span-2">
                                    <div className="card-theme p-4 sm:p-5 rounded-2xl sm:rounded-[2rem] border border-border/50">
                                        <h3 className="text-base font-bold mb-4 flex items-center gap-2">
                                            <Receipt className="w-4 h-4 text-primary" />
                                            Purchase Details
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-semibold text-foreground-muted mb-1.5">Purchase Date</label>
                                                <div className="relative">
                                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted pointer-events-none" />
                                                    <input
                                                        type="date"
                                                        value={purchaseDate}
                                                        onChange={(e) => setPurchaseDate(e.target.value)}
                                                        className="w-full h-11 pl-10 pr-4 bg-background border border-border/60 rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-foreground-muted mb-1.5">Invoice # (Optional)</label>
                                                <input
                                                    type="text"
                                                    value={billNumber}
                                                    onChange={(e) => setBillNumber(e.target.value)}
                                                    placeholder="e.g., INV-2024-001"
                                                    className="w-full h-11 px-4 bg-background border border-border/60 rounded-xl text-sm text-foreground placeholder:text-foreground-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                                                />
                                            </div>
                                            <div className="sm:col-span-2">
                                                <label className="block text-xs font-semibold text-foreground-muted mb-1.5">Notes (Optional)</label>
                                                <textarea
                                                    value={notes}
                                                    onChange={(e) => setNotes(e.target.value)}
                                                    rows={3}
                                                    placeholder="Add any additional notes..."
                                                    className="w-full px-4 py-3 bg-background border border-border/60 rounded-xl text-sm text-foreground placeholder:text-foreground-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Payment */}
                                <div className="card-theme p-4 sm:p-5 rounded-2xl sm:rounded-[2rem] border border-border/50">
                                    <h3 className="text-base font-bold mb-4">Payment Summary</h3>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-foreground-muted">Vendor</span>
                                            <span className="font-semibold text-foreground truncate max-w-[120px] text-right">{selectedVendor?.company}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-foreground-muted">Items</span>
                                            <span className="font-semibold">{purchaseItems.length}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-foreground-muted">Units</span>
                                            <span className="font-semibold">{purchaseItems.reduce((a, i) => a + i.quantity, 0)}</span>
                                        </div>
                                        <div className="pt-3 border-t border-border/50 flex justify-between items-center">
                                            <span className="font-bold">Total</span>
                                            <span className="text-xl font-bold text-primary tabular-nums">{formatCurrency(calculateTotal())}</span>
                                        </div>
                                        <div className="pt-2">
                                            <label className="block text-xs font-semibold text-foreground-muted mb-2">Payment Status</label>
                                            <div className="grid grid-cols-3 gap-1.5">
                                                {(['paid', 'partial', 'unpaid'] as const).map((status) => (
                                                    <button
                                                        key={status}
                                                        onClick={() => setPaymentStatus(status)}
                                                        className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                                                            paymentStatus === status
                                                                ? 'bg-primary text-white border-primary shadow-sm'
                                                                : 'bg-background border-border/60 text-foreground-muted hover:border-primary/40'
                                                        }`}
                                                    >
                                                        {status.charAt(0).toUpperCase() + status.slice(1)}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        {paymentStatus === 'partial' && (
                                            <div>
                                                <label className="block text-xs font-semibold text-foreground-muted mb-1.5">Amount Paid</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-foreground-muted pointer-events-none">Rs</span>
                                                    <input
                                                        type="number"
                                                        value={paidAmount}
                                                        onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                                                        className="w-full h-11 pl-9 pr-4 bg-background border border-border/60 rounded-xl text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── Bottom Action Bar ── */}
            <div
                className="fixed bottom-0 left-0 right-0 z-40 bg-background/90 backdrop-blur-lg border-t border-border/50"
                style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
            >
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
                    <button
                        onClick={handleBack}
                        className="px-4 sm:px-6 py-2.5 rounded-xl font-medium text-sm text-foreground-muted hover:bg-secondary/50 transition-colors"
                    >
                        {currentStep === 1 ? 'Cancel' : 'Back'}
                    </button>

                    {currentStep < 3 ? (
                        <button
                            onClick={handleNext}
                            className="px-6 sm:px-8 py-2.5 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex items-center gap-2 text-sm"
                        >
                            Next Step
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="px-6 sm:px-8 py-2.5 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex items-center gap-2 text-sm disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <><LoadingSpinner size="sm" color="white" />Processing…</>
                            ) : (
                                <><Save className="w-4 h-4" />Complete Purchase</>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
