import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Plus, Search, Phone, ArrowRight, History, Wallet } from 'lucide-react';
import { Customer } from '../../lib/types';
import { getCustomers, searchCustomers } from '../../lib/api/customers';
import { formatCurrency } from '../../lib/utils/notifications';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import CustomerSelector from '../../components/customers/CustomerSelector';

export default function Customers() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        loadCustomers();
    }, []);

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

    const handleSearch = async (query: string) => {
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
            console.error('Error searching customers:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gradient">Customers</h1>
                    <p className="text-gray-400 mt-1">Manage customer credit (Udhaar) and profiles</p>
                </div>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsModalOpen(true)}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Add Customer
                </motion.button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search customers by name or phone..."
                            className="input-dark pl-10 w-full"
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center p-12">
                            <LoadingSpinner size="lg" text="Loading customers..." />
                        </div>
                    ) : customers.length === 0 ? (
                        <div className="glass-card p-12 text-center">
                            <User className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-400">No customers found</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {customers.map((customer) => (
                                <motion.div
                                    key={customer.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="glass-card p-5 hover-lift group"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-2 rounded-lg bg-accent-500/20 text-accent-400">
                                            <User className="w-6 h-6" />
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-lg font-bold ${customer.outstanding_balance > 0 ? 'text-error-400' : 'text-success-400'}`}>
                                                {formatCurrency(customer.outstanding_balance)}
                                            </p>
                                            <p className="text-xs text-gray-500 uppercase tracking-wider">Credit Due</p>
                                        </div>
                                    </div>

                                    <h3 className="text-lg font-semibold text-white group-hover:text-accent-400 transition-colors">
                                        {customer.name}
                                    </h3>
                                    <p className="text-sm text-gray-400 flex items-center gap-2">
                                        <Phone className="w-3.5 h-3.5" />
                                        {customer.phone}
                                    </p>

                                    <div className="mt-6 flex items-center justify-between">
                                        <div className="text-xs text-gray-500">
                                            Purchases: {formatCurrency(customer.total_purchases)}
                                        </div>
                                        <button className="text-accent-400 text-sm font-medium flex items-center gap-1 hover:underline">
                                            View Ledger <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="glass-card p-6">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <History className="w-5 h-5 text-primary-400" />
                            Total Collections
                        </h3>
                        <div className="space-y-4">
                            <div className="p-4 rounded-xl bg-error-500/10 border border-error-500/30">
                                <p className="text-gray-400 text-xs uppercase tracking-wider">Total "Udhaar" Pending</p>
                                <p className="text-2xl font-bold text-error-400 mt-1">
                                    {formatCurrency(customers.reduce((sum, c) => sum + c.outstanding_balance, 0))}
                                </p>
                            </div>
                            <div className="p-4 rounded-xl bg-primary-500/10 border border-primary-500/30">
                                <p className="text-gray-400 text-xs uppercase tracking-wider">Active Customers</p>
                                <p className="text-2xl font-bold text-primary-400 mt-1">{customers.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card p-6">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Wallet className="w-5 h-5 text-success-400" />
                            Quick Actions
                        </h3>
                        <div className="space-y-2">
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="w-full btn-secondary text-sm py-3 justify-center"
                            >
                                Collect Payment
                            </button>
                            <button className="w-full btn-secondary text-sm py-3 justify-center">
                                Send Payment Reminder
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <CustomerSelector
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    loadCustomers();
                }}
                onSelectCustomer={() => { }} // Not used in this context
            />
        </div>
    );
}
