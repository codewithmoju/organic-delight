import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Phone, Mail, MapPin, Calendar, DollarSign,
    CreditCard, Clock, Wallet, Plus, X,
    Receipt, BanknoteIcon, Building2, AlertCircle,
    Trash2, ArrowUpRight, ArrowDownLeft, Download, Printer
} from 'lucide-react';
import { toast } from 'sonner';
import { Customer, CustomerPayment } from '../../lib/types';
import { getCustomerById, getCustomerLedger, recordCustomerTransaction, getCustomerCreditSales, deleteCustomer } from '../../lib/api/customers';
import { formatCurrency, formatDate } from '../../lib/utils/notifications';
import { format } from 'date-fns';
import { useAuthStore } from '../../lib/store';
import CustomerLedgerSkeleton from '../../components/skeletons/CustomerLedgerSkeleton';
import { useReactToPrint } from 'react-to-print';
import { POSSettings } from '../../lib/types';
import { getPOSSettings } from '../../lib/api/pos';
import { exportToCSV } from '../../lib/utils/export';
import CustomerLedgerPDF from './CustomerLedgerPDF'; // Need to ensure import path is correct
import { useRef } from 'react';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

function parseDate(d: any): Date {
    if (!d) return new Date();
    if (d instanceof Date) return d;
    if (typeof d?.toDate === 'function') return d.toDate();
    return new Date(d);
}

function getRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(date);
}

// ============================================
// STAT CARD
// ============================================
function StatCard({ icon: Icon, label, value, accent, delay = 0 }: {
    icon: any; label: string; value: string | number; accent: string; delay?: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden rounded-2xl bg-card border border-border/60 p-5 group hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
        >
            <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity ${accent}`} />
            <div className="relative flex items-center gap-4">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${accent} bg-opacity-15`}>
                    <Icon className="w-5 h-5" />
                </div>
                <div>
                    <p className="text-xs font-medium text-muted-foreground tracking-wide uppercase">{label}</p>
                    <p className="text-xl font-bold text-foreground mt-0.5">{value}</p>
                </div>
            </div>
        </motion.div>
    );
}

// ============================================
// RECORD TRANSACTION FORM
// ============================================
function RecordTransactionForm({ customer, onClose, onRecorded }: {
    customer: Customer; onClose: () => void; onRecorded: () => void;
}) {
    const profile = useAuthStore(state => state.profile);
    const [type, setType] = useState<'payment' | 'charge'>('payment');
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState<'cash' | 'bank_transfer' | 'digital'>('cash');
    const [reference, setReference] = useState('');
    const [notes, setNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const paymentMethods = [
        { value: 'cash', label: 'Cash', icon: BanknoteIcon },
        { value: 'bank_transfer', label: 'Bank', icon: Building2 },
        { value: 'digital', label: 'Digital', icon: CreditCard },
    ];

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const payAmount = parseFloat(amount);
        if (!payAmount || payAmount <= 0) {
            toast.error('Enter a valid amount');
            return;
        }
        setIsSaving(true);
        try {
            await recordCustomerTransaction({
                customer_id: customer.id,
                type,
                amount: payAmount,
                payment_method: method,
                reference_number: reference.trim() || undefined,
                notes: notes.trim() || undefined,
                payment_date: new Date(),
                created_by: profile?.id || 'unknown'
            });
            toast.success(`${type === 'payment' ? 'Payment' : 'Charge'} of ${formatCurrency(payAmount)} recorded!`);
            onRecorded();
            onClose();
        } catch (error) {
            toast.error('Failed to record transaction');
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    }

    const isPayment = type === 'payment';

    return (
        <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
        >
            <form onSubmit={handleSubmit} className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                        {isPayment ? (
                            <ArrowDownLeft className="w-5 h-5 text-[rgb(var(--success))]" />
                        ) : (
                            <ArrowUpRight className="w-5 h-5 text-[rgb(var(--error))]" />
                        )}
                        New Transaction
                    </h3>
                    <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Transaction Type Selector */}
                <div className="grid grid-cols-2 gap-2 mb-4 p-1 bg-secondary/50 rounded-xl">
                    <button
                        type="button"
                        onClick={() => setType('payment')}
                        className={`py-2 rounded-lg text-sm font-medium transition-all ${isPayment
                            ? 'bg-[rgb(var(--success))] text-white shadow-md'
                            : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                            }`}
                    >
                        Money In (Payment)
                    </button>
                    <button
                        type="button"
                        onClick={() => setType('charge')}
                        className={`py-2 rounded-lg text-sm font-medium transition-all ${!isPayment
                            ? 'bg-[rgb(var(--error))] text-white shadow-md'
                            : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                            }`}
                    >
                        Money Out (Charge)
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Amount *</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">Rs</span>
                            <input
                                type="number"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                                className={`w-full pl-9 pr-4 py-2.5 bg-background border rounded-xl text-sm font-bold text-foreground focus:ring-2 outline-none transition-all ${isPayment
                                    ? 'focus:ring-[rgb(var(--success)/.2)] focus:border-[rgb(var(--success)/.5)]'
                                    : 'focus:ring-[rgb(var(--error)/.2)] focus:border-[rgb(var(--error)/.5)]'
                                    } border-border/60`}
                                autoFocus
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Method</label>
                        <div className="flex gap-1.5">
                            {paymentMethods.map(pm => (
                                <button
                                    type="button"
                                    key={pm.value}
                                    onClick={() => setMethod(pm.value as any)}
                                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${method === pm.value
                                        ? 'bg-primary/10 text-primary border border-primary/30'
                                        : 'bg-background border border-border/60 text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    <pm.icon className="w-3.5 h-3.5" />
                                    {pm.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Notes / Reference</label>
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                type="text"
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                placeholder="Description (e.g. Old Balance)"
                                className="w-full px-4 py-2.5 bg-background border border-border/60 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary/50 outline-none transition-all"
                            />
                            <input
                                type="text"
                                value={reference}
                                onChange={e => setReference(e.target.value)}
                                placeholder="Ref # (Optional)"
                                className="w-full px-4 py-2.5 bg-background border border-border/60 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary/50 outline-none transition-all"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                        Cancel
                    </button>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={isSaving}
                        className={`rounded-xl text-sm px-5 py-2 font-bold text-white shadow-sm ${isPayment
                            ? 'bg-[rgb(var(--success))] hover:bg-[rgb(var(--success)/.9)]'
                            : 'bg-[rgb(var(--error))] hover:bg-[rgb(var(--error)/.9)]'
                            }`}
                    >
                        {isSaving ? 'Saving...' : (isPayment ? 'Receive Payment' : 'Add Charge')}
                    </motion.button>
                </div>
            </form>
        </motion.div>
    );
}

// ============================================
// LEDGER ENTRY ROW
// ============================================
// ============================================
// LEDGER ENTRY ROW
// ============================================
function LedgerEntry({ entry, type, index }: {
    entry: any; type: 'payment' | 'credit_sale' | 'charge'; index: number;
}) {
    // Determine the type: 'payment' (Green, money in), 'charge' (Red, money out, manual), 'credit_sale' (Red, money out, POS)
    // entry._type comes from the mapping below.
    // If entry is a Payment record from API, it might have .type = 'payment' | 'charge'.
    // Logic:
    // If entry._type == 'credit_sale' -> It's a Credit Sale (Red)
    // If entry._type == 'payment':
    //    If entry.type == 'charge' -> It's a Manual Charge (Red)
    //    Else -> It's a Payment (Green)

    let isMoneyOut = false;
    let label = 'Transaction';
    let icon = Wallet;
    let badge = 'PAYMENT';

    if (type === 'credit_sale') {
        isMoneyOut = true; // Credit Sale is money out (debt increases)
        label = `Credit Sale #${entry.transaction_number || entry.id?.slice(0, 8)}`;
        icon = Receipt;
        badge = 'CREDIT SALE';
    } else if (entry.type === 'charge') {
        isMoneyOut = true; // Manual Charge is money out
        label = entry.notes || 'Manual Charge';
        icon = ArrowUpRight;
        badge = 'CHARGE';
    } else {
        // Payment
        isMoneyOut = false; // Payment is money in (debt decreases)
        label = 'Payment Received';
        icon = ArrowDownLeft;
        badge = 'RECEIVED';
    }

    const entryDate = parseDate((type === 'payment' || type === 'charge') ? entry.payment_date : entry.created_at);

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: index * 0.03, ease: [0.22, 1, 0.36, 1] }}
            className="group"
        >
            <div className="flex items-center gap-4 p-4 rounded-2xl hover:bg-card/80 transition-all duration-200 cursor-default">
                {/* Icon */}
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 ${!isMoneyOut
                    ? 'bg-[rgb(var(--success)/.12)] text-[rgb(var(--success))]'
                    : 'bg-[rgb(var(--error)/.12)] text-[rgb(var(--error))]'
                    }`}>
                    <IconLink Icon={icon} className="w-5 h-5" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-foreground truncate">
                            {label}
                        </h4>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${!isMoneyOut
                            ? 'bg-[rgb(var(--success)/.1)] text-[rgb(var(--success))]'
                            : 'bg-[rgb(var(--error)/.1)] text-[rgb(var(--error))]'
                            }`}>
                            {badge}
                        </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {getRelativeTime(entryDate)}
                        </span>
                        {(type !== 'credit_sale' && entry.payment_method) && (
                            <span className="flex items-center gap-1 capitalize">
                                <CreditCard className="w-3 h-3" />
                                {entry.payment_method.replace('_', ' ')}
                            </span>
                        )}
                        {entry.reference_number && (
                            <span className="hidden sm:flex items-center gap-1">
                                #{entry.reference_number}
                            </span>
                        )}
                        {(entry.notes && entry.notes !== label) && (
                            <span className="hidden md:flex items-center gap-1 truncate max-w-[180px]">
                                {entry.notes}
                            </span>
                        )}
                    </div>
                </div>

                {/* Amount */}
                <div className="text-right flex-shrink-0">
                    <div className={`text-lg font-bold tabular-nums ${!isMoneyOut ? 'text-[rgb(var(--success))]' : 'text-[rgb(var(--error))]'
                        }`}>
                        {!isMoneyOut ? '-' : '+'}{formatCurrency(type === 'credit_sale' ? (entry.total_amount || 0) : entry.amount)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                        {!isMoneyOut ? 'Reduced' : 'Added'} to balance
                    </div>
                </div>
            </div>
            <div className="mx-4 border-b border-border/30" />
        </motion.div>
    );
}

// Helper to render icon component dynamically
const IconLink = ({ Icon, className }: { Icon: any, className: string }) => <Icon className={className} />;

// ============================================
// MAIN COMPONENT
// ============================================
export default function CustomerLedger() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [payments, setPayments] = useState<CustomerPayment[]>([]);
    const [creditSales, setCreditSales] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [activeTab, setActiveTab] = useState<'all' | 'payments' | 'credits'>('all');
    const [settings, setSettings] = useState<POSSettings | null>(null);
    const componentRef = useRef<HTMLDivElement>(null);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: customer ? `${customer.name}_Statement` : 'Customer_Statement',
    });

    useEffect(() => {
        const fetchSettings = async () => {
            const s = await getPOSSettings();
            setSettings(s);
        };
        fetchSettings();
    }, []);

    useEffect(() => {
        if (id) loadData();
    }, [id]);

    async function loadData() {
        setIsLoading(true);
        try {
            // Load customer first - this is required
            const cust = await getCustomerById(id!);
            if (!cust) {
                toast.error('Customer not found');
                setIsLoading(false);
                return;
            }
            setCustomer(cust);

            // Load ledger and credit sales independently (may fail due to missing indexes)
            const [ledger, sales] = await Promise.all([
                getCustomerLedger(id!).catch((err) => {
                    console.warn('Error loading ledger:', err);
                    return [] as CustomerPayment[];
                }),
                getCustomerCreditSales(id!).catch((err) => {
                    console.warn('Error loading credit sales:', err);
                    return [] as any[];
                })
            ]);
            setPayments(ledger);
            setCreditSales(sales);
        } catch (error) {
            toast.error('Failed to load customer data');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }

    // Combine and sort entries
    const allEntries = useMemo(() => {
        const paymentEntries = payments.map(p => ({ ...p, _type: 'payment' as const, _date: parseDate(p.payment_date) }));
        const creditEntries = creditSales.map(s => ({ ...s, _type: 'credit_sale' as const, _date: parseDate(s.created_at) }));

        let entries = [...paymentEntries, ...creditEntries];

        if (activeTab === 'payments') entries = entries.filter(e => e._type === 'payment');
        if (activeTab === 'credits') entries = entries.filter(e => e._type === 'credit_sale');

        return entries.sort((a, b) => b._date.getTime() - a._date.getTime());
    }, [payments, creditSales, activeTab]);

    const totalPaid = useMemo(() => payments.reduce((s, p) => s + p.amount, 0), [payments]);

    // Calculate totals from ledger for display accuracy
    const calculatedTotalPurchases = useMemo(() => {
        return creditSales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
    }, [creditSales]);

    const calculatedOutstandingBalance = useMemo(() => {
        // Total credit sales (debt) - Total payments (credit)
        // Simplified view: balance = purchases - payments. 
        // Note: This logic assumes all payments reduce the debt from credit sales.
        return calculatedTotalPurchases - totalPaid;
    }, [calculatedTotalPurchases, totalPaid]);

    const displayCustomer = customer ? {
        ...customer,
        total_purchases: calculatedTotalPurchases, // Override with calculated
        outstanding_balance: calculatedOutstandingBalance // Override with calculated
    } : null;

    const handleExport = () => {
        if (!displayCustomer || allEntries.length === 0) return;

        const exportData = allEntries.map(entry => ({
            Date: format(entry._date, 'yyyy-MM-dd'),
            Type: entry._type === 'credit_sale' ? 'Credit Sale' : (entry.type || 'Payment'),
            Reference: entry.reference_number || (entry.transaction_number || entry.id?.slice(0, 8)),
            Description: entry.notes || (entry._type === 'credit_sale' ? 'Items purchase' : 'Payment received'),
            Amount: entry.total_amount || entry.amount,
        }));

        const filename = `${displayCustomer.name.replace(/\s+/g, '_')}_Statement_${new Date().toISOString().split('T')[0]}.csv`;
        exportToCSV(exportData, filename);
    };

    const handleDeleteCustomer = async () => {
        if (!customer) return;

        setIsDeleting(true);
        try {
            await deleteCustomer(customer.id);
            toast.success('Customer deleted successfully');
            navigate('/customers');
        } catch (error) {
            console.error('Error deleting customer:', error);
            toast.error('Failed to delete customer');
            setIsDeleting(false);
        }
    };

    const initials = customer?.name
        ? customer.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : '??';

    const tabs = [
        { id: 'all', label: 'All Activity' },
        { id: 'payments', label: 'Payments' },
        { id: 'credits', label: 'Credit Sales' },
    ];

    if (!customer && !isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-24">
                <AlertCircle className="w-16 h-16 text-muted-foreground/50 mb-4" />
                <h2 className="text-lg font-semibold text-foreground">Customer not found</h2>
                <button onClick={() => navigate('/customers')} className="mt-4 text-primary hover:underline text-sm">
                    Back to Customers
                </button>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen pb-8">
            {isLoading ? <CustomerLedgerSkeleton /> : (
                <>
                    <div className="space-y-6">
                        {/* ─── BACK BUTTON ─── */}
                        <motion.button
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            onClick={() => navigate('/customers')}
                            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Customers
                        </motion.button>

                        {/* ─── CUSTOMER PROFILE HEADER ─── */}
                        {customer && (
                            <motion.div
                                initial={{ opacity: 0, y: -16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                                className="bg-card rounded-2xl border border-border/60 p-6 shadow-sm"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                                    {/* Avatar */}
                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-xl flex-shrink-0 ${customer.outstanding_balance > 0
                                        ? 'bg-[rgb(var(--error)/.12)] text-[rgb(var(--error))]'
                                        : 'bg-gradient-to-br from-primary/20 to-accent/20 text-primary'
                                        }`}>
                                        {initials}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1">
                                        <h1 className="text-2xl font-bold text-foreground">{customer.name}</h1>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1.5">
                                                <Phone className="w-3.5 h-3.5" />
                                                {customer.phone}
                                            </span>
                                            {customer.email && (
                                                <span className="flex items-center gap-1.5">
                                                    <Mail className="w-3.5 h-3.5" />
                                                    {customer.email}
                                                </span>
                                            )}
                                            {customer.address && (
                                                <span className="flex items-center gap-1.5">
                                                    <MapPin className="w-3.5 h-3.5" />
                                                    {customer.address}
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5" />
                                                Since {formatDate(parseDate(customer.created_at))}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 flex-shrink-0">
                                        <button
                                            onClick={handleExport}
                                            className="p-2.5 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                                            title="Export CSV"
                                        >
                                            <Download className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={handlePrint}
                                            className="p-2.5 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                                            title="Export PDF"
                                        >
                                            <Printer className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => setIsDeleteConfirmOpen(true)}
                                            className="p-2.5 rounded-xl hover:bg-[rgb(var(--error)/.1)] text-muted-foreground hover:text-[rgb(var(--error))] transition-colors"
                                            title="Delete Customer"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                        <motion.button
                                            whileHover={{ scale: 1.03 }}
                                            whileTap={{ scale: 0.97 }}
                                            onClick={() => setShowPaymentForm(true)}
                                            className="btn-primary flex items-center gap-2 rounded-xl text-sm"
                                        >
                                            <Plus className="w-4 h-4" />
                                            New Transaction
                                        </motion.button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* ─── STATS ─── */}
                        {displayCustomer && (
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                <StatCard icon={AlertCircle} label="Outstanding" value={formatCurrency(displayCustomer.outstanding_balance)} accent="text-[rgb(var(--error))] bg-[rgb(var(--error)/.1)]" delay={0.05} />
                                <StatCard icon={DollarSign} label="Total Purchases" value={formatCurrency(displayCustomer.total_purchases)} accent="text-primary bg-primary/10" delay={0.1} />
                                <StatCard icon={Wallet} label="Total Paid" value={formatCurrency(totalPaid)} accent="text-[rgb(var(--success))] bg-[rgb(var(--success)/.1)]" delay={0.15} />
                                <StatCard icon={Receipt} label="Transactions" value={allEntries.length} accent="text-[rgb(var(--info))] bg-[rgb(var(--info)/.1)]" delay={0.2} />
                            </div>
                        )}

                        {/* ─── PAYMENT FORM ─── */}
                        <AnimatePresence>
                            {showPaymentForm && customer && (
                                <RecordTransactionForm
                                    customer={customer}
                                    onClose={() => setShowPaymentForm(false)}
                                    onRecorded={() => loadData()}
                                />
                            )}
                        </AnimatePresence>

                        {/* ─── TABS ─── */}
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.15 }}
                            className="bg-card rounded-2xl border border-border/60 p-1.5 shadow-sm"
                        >
                            <div className="flex gap-1">
                                {tabs.map(tab => {
                                    const isActive = activeTab === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id as any)}
                                            className={`relative flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-300 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                                                }`}
                                        >
                                            {isActive && (
                                                <motion.div
                                                    layoutId="ledgerTab"
                                                    className="absolute inset-0 bg-gradient-to-r from-primary to-primary-dark rounded-xl shadow-md shadow-primary/20"
                                                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                                />
                                            )}
                                            <span className="relative">{tab.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>

                        {/* ─── LEDGER ENTRIES ─── */}
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.25 }}
                            className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden"
                        >
                            <div className="px-5 py-3 border-b border-border/40 flex items-center justify-between">
                                <span className="text-xs text-muted-foreground font-medium">
                                    {allEntries.length} entr{allEntries.length !== 1 ? 'ies' : 'y'}
                                </span>
                            </div>

                            <AnimatePresence mode="wait">
                                {allEntries.length === 0 ? (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="flex flex-col items-center justify-center py-16 px-6"
                                    >
                                        <motion.div
                                            animate={{ y: [10, -4, 10] }}
                                            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                                            className="w-16 h-16 rounded-2xl bg-secondary/60 flex items-center justify-center mb-4"
                                        >
                                            <Receipt className="w-8 h-8 text-muted-foreground/50" />
                                        </motion.div>
                                        <h3 className="text-lg font-semibold text-foreground mb-1">No transactions yet</h3>
                                        <p className="text-sm text-muted-foreground text-center max-w-xs">
                                            Payments and credit sales will appear here
                                        </p>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key={activeTab}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                    >
                                        {allEntries.map((entry, i) => (
                                            <LedgerEntry key={entry.id} entry={entry} type={entry._type} index={i} />
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </div>
                </>
            )}
            {/* Hidden PDF Component */}
            <div className="hidden">
                {displayCustomer && settings && (
                    <CustomerLedgerPDF
                        ref={componentRef}
                        customer={displayCustomer}
                        ledger={allEntries}
                        settings={settings}
                    />
                )}
            </div>

            <ConfirmDialog
                isOpen={isDeleteConfirmOpen}
                title="Delete Customer"
                message="Are you sure you want to delete this customer? This action cannot be undone and will remove their profile from the directory."
                confirmText="Delete Customer"
                variant="danger"
                isLoading={isDeleting}
                onConfirm={handleDeleteCustomer}
                onCancel={() => setIsDeleteConfirmOpen(false)}
            />
        </div>
    );
}
