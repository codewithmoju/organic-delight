import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Plus, Search, Phone, Mail, ArrowRight, TrendingUp, CreditCard, Trash2, Users, Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Vendor } from '../../lib/types';
import { getVendors, searchVendors, deleteVendor } from '../../lib/api/vendors';
import { formatCurrency } from '../../lib/utils/notifications';
import VendorSkeleton from '../../components/vendors/VendorSkeleton';
import VendorListModal from '../../components/vendors/VendorListModal';
import { toast } from 'sonner';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState from '../../components/ui/EmptyState';

export default function Vendors() {
    const { t } = useTranslation();
    const [vendors, setVendors] = useState<Vendor[]>(() => {
        try {
            const cached = localStorage.getItem('vendors_cache');
            if (cached) {
                return JSON.parse(cached, (key, value) => {
                    if (['created_at', 'updated_at'].includes(key)) return new Date(value);
                    return value;
                });
            }
        } catch (e) {
            console.error('Failed to parse vendors cache', e);
        }
        return [];
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(() => !localStorage.getItem('vendors_cache'));
    const [isModalOpen, setIsModalOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const hasCache = vendors.length > 0;
        loadVendors(!hasCache);
    }, []);

    const loadVendors = async (showLoading = true) => {
        if (showLoading) setIsLoading(true);
        try {
            // Simulate delay for skeleton demo
            // await new Promise(resolve => setTimeout(resolve, 800));
            const data = await getVendors();
            setVendors(data);
            localStorage.setItem('vendors_cache', JSON.stringify(data));
        } catch (error: any) {
            console.error('Error loading vendors:', error);
            const msg = error.message?.includes('index')
                ? 'Database index required. Please check the browser console for the setup link.'
                : 'Failed to load vendors';
            toast.error(msg);
        } finally {
            if (showLoading) setIsLoading(false);
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

    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [vendorToDelete, setVendorToDelete] = useState<{ id: string, name: string } | null>(null);

    const handleDeleteClick = (id: string, name: string) => {
        setVendorToDelete({ id, name });
        setIsDeleteConfirmOpen(true);
    };

    const cancelDelete = () => {
        setIsDeleteConfirmOpen(false);
        setVendorToDelete(null);
    };

    const confirmDelete = async () => {
        if (!vendorToDelete) return;

        const { id } = vendorToDelete;
        setIsDeleting(true);

        try {
            await deleteVendor(id);
            toast.success('Vendor deleted successfully');
            await loadVendors();
            setIsDeleteConfirmOpen(false);
            setVendorToDelete(null);
        } catch (error: any) {
            console.error('Error deleting vendor:', error);
            toast.error(error.message || 'Failed to delete vendor');
        } finally {
            setIsDeleting(false);
        }
    };

    const totalOutstanding = vendors.reduce((sum, v) => sum + v.outstanding_balance, 0);

    return (
        <div className="space-y-6">
            <div className="app-page-header">
                <div>
                    <h1 className="app-page-title flex items-center gap-2">
                        <Users className="w-6 h-6 sm:w-7 sm:h-7 text-primary flex-shrink-0" />
                        {t('vendors.title')}
                    </h1>
                    <p className="app-page-subtitle">{t('vendors.subtitle')}</p>
                </div>

                <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setIsModalOpen(true)}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    {t('vendors.addVendor')}
                </motion.button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted/50 pointer-events-none" />
                        <input
                            type="text"
                            placeholder={t('vendors.searchPlaceholder')}
                            className="w-full h-11 pl-10 pr-4 rounded-xl bg-card border border-border/60 text-sm text-foreground placeholder:text-foreground-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                    </div>

                    {isLoading ? (
                        <VendorSkeleton />
                    ) : vendors.length === 0 ? (
                        <EmptyState
                            icon={Building2}
                            title={t('vendors.noVendors')}
                            description={t('vendors.addFirst', 'Add your first vendor to get started')}
                            action={{ label: t('vendors.addVendor'), onClick: () => setIsModalOpen(true) }}
                        />
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <AnimatePresence mode="popLayout">
                                {vendors.map((vendor, index) => (
                                    <motion.div
                                        key={vendor.id}
                                        initial={{ opacity: 0, y: 16 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: index * 0.04, duration: 0.3 }}
                                        className="card-theme p-4 sm:p-5 rounded-2xl sm:rounded-[2rem] border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300 group flex flex-col relative overflow-hidden"
                                    >
                                        {/* Glow */}
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />

                                        {/* Top row */}
                                        <div className="flex items-start justify-between mb-3 relative z-10">
                                            <div className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center text-foreground font-bold text-base group-hover:bg-primary/10 group-hover:text-primary transition-colors flex-shrink-0">
                                                {vendor.company.charAt(0)}
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-base sm:text-lg font-bold tabular-nums ${vendor.outstanding_balance > 0 ? 'text-warning-500' : 'text-success-500'}`}>
                                                    {formatCurrency(vendor.outstanding_balance)}
                                                </p>
                                                <p className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest">
                                                    {vendor.outstanding_balance < 0 ? t('vendors.credit') : t('vendors.balance')}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Name + contact */}
                                        <div className="flex-1 relative z-10 mb-3">
                                            <h3 className="text-sm sm:text-base font-bold text-foreground group-hover:text-primary transition-colors truncate leading-tight">
                                                {vendor.company}
                                            </h3>
                                            <p className="text-xs text-foreground-muted mt-0.5 truncate">{vendor.name}</p>
                                            <div className="mt-2 space-y-1">
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
                                        </div>

                                        {/* Footer — always visible actions */}
                                        <div className="flex items-center justify-between pt-3 border-t border-border/30 relative z-10">
                                            <div className="text-xs font-medium text-foreground-muted">
                                                {vendor.total_purchases > 0 ? (
                                                    <span className="flex items-center gap-1">
                                                        <Wallet className="w-3 h-3" />
                                                        {formatCurrency(vendor.total_purchases)}
                                                    </span>
                                                ) : (
                                                    <span className="opacity-50">{t('vendors.noPurchasesYet')}</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteClick(vendor.id, vendor.company); }}
                                                    className="h-8 w-8 rounded-xl bg-error-500/10 text-error-500 flex items-center justify-center hover:bg-error-500 hover:text-white transition-all"
                                                    title="Delete vendor"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/vendors/${vendor.id}/ledger`)}
                                                    className="h-8 px-3 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary hover:text-white transition-all flex items-center gap-1"
                                                >
                                                    {t('vendors.viewLedger')} <ArrowRight className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>

                {/* Right Sidebar — stacks below on mobile */}
                <div className="space-y-3 sm:space-y-4">
                    <div className="card-theme p-4 sm:p-5 rounded-2xl sm:rounded-[2rem] border border-border/50 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                        <h3 className="text-sm sm:text-base font-bold text-foreground mb-3 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-accent" />
                            {t('vendors.quickSummary')}
                        </h3>
                        <div className="space-y-2.5 relative z-10">
                            <div className={`p-3 sm:p-4 rounded-xl border ${totalOutstanding < 0 ? 'bg-success-500/8 border-success-500/20' : 'bg-warning-500/8 border-warning-500/20'}`}>
                                <p className="text-foreground-muted text-[10px] font-bold uppercase tracking-widest mb-1">{t('vendors.netOutstanding')}</p>
                                <p className={`text-xl sm:text-2xl font-bold tabular-nums ${totalOutstanding < 0 ? 'text-success-500' : 'text-warning-500'}`}>
                                    {formatCurrency(totalOutstanding)}
                                </p>
                            </div>
                            <div className="p-3 sm:p-4 rounded-xl bg-primary/5 border border-primary/10">
                                <p className="text-foreground-muted text-[10px] font-bold uppercase tracking-widest mb-1">{t('vendors.totalSuppliers')}</p>
                                <p className="text-xl sm:text-2xl font-bold text-primary tabular-nums">{vendors.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="card-theme p-4 sm:p-5 rounded-2xl sm:rounded-[2rem] border border-border/50">
                        <h3 className="text-sm sm:text-base font-bold text-foreground mb-3 flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-primary" />
                            {t('vendors.globalActions')}
                        </h3>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="w-full btn-secondary text-sm py-3 flex items-center justify-center gap-2 rounded-xl font-semibold"
                        >
                            <Plus className="w-4 h-4" />
                            {t('vendors.addNewVendor')}
                        </button>
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

            <ConfirmDialog
                isOpen={isDeleteConfirmOpen}
                title={t('vendors.deleteTitle', 'Delete Vendor')}
                message={t('vendors.deleteConfirm', 'Are you sure you want to delete this vendor? This action cannot be undone.')}
                confirmText={t('common.delete', 'Delete')}
                variant="danger"
                isLoading={isDeleting}
                onConfirm={confirmDelete}
                onCancel={cancelDelete}
            />
        </div>
    );
}
