import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Plus, Building2, Phone, Mail, User, MapPin, Receipt, Check } from 'lucide-react';
import { Vendor } from '../../lib/types';
import { getVendors, searchVendors, createVendor } from '../../lib/api/vendors';
import { formatCurrency } from '../../lib/utils/notifications';
import { useAuthStore } from '../../lib/store';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

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
    const { t } = useTranslation();
    const emptyVendorForm = { name: '', company: '', phone: '', email: '', address: '', gst_number: '' };
    const profile = useAuthStore(state => state.profile);
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newVendor, setNewVendor] = useState({
        name: '',
        company: '',
        phone: '',
        email: '',
        address: '',
        gst_number: ''
    });

    const hasUnsavedVendorInput = () => {
        return Object.values(newVendor).some(value => value.trim() !== '');
    };

    const handleCancelAddForm = () => {
        if (hasUnsavedVendorInput()) {
            toast.info(t('vendors.messages.unsavedDiscarded', 'Unsaved vendor details were discarded'));
        }
        setShowAddForm(false);
        setNewVendor(emptyVendorForm);
    };

    useEffect(() => {
        if (isOpen) {
            loadVendors();
        }
    }, [isOpen]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery) {
                handleSearch();
            } else if (isOpen) {
                loadVendors();
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const loadVendors = async () => {
        setIsLoading(true);
        try {
            const data = await getVendors();
            setVendors(data);
        } catch (error: any) {
            console.error('Error loading vendors:', error);
            const msg = error.message?.includes('index')
                ? t('vendors.messages.indexRequired', 'Database index required. Please check the browser console for the setup link.')
                : t('vendors.messages.loadFailed', 'Failed to load vendors');
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
            toast.error(t('vendors.messages.searchFailed', 'Search failed'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddVendor = async (e?: React.FormEvent) => {
        e?.preventDefault();

        const payload = {
            ...newVendor,
            name: newVendor.name.trim(),
            company: newVendor.company.trim(),
            phone: newVendor.phone.trim(),
            email: newVendor.email.trim(),
            address: newVendor.address.trim(),
            gst_number: newVendor.gst_number.trim()
        };

        if (!payload.name || !payload.company || !payload.phone) {
            toast.error(t('vendors.messages.requiredFields', 'Please fill in all required fields (*)'));
            return;
        }

        try {
            setIsAdding(true);
            const vendor = await createVendor({
                ...payload,
                created_by: profile?.id || 'unknown'
            });
            setVendors(prev => [vendor, ...prev]);
            setShowAddForm(false);
            setNewVendor(emptyVendorForm);
            toast.success(t('vendors.messages.addSuccess', '{{company}} added successfully', { company: vendor.company }));

            // If in select mode, auto-select the new vendor
            if (mode === 'select' && onSelectVendor) {
                onSelectVendor(vendor);
                onClose();
            }
        } catch (error) {
            console.error('Error adding vendor:', error);
            toast.error(t('vendors.messages.addFailed', 'Failed to add vendor'));
        } finally {
            setIsAdding(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence mode="wait">
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-background/30 backdrop-blur-md"
                        onClick={onClose}
                    />
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none">
                        <motion.div
                            initial={{ y: '100%', opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: '100%', opacity: 0 }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            style={{ maxHeight: '92vh' }}
                        >
                            {/* Mobile drag handle */}
                            <div className="flex justify-center pt-3 pb-1 sm:hidden flex-shrink-0">
                                <div className="w-10 h-1 bg-border rounded-full" />
                            </div>
                            {/* Header */}
                            <div className="p-6 border-b border-border/50 bg-secondary/10 backdrop-blur-md relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                                <div className="flex items-center justify-between relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                                            <Building2 className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-foreground">
                                                {mode === 'select' ? 'Select Vendor' : 'Vendor Directory'}
                                            </h3>
                                            <p className="text-muted-foreground text-sm">
                                                {vendors.length} vendors available
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="p-2 rounded-xl bg-secondary hover:bg-destructive/10 hover:text-destructive transition-colors text-muted-foreground"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Controls */}
                                <div className="mt-6 flex gap-3">
                                    <div className="flex-1 relative group">
                                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Search by name, company, or phone..."
                                            className="w-full pl-12 pr-4 py-3 bg-background border border-border/50 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all outline-none"
                                            autoFocus
                                        />
                                    </div>
                                    <button
                                        onClick={() => showAddForm ? handleCancelAddForm() : setShowAddForm(true)}
                                        className={`px-5 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${showAddForm
                                            ? 'bg-secondary text-foreground hover:bg-secondary/80'
                                            : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20'}`}
                                    >
                                        {showAddForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                                        <span className="hidden sm:inline">{showAddForm ? 'Cancel' : 'Add Vendor'}</span>
                                    </button>
                                </div>
                            </div>

                            {/* Add Form with smooth expansion */}
                            <AnimatePresence>
                                {showAddForm && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="border-b border-border/50 bg-secondary/5 overflow-hidden"
                                    >
                                        <form onSubmit={handleAddVendor} className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-4">
                                                <div className="relative">
                                                    <User className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground" />
                                                    <input
                                                        type="text"
                                                        value={newVendor.name}
                                                        onChange={(e) => setNewVendor(prev => ({ ...prev, name: e.target.value }))}
                                                        placeholder="Contact Name *"
                                                        className="w-full pl-9 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                                    />
                                                </div>
                                                <div className="relative">
                                                    <Building2 className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground" />
                                                    <input
                                                        type="text"
                                                        value={newVendor.company}
                                                        onChange={(e) => setNewVendor(prev => ({ ...prev, company: e.target.value }))}
                                                        placeholder="Company Name *"
                                                        className="w-full pl-9 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                                    />
                                                </div>
                                                <div className="relative">
                                                    <Phone className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground" />
                                                    <input
                                                        type="tel"
                                                        value={newVendor.phone}
                                                        onChange={(e) => setNewVendor(prev => ({ ...prev, phone: e.target.value }))}
                                                        placeholder="Phone Number *"
                                                        className="w-full pl-9 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="relative">
                                                    <Mail className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground" />
                                                    <input
                                                        type="email"
                                                        value={newVendor.email}
                                                        onChange={(e) => setNewVendor(prev => ({ ...prev, email: e.target.value }))}
                                                        placeholder="Email Address"
                                                        className="w-full pl-9 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                                    />
                                                </div>
                                                <div className="relative">
                                                    <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground" />
                                                    <input
                                                        type="text"
                                                        value={newVendor.address}
                                                        onChange={(e) => setNewVendor(prev => ({ ...prev, address: e.target.value }))}
                                                        placeholder="Address"
                                                        className="w-full pl-9 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                                    />
                                                </div>
                                                <div className="relative">
                                                    <Receipt className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground" />
                                                    <input
                                                        type="text"
                                                        value={newVendor.gst_number}
                                                        onChange={(e) => setNewVendor(prev => ({ ...prev, gst_number: e.target.value }))}
                                                        placeholder="GST Number"
                                                        className="w-full pl-9 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                                    />
                                                </div>
                                            </div>
                                            <div className="sm:col-span-2 flex justify-end">
                                                <button
                                                    type="submit"
                                                    disabled={isAdding}
                                                    className="btn-primary px-8 py-3 rounded-xl shadow-lg shadow-primary/20 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                                                >
                                                    <Check className="w-5 h-5" />
                                                    {isAdding ? 'Saving...' : 'Save New Vendor'}
                                                </button>
                                            </div>
                                        </form>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* List */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-secondary/5">
                                {isLoading ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {[...Array(6)].map((_, i) => (
                                            <div key={i} className="h-24 bg-secondary/20 rounded-[1.5rem] animate-pulse" />
                                        ))}
                                    </div>
                                ) : vendors.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                                        <div className="w-20 h-20 bg-secondary/30 rounded-full flex items-center justify-center mb-4">
                                            <Building2 className="w-10 h-10 opacity-50" />
                                        </div>
                                        <p className="text-lg font-medium text-foreground">No vendors found</p>
                                        <p className="text-sm">Try adding a new vendor to get started.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-2">
                                        {vendors.map((vendor, index) => (
                                            <motion.div
                                                key={vendor.id}
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.04 }}
                                                onClick={() => mode === 'select' && onSelectVendor && onSelectVendor(vendor)}
                                                className={`group flex items-center gap-3 p-3 sm:p-4 rounded-2xl border border-border/50 bg-card hover:border-primary/50 hover:shadow-md transition-all duration-200 relative overflow-hidden ${mode === 'select' ? 'cursor-pointer' : ''}`}
                                            >
                                                <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-full blur-xl -mr-6 -mt-6 opacity-0 group-hover:opacity-100 transition-opacity" />

                                                {/* Avatar */}
                                                <div className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center text-foreground font-bold text-sm group-hover:bg-primary/10 group-hover:text-primary transition-colors flex-shrink-0">
                                                    {vendor.company.charAt(0)}
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0 relative z-10">
                                                    <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
                                                        {vendor.company}
                                                    </h4>
                                                    <div className="flex items-center gap-2 mt-0.5 text-xs text-foreground-muted">
                                                        <span className="flex items-center gap-1 truncate">
                                                            <User className="w-3 h-3 flex-shrink-0" />
                                                            {vendor.name}
                                                        </span>
                                                        <span className="hidden sm:flex items-center gap-1">
                                                            <Phone className="w-3 h-3 flex-shrink-0" />
                                                            {vendor.phone}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Balance */}
                                                <div className="text-right flex-shrink-0 relative z-10">
                                                    <p className={`text-sm font-bold tabular-nums ${vendor.outstanding_balance > 0 ? 'text-warning-500' : 'text-success-500'}`}>
                                                        {formatCurrency(vendor.outstanding_balance)}
                                                    </p>
                                                    <p className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest">Balance</p>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
