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
import AnimatedCard from '../../components/ui/AnimatedCard';

export default function Vendors() {
    const { t } = useTranslation();
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
            // Simulate delay for skeleton demo
            // await new Promise(resolve => setTimeout(resolve, 800));
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gradient flex items-center gap-3">
                        <Users className="w-8 h-8 text-primary" />
                        {t('vendors.title')}
                    </h1>
                    <p className="text-muted-foreground mt-1 text-lg">{t('vendors.subtitle')}</p>
                </div>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsModalOpen(true)}
                    className="btn-primary flex items-center gap-2 shadow-lg shadow-primary/20"
                >
                    <Plus className="w-5 h-5" />
                    {t('vendors.addVendor')}
                </motion.button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    {/* Search Bar */}
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
                        </div>
                        <input
                            type="text"
                            placeholder={t('vendors.searchPlaceholder')}
                            className="input-theme w-full pl-11 py-4 text-lg bg-card/50 backdrop-blur-sm border-border/50 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 rounded-2xl transition-all duration-300 shadow-sm"
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                    </div>

                    {isLoading ? (
                        <VendorSkeleton />
                    ) : vendors.length === 0 ? (
                        <div className="card-theme p-12 text-center rounded-[2.5rem] border border-border/50">
                            <div className="w-24 h-24 bg-secondary/30 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Building2 className="w-12 h-12 text-muted-foreground" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-2">{t('vendors.noVendors')}</h3>
                            <p className="text-muted-foreground">{t('vendors.addFirst')}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <AnimatePresence mode='popLayout'>
                                {vendors.map((vendor, index) => (
                                    <AnimatedCard key={vendor.id} delay={index * 0.05}>
                                        <div className="card-theme p-6 rounded-[2.5rem] border border-border/50 hover:border-primary/30 hover:shadow-xl transition-all duration-300 group h-full flex flex-col justify-between relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none transition-opacity group-hover:opacity-100 opacity-50" />

                                            <div>
                                                <div className="flex justify-between items-start mb-4 relative z-10">
                                                    <div className="p-3 rounded-2xl bg-secondary/50 text-foreground group-hover:bg-primary/20 group-hover:text-primary transition-colors duration-300">
                                                        <Building2 className="w-6 h-6" />
                                                    </div>
                                                    <div className="text-right">
                                                        <p className={`text-xl font-bold ${vendor.outstanding_balance > 0 ? 'text-warning-500' : 'text-success-500'}`}>
                                                            {formatCurrency(vendor.outstanding_balance)}
                                                        </p>
                                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                                                            {vendor.outstanding_balance < 0 ? t('vendors.credit') : t('vendors.balance')}
                                                        </p>
                                                    </div>
                                                </div>

                                                <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors mb-1 truncate">
                                                    {vendor.company}
                                                </h3>
                                                <p className="text-sm text-muted-foreground font-medium">{vendor.name}</p>

                                                <div className="mt-4 space-y-2">
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground/80 group-hover:text-muted-foreground transition-colors">
                                                        <Phone className="w-3.5 h-3.5" />
                                                        {vendor.phone}
                                                    </div>
                                                    {vendor.email && (
                                                        <div className="flex items-center gap-2 text-sm text-muted-foreground/80 group-hover:text-muted-foreground transition-colors truncate">
                                                            <Mail className="w-3.5 h-3.5" />
                                                            {vendor.email}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="mt-6 pt-4 border-t border-border/30 flex items-center justify-between relative z-10">
                                                <div className="text-xs font-medium text-muted-foreground">
                                                    {vendor.total_purchases > 0 ? (
                                                        <span className='flex items-center gap-1'>
                                                            <Wallet className='w-3 h-3' />
                                                            {formatCurrency(vendor.total_purchases)}
                                                        </span>
                                                    ) : (
                                                        <span className="opacity-50">{t('vendors.noPurchasesYet')}</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteClick(vendor.id, vendor.company);
                                                        }}
                                                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
                                                        title="Delete vendor"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => navigate(`/vendors/${vendor.id}/ledger`)}
                                                        className="px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary hover:text-white transition-all flex items-center gap-1"
                                                    >
                                                        {t('vendors.viewLedger')} <ArrowRight className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </AnimatedCard>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>

                {/* Right Sidebar Stats */}
                <div className="space-y-6">
                    <AnimatedCard delay={0.2}>
                        <div className="card-theme p-6 rounded-[2.5rem] border border-border/50 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-accent/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-accent" />
                                {t('vendors.quickSummary')}
                            </h3>
                            <div className="space-y-4 relative z-10">
                                <div className={`p-5 rounded-[1.5rem] border ${totalOutstanding < 0 ? 'bg-success-500/10 border-success-500/20' : 'bg-warning-500/10 border-warning-500/20'}`}>
                                    <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">{t('vendors.netOutstanding')}</p>
                                    <p className={`text-3xl font-bold mt-1 ${totalOutstanding < 0 ? 'text-success-500' : 'text-warning-500'}`}>
                                        {formatCurrency(totalOutstanding)}
                                    </p>
                                </div>
                                <div className="p-5 rounded-[1.5rem] bg-primary/5 border border-primary/10">
                                    <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">{t('vendors.totalSuppliers')}</p>
                                    <p className="text-3xl font-bold text-primary mt-1">{vendors.length}</p>
                                </div>
                            </div>
                        </div>
                    </AnimatedCard>

                    <AnimatedCard delay={0.3}>
                        <div className="card-theme p-6 rounded-[2.5rem] border border-border/50 relative overflow-hidden">
                            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-primary" />
                                {t('vendors.globalActions')}
                            </h3>
                            <div className="space-y-2 relative z-10">
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="w-full btn-secondary text-sm py-4 justify-center rounded-2xl font-bold"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    {t('vendors.addNewVendor')}
                                </button>
                            </div>
                        </div>
                    </AnimatedCard>
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
