import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Plus, User, Phone } from 'lucide-react';
import { Customer } from '../../lib/types';
import { getCustomers, searchCustomers, createCustomer } from '../../lib/api/customers';
import { formatCurrency } from '../../lib/utils/notifications';
import { useAuthStore } from '../../lib/store';
import LoadingSpinner from '../ui/LoadingSpinner';

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
        address: ''
    });

    useEffect(() => {
        if (isOpen) {
            loadCustomers();
        }
    }, [isOpen]);

    useEffect(() => {
        if (searchQuery) {
            handleSearch();
        } else {
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
        if (!newCustomer.name || !newCustomer.phone) return;

        try {
            const customer = await createCustomer({
                ...newCustomer,
                created_by: profile?.id || 'unknown'
            });
            setCustomers(prev => [customer, ...prev]);
            setShowAddForm(false);
            setNewCustomer({ name: '', phone: '', email: '', address: '' });
            onSelectCustomer(customer);
            onClose();
        } catch (error) {
            console.error('Error adding customer:', error);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                onClick={(e) => e.target === e.currentTarget && onClose()}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="w-full max-w-2xl bg-dark-800 rounded-2xl border border-dark-700/50 shadow-dark-lg overflow-hidden max-h-[80vh] flex flex-col"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-dark-700/50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 rounded-lg bg-accent-500/20 text-accent-400">
                                    <User className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-white">Select Customer</h3>
                                    <p className="text-gray-400 text-sm">For credit sale (Udhaar)</p>
                                </div>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={onClose}
                                className="p-2 rounded-lg bg-dark-700/50 text-gray-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </motion.button>
                        </div>

                        {/* Search & Add */}
                        <div className="mt-4 flex gap-3">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search by name or phone..."
                                    className="w-full input-dark pl-10"
                                    autoFocus
                                />
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setShowAddForm(!showAddForm)}
                                className="btn-primary flex items-center gap-2"
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
                                className="border-b border-dark-700/50 overflow-hidden"
                            >
                                <div className="p-4 bg-dark-900/50 space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <input
                                            type="text"
                                            value={newCustomer.name}
                                            onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder="Customer Name *"
                                            className="input-dark"
                                        />
                                        <input
                                            type="tel"
                                            value={newCustomer.phone}
                                            onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
                                            placeholder="Phone (e.g., +92 300 1234567) *"
                                            className="input-dark"
                                        />
                                        <input
                                            type="email"
                                            value={newCustomer.email}
                                            onChange={(e) => setNewCustomer(prev => ({ ...prev, email: e.target.value }))}
                                            placeholder="Email"
                                            className="input-dark"
                                        />
                                        <input
                                            type="text"
                                            value={newCustomer.address}
                                            onChange={(e) => setNewCustomer(prev => ({ ...prev, address: e.target.value }))}
                                            placeholder="Address"
                                            className="input-dark"
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => setShowAddForm(false)} className="btn-secondary">Cancel</button>
                                        <button onClick={handleAddCustomer} className="btn-primary">Add & Select</button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Customer List */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-40">
                                <LoadingSpinner size="lg" text="Loading customers..." />
                            </div>
                        ) : customers.length === 0 ? (
                            <div className="text-center py-12">
                                <User className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                                <p className="text-gray-400">No customers found</p>
                                <p className="text-gray-500 text-sm mt-1">Add a new customer for credit sales</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {customers.map((customer, index) => (
                                    <motion.div
                                        key={customer.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.03 }}
                                        onClick={() => {
                                            onSelectCustomer(customer);
                                            onClose();
                                        }}
                                        className="p-3 rounded-xl border border-dark-700/50 bg-dark-800/50 hover:border-accent-500/50 cursor-pointer transition-all"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-accent-500/20 text-accent-400">
                                                    <User className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <h4 className="text-white font-medium">{customer.name}</h4>
                                                    <p className="text-gray-400 text-sm flex items-center gap-1">
                                                        <Phone className="w-3 h-3" />
                                                        {customer.phone}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <div className={`font-semibold ${customer.outstanding_balance > 0 ? 'text-warning-400' : 'text-success-400'
                                                    }`}>
                                                    {formatCurrency(customer.outstanding_balance)}
                                                </div>
                                                <p className="text-gray-500 text-xs">Balance</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
