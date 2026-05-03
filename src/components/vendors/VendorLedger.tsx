import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Building2,
    Receipt,
    DollarSign,
    TrendingUp,
    FileText,
    Download,
    Calendar,
    Printer
} from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { toast } from 'sonner';
import { Vendor, POSSettings } from '../../lib/types';
import {
    getVendorById,
    getVendorLedger
} from '../../lib/api/vendors';
import { getPOSSettings } from '../../lib/api/pos';
import { getPurchasesByVendor } from '../../lib/api/purchases';
import { formatCurrency } from '../../lib/utils/notifications';
import { exportToCSV } from '../../lib/utils/export';
import LedgerSkeleton from './LedgerSkeleton';
import RecordPaymentModal from './RecordPaymentModal';
import VendorLedgerPDF from './VendorLedgerPDF';
import EmptyState from '../ui/EmptyState';
import VendorPerformance from './VendorPerformance';
import VendorPaymentSchedule from './VendorPaymentSchedule';
import { usePagination } from '../../lib/hooks/usePagination';
import PaginationControls from '../ui/PaginationControls';
import { readScopedJSON, writeScopedJSON } from '../../lib/utils/storageScope';

interface LedgerEntry {
    id: string;
    date: Date;
    type: 'purchase' | 'payment';
    reference: string;
    description: string;
    amount: number;
    balance_change: number;
}

function parseDateValue(d: any): Date {
    if (!d) return new Date();
    if (d instanceof Date) return d;
    if (typeof d?.toDate === 'function') return d.toDate();
    return new Date(d);
}

export default function VendorLedger() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const cacheKey = id ? `vendor_ledger_cache_${id}` : '';
    const cached = id ? readScopedJSON<any>(cacheKey, null, undefined, cacheKey) : null;
    const [vendor, setVendor] = useState<Vendor | null>(cached?.vendor ?? null);
    const [ledger, setLedger] = useState<LedgerEntry[]>(
        (cached?.ledger ?? []).map((entry: LedgerEntry) => ({ ...entry, date: parseDateValue(entry.date) }))
    );
    const [vendorPurchases, setVendorPurchases] = useState<any[]>(cached?.vendorPurchases ?? []);
    const [isLoading, setIsLoading] = useState(() => !cached);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [settings, setSettings] = useState<POSSettings | null>(null);
    const componentRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: vendor ? `${vendor.company}_Ledger` : 'Vendor_Ledger',
    });

    // Calculate totals from ledger for display accuracy (fixes inconsistency with stale vendor data)
    const calculatedTotalPurchases = ledger
        .filter(entry => entry.type === 'purchase')
        .reduce((sum, entry) => sum + entry.amount, 0);

    const calculatedOutstandingBalance = ledger
        .reduce((sum, entry) => sum + entry.balance_change, 0);

    const displayVendor = vendor ? {
        ...vendor,
        total_purchases: calculatedTotalPurchases,
        outstanding_balance: calculatedOutstandingBalance
    } : null;

    useEffect(() => {
        if (id) {
            loadData();
        }
    }, [id]);

    // Auto-fix vendor balance if out of sync
    useEffect(() => {
        if (!vendor || isLoading) return;

        const mismatch = Math.abs((vendor.outstanding_balance || 0) - calculatedOutstandingBalance);
        if (mismatch > 1) {
            console.warn(`Fixing vendor balance mismatch. Stored: ${vendor.outstanding_balance}, Calc: ${calculatedOutstandingBalance}`);
            // Dynamically import to avoid circular dependencies if any
            import('../../lib/api/vendors').then(({ updateVendor }) => {
                updateVendor(vendor.id, {
                    outstanding_balance: calculatedOutstandingBalance,
                    total_purchases: calculatedTotalPurchases
                }).then(() => {
                    // Update local state to reflect fix without reload
                    setVendor(prev => prev ? {
                        ...prev,
                        outstanding_balance: calculatedOutstandingBalance,
                        total_purchases: calculatedTotalPurchases
                    } : null);
                    // toast.success('Vendor balance synchronized'); 
                }).catch(err => console.error('Failed to sync vendor balance', err));
            });
        }
    }, [vendor, calculatedOutstandingBalance, calculatedTotalPurchases, isLoading]);

    const loadData = async () => {
        if (!id) return;
        const hasWarmCache = !!cached;
        if (!hasWarmCache) setIsLoading(true);
        try {
            const [vendorData, payments, purchases, posSettings] = await Promise.all([
                getVendorById(id),
                getVendorLedger(id),
                getPurchasesByVendor(id),
                getPOSSettings()
            ]);

            if (!vendorData) {
                navigate('/vendors');
                return;
            }

            setVendor(vendorData);
            setSettings(posSettings);
            setVendorPurchases(purchases);

            // Combine into a single ledger
            const entries: LedgerEntry[] = [];

            // Add purchases
            purchases.forEach(p => {
                const itemNames = p.items.map(i => i.item_name).join(', ');
                const displayNames = itemNames.length > 30 ? itemNames.substring(0, 27) + '...' : itemNames;

                entries.push({
                    id: p.id,
                    date: parseDateValue(p.purchase_date),
                    type: 'purchase',
                    reference: p.purchase_number,
                    description: `Stock: ${displayNames} (${p.items.length} items)`,
                    amount: p.total_amount,
                    balance_change: p.total_amount // Purchases increase balance (what we owe)
                });
            });

            // Add payments
            payments.forEach(p => {
                entries.push({
                    id: p.id,
                    date: parseDateValue(p.payment_date),
                    type: 'payment',
                    reference: p.reference_number || 'N/A',
                    description: `Payment via ${p.payment_method.replace('_', ' ')}`,
                    amount: p.amount,
                    balance_change: -p.amount // Payments decrease balance
                });
            });

            const sortedEntries = entries.sort((a, b) => b.date.getTime() - a.date.getTime());
            setLedger(sortedEntries);
            writeScopedJSON(cacheKey, {
                vendor: vendorData,
                vendorPurchases: purchases,
                ledger: sortedEntries,
            });
        } catch (error) {
            console.error('Error loading ledger:', error);
            toast.error('Failed to load complete vendor ledger data');
        } finally {
            if (!hasWarmCache) setIsLoading(false);
        }
    };

    const handleExport = () => {
        if (!vendor || ledger.length === 0) return;

        const exportData = ledger.map(entry => ({
            Date: entry.date.toLocaleDateString(),
            Type: entry.type,
            Reference: entry.reference,
            Description: entry.description,
            Amount: entry.amount,
            'Balance Impact': entry.balance_change
        }));

        const filename = `${vendor.company.replace(/\s+/g, '_')}_Ledger_${new Date().toISOString().split('T')[0]}.csv`;
        exportToCSV(exportData, filename);
    };

    const pagination = usePagination({ data: ledger, defaultItemsPerPage: 25 });

    if (isLoading) return <LedgerSkeleton />;
    if (!vendor) return null;

    const stats = [
        {
            label: (displayVendor?.outstanding_balance || 0) < 0 ? 'Credit Balance' : 'Outstanding Balance',
            value: formatCurrency(displayVendor?.outstanding_balance || 0),
            icon: TrendingUp,
            color: (displayVendor?.outstanding_balance || 0) < 0 ? 'text-success-500' : 'text-warning-500',
            bg: (displayVendor?.outstanding_balance || 0) < 0 ? 'bg-success-500/10' : 'bg-warning-500/10'
        },
        {
            label: 'Total Purchases',
            value: formatCurrency(displayVendor?.total_purchases || 0),
            icon: Receipt,
            color: 'text-primary-500',
            bg: 'bg-primary-500/10'
        },
        {
            label: 'Total Transactions',
            value: ledger.length,
            icon: FileText,
            color: 'text-accent-500',
            bg: 'bg-accent-500/10'
        }
    ];

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/vendors')}
                        className="p-2.5 rounded-xl bg-secondary/50 text-foreground-muted hover:bg-secondary hover:text-foreground transition-all group flex-shrink-0"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                    </button>
                    <div className="min-w-0">
                        <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">{vendor.company}</h1>
                        <div className="flex items-center gap-2 text-foreground-muted mt-0.5 flex-wrap">
                            <span className="flex items-center gap-1 text-xs font-medium bg-secondary/40 px-2 py-0.5 rounded-lg">
                                <Building2 className="w-3 h-3" />
                                {vendor.name}
                            </span>
                            <span className="text-xs text-foreground-muted/50">Vendor Ledger</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={handleExport}
                        disabled={ledger.length === 0}
                        className="btn-secondary flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm disabled:opacity-50"
                    >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">CSV</span>
                    </button>
                    <button
                        onClick={handlePrint}
                        disabled={ledger.length === 0}
                        className="btn-secondary flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm disabled:opacity-50"
                    >
                        <Printer className="w-4 h-4" />
                        <span className="hidden sm:inline">PDF</span>
                    </button>
                    <button
                        onClick={() => setIsPaymentModalOpen(true)}
                        className="btn-primary flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm"
                    >
                        <DollarSign className="w-4 h-4" />
                        <span>Record Payment</span>
                    </button>
                </div>
            </div>

            {/* ── Stats — 1 col mobile, 3 col sm+ ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                {stats.map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="card-theme p-4 sm:p-5 rounded-2xl sm:rounded-[2rem] border border-border/50 relative overflow-hidden group hover:shadow-md transition-all duration-300"
                    >
                        <div className={`absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl opacity-15 ${stat.bg}`} />

                        {/* Mobile: horizontal layout */}
                        <div className="flex items-center gap-3 sm:block relative z-10">
                            <div className={`p-2.5 rounded-xl ${stat.bg} flex-shrink-0 sm:mb-3`}>
                                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-foreground-muted uppercase tracking-wide truncate">{stat.label}</p>
                                <h3 className={`text-lg sm:text-2xl font-bold tracking-tight mt-0.5 ${stat.color} tabular-nums`}>
                                    {stat.value}
                                </h3>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* ── Ledger card ── */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="card-theme rounded-2xl sm:rounded-[2rem] border border-border/50 overflow-hidden shadow-sm"
            >
                {/* Card header */}
                <div className="px-4 sm:px-6 py-4 border-b border-border/30 bg-secondary/10 flex items-center justify-between gap-3">
                    <div>
                        <h3 className="text-base sm:text-lg font-bold text-foreground">Transaction History</h3>
                        <p className="text-xs text-foreground-muted mt-0.5">All purchases and payments</p>
                    </div>
                    <div className="bg-background/60 px-3 py-1.5 rounded-xl text-xs font-mono text-foreground-muted border border-border/40 flex-shrink-0">
                        {ledger.length} entries
                    </div>
                </div>

                {ledger.length === 0 ? (
                    <div className="py-16 px-4">
                        <EmptyState
                            icon={FileText}
                            title="No transactions yet"
                            description="This vendor has no recorded history."
                        />
                    </div>
                ) : (
                    <>
                        {/* ── Mobile card list (< sm) ── */}
                        <div className="sm:hidden divide-y divide-border/30">
                            {pagination.paginatedData.map((entry) => (
                                <div key={entry.id} className="flex items-start gap-3 px-4 py-3 hover:bg-secondary/20 transition-colors">
                                    {/* Type icon */}
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                        entry.type === 'purchase'
                                            ? 'bg-primary/10 text-primary'
                                            : 'bg-success-500/10 text-success-500'
                                    }`}>
                                        {entry.type === 'purchase'
                                            ? <Receipt className="w-4 h-4" />
                                            : <DollarSign className="w-4 h-4" />
                                        }
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md ${
                                                entry.type === 'purchase'
                                                    ? 'bg-primary/10 text-primary'
                                                    : 'bg-success-500/10 text-success-500'
                                            }`}>
                                                {entry.type}
                                            </span>
                                            <span className="text-xs text-foreground-muted">{entry.date.toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-sm text-foreground mt-1 truncate">{entry.description}</p>
                                        <p className="text-xs font-mono text-foreground-muted/60 mt-0.5">{entry.reference}</p>
                                    </div>

                                    <div className="text-right flex-shrink-0">
                                        <p className="text-sm font-bold text-foreground tabular-nums">{formatCurrency(entry.amount)}</p>
                                        <p className={`text-xs font-semibold tabular-nums mt-0.5 ${entry.balance_change > 0 ? 'text-error-500' : 'text-success-500'}`}>
                                            {entry.balance_change > 0 ? '+' : ''}{formatCurrency(entry.balance_change)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* ── Desktop table (≥ sm) ── */}
                        <div className="hidden sm:block overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-secondary/20 border-b border-border/30">
                                        <th className="px-5 lg:px-6 py-3.5 text-xs font-bold text-foreground-muted uppercase tracking-wider">Date</th>
                                        <th className="px-5 lg:px-6 py-3.5 text-xs font-bold text-foreground-muted uppercase tracking-wider">Type</th>
                                        <th className="px-5 lg:px-6 py-3.5 text-xs font-bold text-foreground-muted uppercase tracking-wider hidden lg:table-cell">Reference</th>
                                        <th className="px-5 lg:px-6 py-3.5 text-xs font-bold text-foreground-muted uppercase tracking-wider">Description</th>
                                        <th className="px-5 lg:px-6 py-3.5 text-xs font-bold text-foreground-muted uppercase tracking-wider text-right">Amount</th>
                                        <th className="px-5 lg:px-6 py-3.5 text-xs font-bold text-foreground-muted uppercase tracking-wider text-right">Impact</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/20">
                                    {pagination.paginatedData.map((entry) => (
                                        <tr key={entry.id} className="hover:bg-secondary/20 transition-colors">
                                            <td className="px-5 lg:px-6 py-3.5">
                                                <div className="flex items-center gap-1.5 text-foreground-muted text-sm whitespace-nowrap">
                                                    <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                                                    {entry.date.toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-5 lg:px-6 py-3.5">
                                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide inline-flex items-center gap-1 ${
                                                    entry.type === 'purchase'
                                                        ? 'bg-primary/10 text-primary border border-primary/20'
                                                        : 'bg-success-500/10 text-success-500 border border-success-500/20'
                                                }`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${entry.type === 'purchase' ? 'bg-primary' : 'bg-success-500'}`} />
                                                    {entry.type}
                                                </span>
                                            </td>
                                            <td className="px-5 lg:px-6 py-3.5 text-foreground-muted font-mono text-xs hidden lg:table-cell">
                                                {entry.reference}
                                            </td>
                                            <td className="px-5 lg:px-6 py-3.5 text-foreground text-sm max-w-[200px] truncate">
                                                {entry.description}
                                            </td>
                                            <td className="px-5 lg:px-6 py-3.5 text-right font-bold text-foreground text-sm tabular-nums whitespace-nowrap">
                                                {formatCurrency(entry.amount)}
                                            </td>
                                            <td className={`px-5 lg:px-6 py-3.5 text-right font-bold text-sm tabular-nums whitespace-nowrap ${
                                                entry.balance_change > 0 ? 'text-error-500' : 'text-success-500'
                                            }`}>
                                                <span className="bg-secondary/30 px-2 py-0.5 rounded-lg">
                                                    {entry.balance_change > 0 ? '+' : ''}{formatCurrency(entry.balance_change)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {/* Footer summary */}
                {ledger.length > 0 && (
                    <div className="px-4 sm:px-6 py-3 border-t border-border/30 bg-secondary/10 flex items-center justify-between gap-3">
                        <span className="text-xs text-foreground-muted">
                            {ledger.length} transaction{ledger.length !== 1 ? 's' : ''}
                        </span>
                        <div className="flex items-center gap-4 text-sm">
                            <span className="text-foreground-muted text-xs">Outstanding:</span>
                            <span className={`font-bold tabular-nums ${(displayVendor?.outstanding_balance || 0) > 0 ? 'text-warning-500' : 'text-success-500'}`}>
                                {formatCurrency(displayVendor?.outstanding_balance || 0)}
                            </span>
                        </div>
                    </div>
                )}
                {ledger.length > 0 && (
                    <div className="px-4 sm:px-6 py-3 border-t border-border/20 bg-background/20">
                        <PaginationControls
                            currentPage={pagination.currentPage}
                            totalPages={pagination.totalPages}
                            onPageChange={pagination.goToPage}
                            hasNextPage={pagination.hasNextPage}
                            hasPrevPage={pagination.hasPrevPage}
                            startIndex={pagination.startIndex}
                            endIndex={pagination.endIndex}
                            totalItems={pagination.totalItems}
                        />
                    </div>
                )}
            </motion.div>

            <RecordPaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                vendor={displayVendor || vendor}
                onSuccess={loadData}
            />

            {/* Vendor Performance & Payment Schedule */}
            {vendor && !isLoading && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                    <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm">
                        <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-primary" />
                            Vendor Performance
                        </h3>
                        <VendorPerformance
                            vendorId={vendor.id}
                            vendorName={vendor.company}
                            purchases={vendorPurchases}
                        />
                    </div>
                    <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm">
                        <VendorPaymentSchedule
                            vendorId={vendor.id}
                            outstandingBalance={displayVendor?.outstanding_balance ?? 0}
                        />
                    </div>
                </div>
            )}

            <div className="hidden">
                {displayVendor && settings && (
                    <VendorLedgerPDF
                        ref={componentRef}
                        vendor={displayVendor}
                        ledger={ledger}
                        settings={settings}
                    />
                )}
            </div>
        </div>
    );
}
