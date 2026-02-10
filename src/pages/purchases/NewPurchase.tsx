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
        <div className="min-h-screen pb-20">
            {/* Header */}
            <div className="bg-card/50 backdrop-blur-xl border-b border-border/50 sticky top-0 z-40">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleBack}
                                className="p-2 rounded-xl hover:bg-secondary/50 transition-colors text-muted-foreground hover:text-foreground"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-foreground">
                                    New Purchase Order
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    Create a new stock-in record
                                </p>
                            </div>
                        </div>
                        <div className="text-right hidden sm:block">
                            <div className="text-sm font-medium text-muted-foreground">Total Amount</div>
                            <div className="text-2xl font-bold text-foreground">{formatCurrency(calculateTotal())}</div>
                        </div>
                    </div>

                    {/* Stepper */}
                    <div className="mt-8 mb-2">
                        <div className="flex items-center justify-between relative">
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-secondary rounded-full -z-10" />
                            <div
                                className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary rounded-full -z-10 transition-all duration-500 ease-in-out"
                                style={{ width: `${((currentStep - 1) / 2) * 100}%` }}
                            />

                            {steps.map((step) => {
                                const isActive = step.id === currentStep;
                                const isCompleted = step.id < currentStep;
                                const Icon = step.icon;

                                return (
                                    <div key={step.id} className="flex flex-col items-center gap-2">
                                        <motion.div
                                            initial={false}
                                            animate={{
                                                scale: isActive ? 1.1 : 1,
                                                backgroundColor: isActive || isCompleted ? 'hsl(var(--primary))' : 'hsl(var(--card))',
                                                borderColor: isActive || isCompleted ? 'hsl(var(--primary))' : 'hsl(var(--border))'
                                            }}
                                            className={`w-10 h-10 rounded-full border-2 flex items-center justify-center z-10 shadow-lg ${isActive || isCompleted ? 'text-primary-foreground' : 'text-muted-foreground'
                                                }`}
                                        >
                                            {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Icon className="w-5 h-5" />}
                                        </motion.div>
                                        <span className={`text-xs font-semibold uppercase tracking-wider ${isActive ? 'text-primary' : isCompleted ? 'text-foreground' : 'text-muted-foreground'
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

            {/* Content Area */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <AnimatePresence mode="wait">
                    {/* Step 1: Vendor Selection */}
                    {currentStep === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-6"
                        >
                            <div className="card-theme p-8 rounded-[2rem] border border-border/50">
                                <div className="max-w-xl mx-auto text-center mb-8">
                                    <h2 className="text-2xl font-bold mb-2">Select a Vendor</h2>
                                    <p className="text-muted-foreground">
                                        Search for an existing vendor or add a new one to start your purchase order.
                                    </p>
                                </div>
                                <div className="max-w-xl mx-auto">
                                    <VendorSelector
                                        onVendorSelected={setSelectedVendor}
                                        selectedVendor={selectedVendor}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 2: Items */}
                    {currentStep === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="card-theme p-6 rounded-[2rem] border border-border/50">
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
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-6"
                        >
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2 space-y-6">
                                    <div className="card-theme p-6 rounded-[2rem] border border-border/50">
                                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                                            <Receipt className="w-5 h-5 text-primary" />
                                            Purchase Details
                                        </h3>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-muted-foreground mb-2">
                                                    Purchase Date
                                                </label>
                                                <div className="relative">
                                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                    <input
                                                        type="date"
                                                        value={purchaseDate}
                                                        onChange={(e) => setPurchaseDate(e.target.value)}
                                                        className="w-full pl-10 pr-4 py-3 bg-secondary/30 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-muted-foreground mb-2">
                                                    Vendor Invoice # (Optional)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={billNumber}
                                                    onChange={(e) => setBillNumber(e.target.value)}
                                                    placeholder="e.g., INV-2024-001"
                                                    className="w-full px-4 py-3 bg-secondary/30 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                                />
                                            </div>

                                            <div className="sm:col-span-2">
                                                <label className="block text-sm font-medium text-muted-foreground mb-2">
                                                    Notes
                                                </label>
                                                <textarea
                                                    value={notes}
                                                    onChange={(e) => setNotes(e.target.value)}
                                                    rows={3}
                                                    placeholder="Add any additional notes about this purchase..."
                                                    className="w-full px-4 py-3 bg-secondary/30 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="card-theme p-6 rounded-[2rem] border border-border/50 bg-secondary/10">
                                        <h3 className="text-lg font-bold mb-6 text-foreground">Payment Summary</h3>

                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-muted-foreground">Vendor</span>
                                                <span className="font-medium text-foreground">{selectedVendor?.name}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-muted-foreground">Items Count</span>
                                                <span className="font-medium text-foreground">{purchaseItems.length}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-muted-foreground">Total Units</span>
                                                <span className="font-medium text-foreground">{purchaseItems.reduce((acc, item) => acc + item.quantity, 0)}</span>
                                            </div>

                                            <div className="pt-4 border-t border-border/50">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-lg font-bold text-foreground">Total</span>
                                                    <span className="text-2xl font-bold text-primary">{formatCurrency(calculateTotal())}</span>
                                                </div>
                                            </div>

                                            <div className="pt-4">
                                                <label className="block text-sm font-medium text-muted-foreground mb-3">
                                                    Payment Status
                                                </label>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {(['paid', 'partial', 'unpaid'] as const).map((status) => (
                                                        <button
                                                            key={status}
                                                            onClick={() => setPaymentStatus(status)}
                                                            className={`py-2 px-1 text-sm font-medium rounded-lg border transition-all ${paymentStatus === status
                                                                ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20'
                                                                : 'bg-background hover:bg-secondary border-border text-muted-foreground'
                                                                }`}
                                                        >
                                                            {status.charAt(0).toUpperCase() + status.slice(1)}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {paymentStatus === 'partial' && (
                                                <div className="pt-2">
                                                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                                                        Amount Paid
                                                    </label>
                                                    <div className="relative">
                                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">Rs</span>
                                                        <input
                                                            type="number"
                                                            value={paidAmount}
                                                            onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                                                            className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Bottom Floating Action Bar */}
            <div className="fixed bottom-0 right-0 left-0 lg:left-20 p-4 bg-background/80 backdrop-blur-lg border-t border-border/50 z-40">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <button
                        onClick={handleBack}
                        className="px-6 py-3 rounded-xl font-medium text-muted-foreground hover:bg-secondary/50 transition-colors"
                    >
                        {currentStep === 1 ? 'Cancel' : 'Back'}
                    </button>

                    <div className="flex items-center gap-4">
                        {currentStep < 3 ? (
                            <button
                                onClick={handleNext}
                                className="px-8 py-3 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2"
                            >
                                Next Step
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="px-8 py-3 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-50 disabled:hover:scale-100"
                            >
                                {isSubmitting ? (
                                    <>
                                        <LoadingSpinner size="sm" color="white" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-5 h-5" />
                                        Complete Purchase
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
