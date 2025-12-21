import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, Plus, Search, Phone, Mail, ArrowRight, History, CreditCard, Trash2 } from 'lucide-react';
import { Vendor } from '../../lib/types';
import { getVendors, searchVendors, deleteVendor } from '../../lib/api/vendors';
import { formatCurrency } from '../../lib/utils/notifications';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import VendorListModal from '../../components/vendors/VendorListModal';
import { toast } from 'sonner';

export default function Vendors() {
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        loadVendors();
    }, []);

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

    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        if (!query.trim()) {
            loadVendors();
            return;
        }
        setIsLoading(true);
        try {
            const data = await searchVendors(query);
            setVendors(data);
        } catch (error) {
            console.error('Error searching vendors:', error);
            toast.error('Search failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteVendor = async (vendorId: string, vendorName: string) => {
        if (!confirm(`Are you sure you want to delete vendor "${vendorName}"? This action cannot be undone.`)) {
            return;
        }

        try {
            await deleteVendor(vendorId);
            toast.success('Vendor deleted successfully');
            loadVendors();
        } catch (error: any) {
            console.error('Error deleting vendor:', error);
            toast.error(error.message || 'Failed to delete vendor');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gradient">Vendors</h1>
                    <p className="text-gray-400 mt-1">Manage your suppliers and outstanding balances</p>
                </div>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsModalOpen(true)}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Add Vendor
                </motion.button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search vendors by name, company or phone..."
                            className="input-dark pl-10 w-full"
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center p-12">
                            <LoadingSpinner size="lg" text="Loading vendors..." />
                        </div>
                    ) : vendors.length === 0 ? (
                        <div className="glass-card p-12 text-center">
                            <Building2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-400">No vendors found</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {vendors.map((vendor) => (
                                <motion.div
                                    key={vendor.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="glass-card p-5 hover-lift group"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-2 rounded-lg bg-primary-500/20 text-primary-400">
                                            <Building2 className="w-6 h-6" />
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-lg font-bold ${vendor.outstanding_balance > 0 ? 'text-warning-400' : 'text-success-400'}`}>
                                                {formatCurrency(vendor.outstanding_balance)}
                                            </p>
                                            <p className="text-xs text-gray-500 uppercase tracking-wider">
                                                {vendor.outstanding_balance < 0 ? 'Credit' : 'Balance'}
                                            </p>
                                        </div>
                                    </div>

                                    <h3 className="text-lg font-semibold text-white group-hover:text-primary-400 transition-colors">
                                        {vendor.company}
                                    </h3>
                                    <p className="text-sm text-gray-400">{vendor.name}</p>

                                    <div className="mt-4 space-y-2">
                                        <div className="flex items-center gap-2 text-sm text-gray-400">
                                            <Phone className="w-4 h-4" />
                                            {vendor.phone}
                                        </div>
                                        {vendor.email && (
                                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                                <Mail className="w-4 h-4" />
                                                {vendor.email}
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-6 flex items-center justify-between">
                                        <div className="text-xs text-gray-500">
                                            {vendor.total_purchases > 0 ? `Total: ${formatCurrency(vendor.total_purchases)}` : 'No purchases yet'}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleDeleteVendor(vendor.id, vendor.company)}
                                                className="p-2 text-gray-400 hover:text-error-400 hover:bg-error-500/10 rounded transition-colors"
                                                title="Delete vendor"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => navigate(`/vendors/${vendor.id}/ledger`)}
                                                className="text-primary-400 text-sm font-medium flex items-center gap-1 hover:underline"
                                            >
                                                View Ledger <ArrowRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="glass-card p-6">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <History className="w-5 h-5 text-accent-400" />
                            Quick Summary
                        </h3>
                        <div className="space-y-4">
                            <div className="p-4 rounded-xl bg-warning-500/10 border border-warning-500/30">
                                <p className="text-gray-400 text-xs uppercase tracking-wider">Net Outstanding</p>
                                <p className={`text-2xl font-bold mt-1 ${vendors.reduce((sum, v) => sum + v.outstanding_balance, 0) < 0 ? 'text-success-400' : 'text-warning-400'}`}>
                                    {formatCurrency(vendors.reduce((sum, v) => sum + v.outstanding_balance, 0))}
                                </p>
                            </div>
                            <div className="p-4 rounded-xl bg-primary-500/10 border border-primary-500/30">
                                <p className="text-gray-400 text-xs uppercase tracking-wider">Total Suppliers</p>
                                <p className="text-2xl font-bold text-primary-400 mt-1">{vendors.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card p-6">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-primary-400" />
                            Global Actions
                        </h3>
                        <div className="space-y-2">
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="w-full btn-secondary text-sm py-3 justify-center"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add New Vendor
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <VendorListModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    loadVendors();
                }}
            />
        </div>
    );
}
