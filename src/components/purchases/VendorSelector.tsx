import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Building2, X, Phone, Mail, MapPin, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { Vendor } from '../../lib/types';
import { getVendors, createVendor } from '../../lib/api/vendors';
import { useAuthStore } from '../../lib/store';
import LoadingSpinner from '../ui/LoadingSpinner';
import { useTranslation } from 'react-i18next';

interface VendorSelectorProps {
    onVendorSelected: (vendor: Vendor) => void;
    selectedVendor?: Vendor | null;
}

export default function VendorSelector({ onVendorSelected, selectedVendor }: VendorSelectorProps) {
    const { t } = useTranslation();
    const emptyVendorForm = {
        name: '',
        company: '',
        phone: '',
        email: '',
        address: '',
        gst_number: ''
    };
    const [searchQuery, setSearchQuery] = useState('');
    const [vendors, setVendors] = useState<Vendor[]>(() => {
        try {
            const cached = localStorage.getItem('vendors_cache');
            return cached ? JSON.parse(cached) : [];
        } catch { return []; }
    });
    const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);
    const [isLoading, setIsLoading] = useState(() => !localStorage.getItem('vendors_cache'));
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const user = useAuthStore(state => state.user);

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

    const handleCancelCreateForm = () => {
        if (hasUnsavedVendorInput()) {
            toast.info(t('vendors.messages.unsavedDiscarded', 'Unsaved vendor details were discarded'));
        }
        setShowCreateForm(false);
        setNewVendor(emptyVendorForm);
    };

    useEffect(() => {
        loadVendors();
    }, []);

    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredVendors(vendors);
        } else {
            const query = searchQuery.toLowerCase();
            const filtered = vendors.filter(v =>
                v.name.toLowerCase().includes(query) ||
                v.company.toLowerCase().includes(query) ||
                v.phone.includes(query)
            );
            setFilteredVendors(filtered);
        }
    }, [searchQuery, vendors]);

    const loadVendors = async () => {
        if (!vendors.length) setIsLoading(true);
        try {
            const data = await getVendors();
            setVendors(data);
            localStorage.setItem('vendors_cache', JSON.stringify(data));
            // Only update filtered if we are not searching
            if (!searchQuery.trim()) {
                setFilteredVendors(data);
            }
        } catch (error) {
            console.error('Error loading vendors:', error);
            // Only show error if no cache
            if (vendors.length === 0) toast.error(t('vendors.messages.loadFailed', 'Failed to load vendors'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateVendor = async (e: React.FormEvent) => {
        e.preventDefault();

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
            toast.error(t('vendors.messages.requiredFieldsSimple', 'Please fill in all required fields'));
            return;
        }

        setIsCreating(true);
        try {
            const vendor = await createVendor({
                ...payload,
                created_by: user?.uid || 'unknown'
            });

            toast.success(t('vendors.messages.createSuccess', '{{company}} created successfully', { company: vendor.company }));
            setVendors(prev => [vendor, ...prev]);
            onVendorSelected(vendor);
            setShowCreateForm(false);
            setNewVendor(emptyVendorForm);
        } catch (error: any) {
            toast.error(error.message || t('vendors.messages.createFailed', 'Failed to create vendor'));
        } finally {
            setIsCreating(false);
        }
    };

    if (selectedVendor) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="card-theme p-4 rounded-xl border border-primary/20 bg-primary/5"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-primary/10 text-primary">
                            <Building2 className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="font-bold text-lg text-foreground">{selectedVendor.company}</p>
                            <p className="text-sm text-muted-foreground">{selectedVendor.name} • {selectedVendor.phone}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => onVendorSelected(null as any)}
                        className="p-2 hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors"
                        title="Change Vendor"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </motion.div>
        );
    }

    return (
        <AnimatePresence mode="wait">
            {showCreateForm ? (
                <motion.div
                    key="create-form"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="card-theme p-6 rounded-2xl border border-border/50"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <Plus className="w-5 h-5 text-primary" />
                            Add New Vendor
                        </h3>
                        <button
                            onClick={handleCancelCreateForm}
                            className="p-2 hover:bg-secondary rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-muted-foreground" />
                        </button>
                    </div>

                    <form onSubmit={handleCreateVendor} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Company Name *</label>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        type="text"
                                        value={newVendor.company}
                                        onChange={(e) => setNewVendor(prev => ({ ...prev, company: e.target.value }))}
                                        className="w-full pl-10 pr-4 py-2.5 bg-secondary/30 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                        placeholder="e.g. Acme Corp"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Contact Person *</label>
                                <div className="relative">
                                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        type="text"
                                        value={newVendor.name}
                                        onChange={(e) => setNewVendor(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full pl-10 pr-4 py-2.5 bg-secondary/30 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                        placeholder="e.g. John Doe"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Phone Number *</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        type="tel"
                                        value={newVendor.phone}
                                        onChange={(e) => setNewVendor(prev => ({ ...prev, phone: e.target.value }))}
                                        className="w-full pl-10 pr-4 py-2.5 bg-secondary/30 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                        placeholder="+1 234 567 8900"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        type="email"
                                        value={newVendor.email}
                                        onChange={(e) => setNewVendor(prev => ({ ...prev, email: e.target.value }))}
                                        className="w-full pl-10 pr-4 py-2.5 bg-secondary/30 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                        placeholder="john@example.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-medium text-muted-foreground">Address</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                    <textarea
                                        value={newVendor.address}
                                        onChange={(e) => setNewVendor(prev => ({ ...prev, address: e.target.value }))}
                                        className="w-full pl-10 pr-4 py-2.5 bg-secondary/30 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                                        placeholder="Full business address..."
                                        rows={2}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-medium text-muted-foreground">GST / Tax ID</label>
                                <div className="relative">
                                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        type="text"
                                        value={newVendor.gst_number}
                                        onChange={(e) => setNewVendor(prev => ({ ...prev, gst_number: e.target.value }))}
                                        className="w-full pl-10 pr-4 py-2.5 bg-secondary/30 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                        placeholder="Tax Identification Number"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-border/50">
                            <button
                                type="button"
                                onClick={handleCancelCreateForm}
                                className="flex-1 py-3 px-4 rounded-xl border border-border hover:bg-secondary transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isCreating}
                                className="flex-1 py-3 px-4 bg-primary text-primary-foreground rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all font-bold flex items-center justify-center gap-2"
                            >
                                {isCreating ? (
                                    <>
                                        <LoadingSpinner size="sm" color="white" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Plus className="w-5 h-5" />
                                        Create Vendor
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </motion.div>
            ) : (
                <motion.div
                    key="vendor-list"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-6"
                >
                    <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted/50 pointer-events-none" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search vendors..."
                                className="w-full h-11 pl-10 pr-4 bg-card border border-border/60 rounded-xl text-sm text-foreground placeholder:text-foreground-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                            />
                        </div>
                        <button
                            onClick={() => setShowCreateForm(true)}
                            className="h-11 w-11 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex items-center justify-center flex-shrink-0"
                            title="Add New Vendor"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="min-h-[300px]">
                        {isLoading ? (
                            <div className="flex justify-center items-center h-64">
                                <LoadingSpinner size="lg" />
                            </div>
                        ) : filteredVendors.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {filteredVendors.map((vendor) => (
                                    <motion.button
                                        key={vendor.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        onClick={() => onVendorSelected(vendor)}
                                        className="text-left p-3 sm:p-4 rounded-2xl border border-border/50 bg-card hover:border-primary/50 hover:shadow-md transition-all group"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="w-9 h-9 rounded-xl bg-secondary/50 flex items-center justify-center text-foreground font-bold text-sm group-hover:bg-primary/10 group-hover:text-primary transition-colors flex-shrink-0">
                                                {vendor.company.charAt(0)}
                                            </div>
                                            {vendor.gst_number && (
                                                <div className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary uppercase tracking-wider">
                                                    GST
                                                </div>
                                            )}
                                        </div>
                                        <h3 className="font-bold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors truncate mb-0.5">{vendor.company}</h3>
                                        <p className="text-xs text-foreground-muted truncate mb-2">{vendor.name}</p>
                                        <div className="space-y-0.5">
                                            <div className="flex items-center gap-1.5 text-xs text-foreground-muted/70">
                                                <Phone className="w-3 h-3 flex-shrink-0" />
                                                <span className="truncate">{vendor.phone}</span>
                                            </div>
                                            {vendor.email && (
                                                <div className="flex items-center gap-1.5 text-xs text-foreground-muted/70">
                                                    <Mail className="w-3 h-3 flex-shrink-0" />
                                                    <span className="truncate">{vendor.email}</span>
                                                </div>
                                            )}
                                        </div>
                                    </motion.button>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-muted-foreground bg-card/30 rounded-[2rem] border border-border/30 border-dashed">
                                <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p className="text-lg font-medium">No vendors found</p>
                                <p className="text-sm mt-1">Try a different search or create a new vendor</p>
                                <button
                                    onClick={() => setShowCreateForm(true)}
                                    className="mt-4 text-primary font-bold hover:underline"
                                >
                                    Create new vendor
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
