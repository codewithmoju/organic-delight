import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Building2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Vendor } from '../../lib/types';
import { searchVendors, createVendor } from '../../lib/api/vendors';
import { useAuthStore } from '../../lib/store';
import LoadingSpinner from '../ui/LoadingSpinner';

interface VendorSelectorProps {
    onVendorSelected: (vendor: Vendor) => void;
    selectedVendor?: Vendor | null;
}

export default function VendorSelector({ onVendorSelected, selectedVendor }: VendorSelectorProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const user = useAuthStore(state => state.user);

    const [newVendor, setNewVendor] = useState({
        name: '',
        company: '',
        phone: ''
    });

    useEffect(() => {
        if (searchQuery.length >= 2) {
            handleSearch();
        } else {
            setVendors([]);
        }
    }, [searchQuery]);

    const handleSearch = async () => {
        setIsSearching(true);
        try {
            const results = await searchVendors(searchQuery);
            setVendors(results);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleCreateVendor = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newVendor.name.trim() || !newVendor.company.trim() || !newVendor.phone.trim()) {
            toast.error('Please fill in all required fields');
            return;
        }

        setIsCreating(true);
        try {
            const vendor = await createVendor({
                ...newVendor,
                name: newVendor.name.trim(),
                company: newVendor.company.trim(),
                phone: newVendor.phone.trim(),
                created_by: user?.uid || 'unknown'
            });

            toast.success('Vendor created successfully');
            onVendorSelected(vendor);
            setShowCreateForm(false);
            setNewVendor({ name: '', company: '', phone: '' });
        } catch (error: any) {
            toast.error(error.message || 'Failed to create vendor');
            console.error(error);
        } finally {
            setIsCreating(false);
        }
    };

    if (selectedVendor) {
        return (
            <div className="bg-primary-500/10 border border-primary-500/30 rounded-lg p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Building2 className="w-5 h-5 text-primary-400" />
                        <div>
                            <p className="text-white font-semibold">{selectedVendor.name}</p>
                            <p className="text-sm text-gray-400">{selectedVendor.company}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => onVendorSelected(null as any)}
                        className="p-2 hover:bg-dark-700 rounded transition-colors"
                    >
                        <X className="w-4 h-4 text-gray-400" />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                    Select Vendor *
                </label>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search vendors by name or company..."
                        className="w-full input-dark pl-10"
                    />
                </div>

                {/* Search Results */}
                <AnimatePresence>
                    {searchQuery.length >= 2 && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-2 bg-dark-800 border border-dark-700 rounded-lg overflow-hidden max-h-60 overflow-y-auto"
                        >
                            {isSearching ? (
                                <div className="p-4 text-center">
                                    <LoadingSpinner size="sm" text="Searching..." />
                                </div>
                            ) : vendors.length > 0 ? (
                                <div className="divide-y divide-dark-700">
                                    {vendors.map((vendor) => (
                                        <button
                                            key={vendor.id}
                                            onClick={() => onVendorSelected(vendor)}
                                            className="w-full p-3 text-left hover:bg-dark-700 transition-colors flex items-center gap-3"
                                        >
                                            <Building2 className="w-4 h-4 text-primary-400" />
                                            <div>
                                                <p className="text-white font-medium">{vendor.name}</p>
                                                <p className="text-sm text-gray-400">{vendor.company}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-4 text-center text-gray-400">
                                    <p>No vendors found</p>
                                    <button
                                        onClick={() => setShowCreateForm(true)}
                                        className="mt-2 text-primary-400 hover:text-primary-300 text-sm"
                                    >
                                        Create new vendor
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Create New Vendor Button */}
            {!showCreateForm && (
                <button
                    onClick={() => setShowCreateForm(true)}
                    className="btn-secondary w-full flex items-center justify-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Create New Vendor
                </button>
            )}

            {/* Inline Vendor Creation Form */}
            <AnimatePresence>
                {showCreateForm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-dark-800/50 border border-accent-500/30 rounded-lg p-4"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-semibold text-accent-400">Create New Vendor</h4>
                            <button
                                onClick={() => setShowCreateForm(false)}
                                className="p-1 hover:bg-dark-700 rounded transition-colors"
                            >
                                <X className="w-4 h-4 text-gray-400" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateVendor} className="space-y-3">
                            <div>
                                <input
                                    type="text"
                                    value={newVendor.name}
                                    onChange={(e) => setNewVendor(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Contact person name *"
                                    className="w-full input-dark text-sm"
                                    required
                                />
                            </div>

                            <div>
                                <input
                                    type="text"
                                    value={newVendor.company}
                                    onChange={(e) => setNewVendor(prev => ({ ...prev, company: e.target.value }))}
                                    placeholder="Company name *"
                                    className="w-full input-dark text-sm"
                                    required
                                />
                            </div>

                            <div>
                                <input
                                    type="tel"
                                    value={newVendor.phone}
                                    onChange={(e) => setNewVendor(prev => ({ ...prev, phone: e.target.value }))}
                                    placeholder="Phone number (e.g., +92 300 1234567) *"
                                    className="w-full input-dark text-sm"
                                    required
                                />
                            </div>

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateForm(false)}
                                    className="btn-secondary text-sm px-3 py-1.5"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreating}
                                    className="btn-primary text-sm px-3 py-1.5 flex items-center gap-2"
                                >
                                    {isCreating ? (
                                        <>
                                            <LoadingSpinner size="sm" color="white" />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="w-3 h-3" />
                                            Create Vendor
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
