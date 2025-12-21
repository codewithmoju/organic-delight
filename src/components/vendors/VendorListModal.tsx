import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Plus, Building2, Phone, Mail } from 'lucide-react';
import { Vendor } from '../../lib/types';
import { getVendors, searchVendors, createVendor } from '../../lib/api/vendors';
import { formatCurrency } from '../../lib/utils/notifications';
import { useAuthStore } from '../../lib/store';
import LoadingSpinner from '../ui/LoadingSpinner';
import { toast } from 'sonner';

interface VendorListModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectVendor?: (vendor: Vendor) => void;
    mode?: 'select' | 'view';
}

export default function VendorListModal({
    isOpen,
    onClose,
    onSelectVendor,
    mode = 'view'
}: VendorListModalProps) {
    const profile = useAuthStore(state => state.profile);
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newVendor, setNewVendor] = useState({
        name: '',
        company: '',
        phone: '',
        email: '',
        address: '',
        gst_number: ''
    });

    useEffect(() => {
        if (isOpen) {
            loadVendors();
        }
    }, [isOpen]);

    useEffect(() => {
        if (searchQuery) {
            handleSearch();
        } else {
            loadVendors();
        }
    }, [searchQuery]);

    const loadVendors = async () => {
        setIsLoading(true);
        try {
            const data = await getVendors();
            setVendors(data);
        } catch (error: any) {
            console.error('Error loading vendors:', error);
            const msg = error.message?.includes('index')
                ? 'Database index required. Please check the browser console for the setup link.'
                : 'Failed to load vendors';
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setIsLoading(true);
        try {
            const data = await searchVendors(searchQuery);
            setVendors(data);
        } catch (error) {
            console.error('Error searching vendors:', error);
            toast.error('Search failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddVendor = async () => {
        if (!newVendor.name || !newVendor.company || !newVendor.phone) {
            toast.error('Please fill in all required fields (*)');
            return;
        }

        try {
            const vendor = await createVendor({
                ...newVendor,
                created_by: profile?.id || 'unknown'
            });
            setVendors(prev => [vendor, ...prev]);
            setShowAddForm(false);
            setNewVendor({ name: '', company: '', phone: '', email: '', address: '', gst_number: '' });
            toast.success('Vendor added successfully');

            // If in select mode, auto-select the new vendor
            if (mode === 'select' && onSelectVendor) {
                onSelectVendor(vendor);
                onClose();
            }
        } catch (error) {
            console.error('Error adding vendor:', error);
            toast.error('Failed to add vendor');
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
                    className="w-full max-w-4xl bg-dark-800 rounded-2xl border border-dark-700/50 shadow-dark-lg overflow-hidden max-h-[90vh] flex flex-col"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-dark-700/50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 rounded-lg bg-primary-500/20 text-primary-400">
                                    <Building2 className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-white">Vendor Directory</h3>
                                    <p className="text-gray-400 text-sm">Press F12 to open • {vendors.length} vendors</p>
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
                                    placeholder="Search vendors by name, company, or phone..."
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
                                Add Vendor
                            </motion.button>
                        </div>
                    </div>

                    {/* Add Vendor Form */}
                    <AnimatePresence>
                        {showAddForm && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="border-b border-dark-700/50 overflow-hidden"
                            >
                                <div className="p-4 bg-dark-900/50 space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <input
                                            type="text"
                                            value={newVendor.name}
                                            onChange={(e) => setNewVendor(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder="Contact Name *"
                                            className="input-dark"
                                        />
                                        <input
                                            type="text"
                                            value={newVendor.company}
                                            onChange={(e) => setNewVendor(prev => ({ ...prev, company: e.target.value }))}
                                            placeholder="Company Name *"
                                            className="input-dark"
                                        />
                                        <input
                                            type="tel"
                                            value={newVendor.phone}
                                            onChange={(e) => setNewVendor(prev => ({ ...prev, phone: e.target.value }))}
                                            placeholder="Phone (e.g., +92 300 1234567) *"
                                            className="input-dark"
                                        />
                                        <input
                                            type="email"
                                            value={newVendor.email}
                                            onChange={(e) => setNewVendor(prev => ({ ...prev, email: e.target.value }))}
                                            placeholder="Email"
                                            className="input-dark"
                                        />
                                        <input
                                            type="text"
                                            value={newVendor.address}
                                            onChange={(e) => setNewVendor(prev => ({ ...prev, address: e.target.value }))}
                                            placeholder="Address"
                                            className="input-dark"
                                        />
                                        <input
                                            type="text"
                                            value={newVendor.gst_number}
                                            onChange={(e) => setNewVendor(prev => ({ ...prev, gst_number: e.target.value }))}
                                            placeholder="GST Number"
                                            className="input-dark"
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => setShowAddForm(false)} className="btn-secondary">Cancel</button>
                                        <button onClick={handleAddVendor} className="btn-primary">Save Vendor</button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Vendor List */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-40">
                                <LoadingSpinner size="lg" text="Loading vendors..." />
                            </div>
                        ) : vendors.length === 0 ? (
                            <div className="text-center py-12">
                                <Building2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                                <p className="text-gray-400">No vendors found</p>
                                <p className="text-gray-500 text-sm mt-1">Add your first vendor to get started</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {vendors.map((vendor, index) => (
                                    <motion.div
                                        key={vendor.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        onClick={() => {
                                            if (mode === 'select' && onSelectVendor) {
                                                onSelectVendor(vendor);
                                                onClose();
                                            }
                                        }}
                                        className={`p-4 rounded-xl border border-dark-700/50 bg-dark-800/50 hover:border-primary-500/50 transition-all ${mode === 'select' ? 'cursor-pointer' : ''
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-primary-500/20 text-primary-400">
                                                        <Building2 className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-white font-semibold">{vendor.company}</h4>
                                                        <p className="text-gray-400 text-sm">{vendor.name}</p>
                                                    </div>
                                                </div>
                                                <div className="mt-2 flex items-center gap-4 text-sm text-gray-400">
                                                    <span className="flex items-center gap-1">
                                                        <Phone className="w-3 h-3" />
                                                        {vendor.phone}
                                                    </span>
                                                    {vendor.email && (
                                                        <span className="flex items-center gap-1">
                                                            <Mail className="w-3 h-3" />
                                                            {vendor.email}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <div className={`text-lg font-bold ${vendor.outstanding_balance > 0 ? 'text-warning-400' : 'text-success-400'
                                                    }`}>
                                                    {formatCurrency(vendor.outstanding_balance)}
                                                </div>
                                                <p className="text-gray-500 text-xs">Outstanding Balance</p>
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
