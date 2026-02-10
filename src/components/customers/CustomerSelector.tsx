import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Plus, User, Phone } from 'lucide-react';
import { Customer } from '../../lib/types';
import { getCustomers, searchCustomers, createCustomer, recordCustomerTransaction } from '../../lib/api/customers';
import { formatCurrency } from '../../lib/utils/notifications';
import { useAuthStore } from '../../lib/store';
import { toast } from 'sonner';

interface CustomerSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectCustomer: (customer: Customer) => void;
}

export default function CustomerSelector({
    isOpen,
    onClose,
    onSelectCustomer
}: CustomerSelectorProps) {
    const profile = useAuthStore(state => state.profile);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newCustomer, setNewCustomer] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
        openingBalance: ''
    });

    useEffect(() => {
        if (isOpen) {
            loadCustomers();
            setSearchQuery('');
            setShowAddForm(false);
        }
    }, [isOpen]);

    useEffect(() => {
        if (searchQuery) {
            handleSearch();
        } else if (isOpen) {
            loadCustomers();
        }
    }, [searchQuery]);

    const loadCustomers = async () => {
        setIsLoading(true);
        try {
            const data = await getCustomers();
            setCustomers(data);
        } catch (error) {
            console.error('Error loading customers:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setIsLoading(true);
        try {
            const data = await searchCustomers(searchQuery);
            setCustomers(data);
        } catch (error) {
            console.error('Error searching customers:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddCustomer = async () => {
        if (!newCustomer.name || !newCustomer.phone) {
            toast.error('Name and phone are required');
            return;
        }

        try {
            let customer = await createCustomer({
                name: newCustomer.name.trim(),
                phone: newCustomer.phone.trim(),
                email: newCustomer.email.trim() || undefined,
                address: newCustomer.address.trim() || undefined,
                created_by: profile?.id || 'unknown'
            });

            // Handle Opening Balance
            const openingBal = parseFloat(newCustomer.openingBalance);
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

            toast.success(`${customer.name} added!`);
            setCustomers(prev => [customer, ...prev]);
            setShowAddForm(false);
            setNewCustomer({ name: '', phone: '', email: '', address: '', openingBalance: '' });
            onSelectCustomer(customer);
            onClose();
        } catch (error) {
            toast.error('Failed to add customer');
            console.error(error);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                onClick={(e) => e.target === e.currentTarget && onClose()}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="w-full max-w-2xl bg-card rounded-2xl border border-border/60 shadow-2xl overflow-hidden max-h-[80vh] flex flex-col"
                >
                    {/* Header */}
                    <div className="p-5 border-b border-border/40">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                                    <User className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-foreground">Select Customer</h3>
                                    <p className="text-xs text-muted-foreground">For credit sale (Udhaar)</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Search & Add */}
                        <div className="flex gap-2">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search by name or phone..."
                                    className="w-full pl-10 pr-4 py-2.5 bg-background border border-border/60 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary/50 outline-none transition-all"
                                    autoFocus
                                />
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => setShowAddForm(!showAddForm)}
                                className="btn-primary flex items-center gap-1.5 rounded-xl text-sm px-4"
                            >
                                <Plus className="w-4 h-4" />
                                New
                            </motion.button>
                        </div>
                    </div>

                    {/* Add Customer Form */}
                    <AnimatePresence>
                        {showAddForm && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25 }}
                                className="border-b border-border/40 overflow-hidden"
                            >
                                <div className="p-4 bg-secondary/30 space-y-3">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-muted-foreground mb-1">Name *</label>
                                            <input
                                                type="text"
                                                value={newCustomer.name}
                                                onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                                                placeholder="Customer Name"
                                                className="w-full px-3.5 py-2.5 bg-background border border-border/60 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary/50 outline-none transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-muted-foreground mb-1">Phone *</label>
                                            <input
                                                type="tel"
                                                value={newCustomer.phone}
                                                onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
                                                placeholder="+92 300 1234567"
                                                className="w-full px-3.5 py-2.5 bg-background border border-border/60 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary/50 outline-none transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-muted-foreground mb-1">Email</label>
                                            <input
                                                type="email"
                                                value={newCustomer.email}
                                                onChange={(e) => setNewCustomer(prev => ({ ...prev, email: e.target.value }))}
                                                placeholder="email@example.com"
                                                className="w-full px-3.5 py-2.5 bg-background border border-border/60 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary/50 outline-none transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-muted-foreground mb-1">Address</label>
                                            <input
                                                type="text"
                                                value={newCustomer.address}
                                                onChange={(e) => setNewCustomer(prev => ({ ...prev, address: e.target.value }))}
                                                placeholder="Address (optional)"
                                                className="w-full px-3.5 py-2.5 bg-background border border-border/60 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary/50 outline-none transition-all"
                                            />
                                        </div>
                                        <div className="sm:col-span-2 border-t border-border/40 pt-3 mt-1">
                                            <label className="block text-xs font-medium text-muted-foreground mb-1">Opening Balance (Optional)</label>
                                            <div className="relative">
                                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-xs">Rs</span>
                                                <input
                                                    type="number"
                                                    value={newCustomer.openingBalance}
                                                    onChange={(e) => setNewCustomer(prev => ({ ...prev, openingBalance: e.target.value }))}
                                                    placeholder="0.00"
                                                    className="w-full pl-8 pr-4 py-2.5 bg-background border border-border/60 rounded-xl text-sm font-bold text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary/50 outline-none transition-all"
                                                />
                                            </div>
                                            <p className="text-[10px] text-muted-foreground mt-1.5 ml-1">
                                                Enter amount if the customer already owes money (Old Balance).
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => setShowAddForm(false)} className="px-4 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                                            Cancel
                                        </button>
                                        <button onClick={handleAddCustomer} className="btn-primary rounded-xl text-sm px-4 py-2">
                                            Add & Select
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Customer List */}
                    <div className="flex-1 overflow-y-auto">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-40">
                                <div className="flex items-center gap-3 text-muted-foreground">
                                    <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                    <span className="text-sm">Loading customers...</span>
                                </div>
                            </div>
                        ) : customers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 px-6">
                                <motion.div
                                    animate={{ y: [6, -3, 6] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                                    className="w-14 h-14 rounded-2xl bg-secondary/60 flex items-center justify-center mb-3"
                                >
                                    <User className="w-7 h-7 text-muted-foreground/50" />
                                </motion.div>
                                <p className="text-sm text-muted-foreground mb-1">No customers found</p>
                                <p className="text-xs text-muted-foreground/70">Add a new customer for credit sales</p>
                            </div>
                        ) : (
                            <div className="p-2 space-y-0.5">
                                {customers.map((customer, index) => {
                                    const initials = customer.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                                    const hasBalance = customer.outstanding_balance > 0;

                                    return (
                                        <motion.div
                                            key={customer.id}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.025, duration: 0.3 }}
                                            onClick={() => {
                                                onSelectCustomer(customer);
                                                onClose();
                                            }}
                                            className="flex items-center gap-3.5 p-3.5 rounded-xl hover:bg-secondary/50 cursor-pointer transition-all duration-200 group"
                                        >
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-semibold text-xs transition-transform group-hover:scale-110 ${hasBalance
                                                ? 'bg-[rgb(var(--error)/.12)] text-[rgb(var(--error))]'
                                                : 'bg-gradient-to-br from-primary/15 to-accent/15 text-primary'
                                                }`}>
                                                {initials}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-medium text-foreground text-sm truncate">{customer.name}</h4>
                                                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                                    <Phone className="w-3 h-3" />
                                                    {customer.phone}
                                                </p>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <div className={`font-semibold text-sm tabular-nums ${hasBalance ? 'text-[rgb(var(--error))]' : 'text-[rgb(var(--success))]'
                                                    }`}>
                                                    {formatCurrency(customer.outstanding_balance)}
                                                </div>
                                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Balance</p>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
