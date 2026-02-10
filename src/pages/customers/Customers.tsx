import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, Plus, Search, Phone, X,
    Mail, AlertCircle, UserCheck, ChevronRight,
    CreditCard, DollarSign
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Customer } from '../../lib/types';
import { getCustomers, searchCustomers, createCustomer, recordCustomerTransaction } from '../../lib/api/customers';
import { formatCurrency } from '../../lib/utils/notifications';
import { useAuthStore } from '../../lib/store';
import CustomerSkeleton from '../../components/skeletons/CustomerSkeleton';

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
// CUSTOMER CARD
// ============================================
function CustomerCard({ customer, index, onViewLedger }: {
    customer: Customer; index: number; onViewLedger: (id: string) => void;
}) {
    const hasBalance = customer.outstanding_balance > 0;
    const initials = customer.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.4, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
            className="group"
        >
            <div
                onClick={() => onViewLedger(customer.id)}
                className="flex items-center gap-4 p-4 rounded-2xl hover:bg-card/80 transition-all duration-200 cursor-pointer"
            >
                {/* Avatar */}
                <div className="flex-shrink-0">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm transition-all duration-300 group-hover:scale-110 ${hasBalance
                        ? 'bg-[rgb(var(--error)/.12)] text-[rgb(var(--error))]'
                        : 'bg-gradient-to-br from-primary/20 to-accent/20 text-primary'
                        }`}>
                        {initials}
                    </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-foreground truncate">{customer.name}</h4>
                        {hasBalance && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[rgb(var(--error)/.1)] text-[rgb(var(--error))]">
                                CREDIT
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {customer.phone}
                        </span>
                        {customer.email && (
                            <span className="hidden sm:flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                <span className="truncate max-w-[140px]">{customer.email}</span>
                            </span>
                        )}
                    </div>
                </div>

                {/* Balance + Purchases */}
                <div className="text-right flex-shrink-0">
                    <div className={`text-lg font-bold tabular-nums ${hasBalance ? 'text-[rgb(var(--error))]' : 'text-[rgb(var(--success))]'
                        }`}>
                        {formatCurrency(customer.outstanding_balance)}
                    </div>
                    <div className="text-xs text-muted-foreground tabular-nums">
                        Total: {formatCurrency(customer.total_purchases)}
                    </div>
                </div>

                <ChevronRight className="w-4 h-4 text-muted-foreground/50 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            <div className="mx-4 border-b border-border/30" />
        </motion.div>
    );
}

// ============================================
// ADD CUSTOMER INLINE FORM
// ============================================
function AddCustomerForm({ onClose, onCreated }: {
    onClose: () => void; onCreated: (c: Customer) => void;
}) {
    const profile = useAuthStore(state => state.profile);
    const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', openingBalance: '' });
    const [isSaving, setIsSaving] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.name.trim() || !form.phone.trim()) {
            toast.error('Name and phone are required');
            return;
        }
        setIsSaving(true);
        try {
            let customer = await createCustomer({
                name: form.name.trim(),
                phone: form.phone.trim(),
                email: form.email.trim() || undefined,
                address: form.address.trim() || undefined,
                created_by: profile?.id || 'unknown'
            });

            // Handle Opening Balance
            const openingBal = parseFloat(form.openingBalance);
            if (openingBal > 0) {
                try {
                    await recordCustomerTransaction({
                        customer_id: customer.id,
                        type: 'charge',
                        amount: openingBal,
                        payment_method: 'opening_balance',
                        notes: 'Opening Balance',
                        payment_date: new Date(),
                        created_by: profile?.id || 'unknown'
                    });
                    // Update local customer object to reflect balance
                    customer = { ...customer, outstanding_balance: openingBal };
                } catch (err) {
                    console.error('Failed to record opening balance:', err);
                    toast.error('Customer added but failed to set opening balance');
                }
            }
            toast.success(`${customer.name} added successfully!`);
            onCreated(customer);
            onClose();
        } catch (error) {
            toast.error('Failed to add customer');
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
        >
            <form onSubmit={handleSubmit} className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                        <Plus className="w-4 h-4 text-primary" />
                        New Customer
                    </h3>
                    <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Name *</label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                            placeholder="Customer name"
                            className="w-full px-4 py-2.5 bg-background border border-border/60 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary/50 outline-none transition-all"
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Phone *</label>
                        <input
                            type="tel"
                            value={form.phone}
                            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                            placeholder="+92 300 1234567"
                            className="w-full px-4 py-2.5 bg-background border border-border/60 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary/50 outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Email</label>
                        <input
                            type="email"
                            value={form.email}
                            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                            placeholder="email@example.com"
                            className="w-full px-4 py-2.5 bg-background border border-border/60 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary/50 outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Address</label>
                        <input
                            type="text"
                            value={form.address}
                            onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                            placeholder="Address (optional)"
                            className="w-full px-4 py-2.5 bg-background border border-border/60 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary/50 outline-none transition-all"
                        />
                    </div>
                    <div className="sm:col-span-2 border-t border-border/40 pt-3 mt-1">
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Opening Balance (Optional)</label>
                        <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-xs">Rs</span>
                            <input
                                type="number"
                                value={form.openingBalance}
                                onChange={e => setForm(f => ({ ...f, openingBalance: e.target.value }))}
                                placeholder="0.00"
                                className="w-full pl-8 pr-4 py-2.5 bg-background border border-border/60 rounded-xl text-sm font-bold text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary/50 outline-none transition-all"
                            />
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1.5 ml-1">
                            Enter amount if the customer already owes money (Old Balance).
                        </p>
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
                        className="btn-primary rounded-xl text-sm px-5 py-2"
                    >
                        {isSaving ? 'Adding...' : 'Add Customer'}
                    </motion.button>
                </div>
            </form>
        </motion.div >
    );
}

// ============================================
// EMPTY STATE
// ============================================
function EmptyState() {
    return (
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
                <Users className="w-8 h-8 text-muted-foreground/50" />
            </motion.div>
            <h3 className="text-lg font-semibold text-foreground mb-1">No customers yet</h3>
            <p className="text-sm text-muted-foreground max-w-xs text-center">
                Add your first customer to start tracking credit sales and payments
            </p>
        </motion.div>
    );
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function Customers() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [filterMode, setFilterMode] = useState<'all' | 'credit' | 'clear'>('all');

    useEffect(() => {
        loadCustomers();
    }, []);

    async function loadCustomers() {
        setIsLoading(true);
        try {
            const data = await getCustomers();
            setCustomers(data);
        } catch (error) {
            toast.error('Failed to load customers');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleSearch(query: string) {
        setSearchQuery(query);
        if (!query.trim()) {
            loadCustomers();
            return;
        }
        setIsLoading(true);
        try {
            const data = await searchCustomers(query);
            setCustomers(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }

    const filteredCustomers = useMemo(() => {
        if (filterMode === 'credit') return customers.filter(c => c.outstanding_balance > 0);
        if (filterMode === 'clear') return customers.filter(c => c.outstanding_balance <= 0);
        return customers;
    }, [customers, filterMode]);

    const stats = useMemo(() => {
        const totalPending = customers.reduce((s, c) => s + c.outstanding_balance, 0);
        const totalPurchases = customers.reduce((s, c) => s + c.total_purchases, 0);
        const withCredit = customers.filter(c => c.outstanding_balance > 0).length;
        return { totalPending, totalPurchases, withCredit, total: customers.length };
    }, [customers]);

    const filterOptions = [
        { value: 'all', label: 'All' },
        { value: 'credit', label: 'With Credit' },
        { value: 'clear', label: 'Cleared' },
    ];

    return (
        <div className="relative min-h-screen pb-8">
            {isLoading ? <CustomerSkeleton /> : (
                <>
                    <div className="space-y-6">
                        {/* ─── HEADER ─── */}
                        <motion.div
                            initial={{ opacity: 0, y: -16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                            className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg shadow-primary/20">
                                    <Users className="w-5 h-5 text-primary-foreground" />
                                </div>
                                <div>
                                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                                        {t('customers.title', 'Customers')}
                                    </h1>
                                    <p className="text-sm text-muted-foreground">
                                        {t('customers.subtitle', 'Manage customer credits (Udhaar) and profiles')}
                                    </p>
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.03, y: -1 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => setShowAddForm(true)}
                                className="btn-primary flex items-center gap-2 shadow-lg shadow-primary/20 rounded-xl"
                            >
                                <Plus className="w-4 h-4" />
                                {t('customers.addCustomer', 'Add Customer')}
                            </motion.button>
                        </motion.div>

                        {/* ─── STATS CARDS ─── */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            <StatCard icon={Users} label="Total Customers" value={stats.total} accent="text-primary bg-primary/10" delay={0.05} />
                            <StatCard icon={AlertCircle} label="Udhaar Pending" value={formatCurrency(stats.totalPending)} accent="text-[rgb(var(--error))] bg-[rgb(var(--error)/.1)]" delay={0.1} />
                            <StatCard icon={CreditCard} label="With Credit" value={stats.withCredit} accent="text-[rgb(var(--warning))] bg-[rgb(var(--warning)/.1)]" delay={0.15} />
                            <StatCard icon={DollarSign} label="Total Purchases" value={formatCurrency(stats.totalPurchases)} accent="text-[rgb(var(--success))] bg-[rgb(var(--success)/.1)]" delay={0.2} />
                        </div>

                        {/* ─── ADD CUSTOMER FORM (SLIDE DOWN) ─── */}
                        <AnimatePresence>
                            {showAddForm && (
                                <AddCustomerForm
                                    onClose={() => setShowAddForm(false)}
                                    onCreated={(c) => setCustomers(prev => [c, ...prev])}
                                />
                            )}
                        </AnimatePresence>

                        {/* ─── SEARCH & FILTERS ─── */}
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.2 }}
                            className="flex flex-col sm:flex-row gap-3"
                        >
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder={t('customers.searchPlaceholder', 'Search by name or phone...')}
                                    value={searchQuery}
                                    onChange={e => handleSearch(e.target.value)}
                                    className="w-full pl-11 pr-10 py-3 bg-card border border-border/60 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary/50 outline-none transition-all"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => handleSearch('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            <div className="flex gap-1.5 bg-card border border-border/60 rounded-xl p-1.5">
                                {filterOptions.map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setFilterMode(opt.value as any)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap ${filterMode === opt.value
                                            ? 'bg-primary/10 text-primary shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </motion.div>

                        {/* ─── CUSTOMER LIST ─── */}
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.25 }}
                            className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden"
                        >
                            {/* Results header */}
                            <div className="px-5 py-3 border-b border-border/40 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <UserCheck className="w-3.5 h-3.5" />
                                    <span className="font-medium">
                                        {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? 's' : ''}
                                    </span>
                                    {(searchQuery || filterMode !== 'all') && (
                                        <span className="text-primary/80">• filtered</span>
                                    )}
                                </div>
                                {(searchQuery || filterMode !== 'all') && (
                                    <button
                                        onClick={() => { handleSearch(''); setFilterMode('all'); }}
                                        className="text-xs text-primary hover:text-primary-dark font-medium transition-colors"
                                    >
                                        Clear filters
                                    </button>
                                )}
                            </div>

                            {/* List */}
                            <AnimatePresence mode="wait">
                                {filteredCustomers.length === 0 && !isLoading ? (
                                    <EmptyState />
                                ) : (
                                    <motion.div
                                        key="list"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                    >
                                        {filteredCustomers.map((customer, index) => (
                                            <CustomerCard
                                                key={customer.id}
                                                customer={customer}
                                                index={index}
                                                onViewLedger={(id) => navigate(`/customers/${id}/ledger`)}
                                            />
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </div>
                </>
            )}
        </div>
    );
}
