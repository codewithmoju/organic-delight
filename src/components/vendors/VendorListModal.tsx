import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Plus, Building2, Phone, Mail, User, MapPin, Receipt, Check } from 'lucide-react';
import { Vendor } from '../../lib/types';
import { getVendors, searchVendors, createVendor } from '../../lib/api/vendors';
import { formatCurrency } from '../../lib/utils/notifications';
import { useAuthStore } from '../../lib/store';
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
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 pointer-events-none">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="w-full h-full sm:w-[95vw] sm:h-[92vh] bg-card border border-border/50 shadow-2xl sm:rounded-[2.5rem] rounded-xl overflow-hidden flex flex-col pointer-events-auto"
                        >
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
                                        onClick={() => setShowAddForm(!showAddForm)}
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
                                        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                                                    onClick={handleAddVendor}
                                                    className="btn-primary px-8 py-3 rounded-xl shadow-lg shadow-primary/20 flex items-center gap-2"
                                                >
                                                    <Check className="w-5 h-5" />
                                                    Save New Vendor
                                                </button>
                                            </div>
                                        </div>
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
                                    <div className="grid grid-cols-1 gap-3">
                                        {vendors.map((vendor, index) => (
                                            <motion.div
                                                key={vendor.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                onClick={() => mode === 'select' && onSelectVendor && onSelectVendor(vendor)}
                                                className={`group p-4 rounded-[1.5rem] border border-border/50 bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-300 relative overflow-hidden ${mode === 'select' ? 'cursor-pointer' : ''}`}
                                            >
                                                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -mr-8 -mt-8 opacity-0 group-hover:opacity-100 transition-opacity" />

                                                <div className="flex items-center justify-between relative z-10">
                                                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                                        <div className="w-12 h-12 rounded-2xl bg-secondary/50 flex items-center justify-center text-foreground font-bold text-lg group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                            {vendor.company.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <h4 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                                                                {vendor.company}
                                                            </h4>
                                                            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                                                                <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {vendor.name}</span>
                                                                <span className="hidden sm:inline">•</span>
                                                                <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {vendor.phone}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="text-right pl-4">
                                                        <p className={`text-lg font-bold ${vendor.outstanding_balance > 0 ? 'text-warning-500' : 'text-success-500'}`}>
                                                            {formatCurrency(vendor.outstanding_balance)}
                                                        </p>
                                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                                                            Balance
                                                        </p>
                                                    </div>
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
