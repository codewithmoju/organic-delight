import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { Vendor, POSSettings } from '../../lib/types';
import {
    getVendorById,
    getVendorLedger
} from '../../lib/api/vendors';
import { getPOSSettings } from '../../lib/api/pos';
import { getPurchases } from '../../lib/api/purchases';
import { formatCurrency } from '../../lib/utils/notifications';
import { exportToCSV } from '../../lib/utils/export';
import LedgerSkeleton from './LedgerSkeleton';
import RecordPaymentModal from './RecordPaymentModal';
import AnimatedCard from '../ui/AnimatedCard';
import VendorLedgerPDF from './VendorLedgerPDF';

interface LedgerEntry {
    id: string;
    date: Date;
    type: 'purchase' | 'payment';
    reference: string;
    description: string;
    amount: number;
    balance_change: number;
}

export default function VendorLedger() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [vendor, setVendor] = useState<Vendor | null>(null);
    const [ledger, setLedger] = useState<LedgerEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
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
        setIsLoading(true);
        try {
            // await new Promise(resolve => setTimeout(resolve, 800)); // Demo delay
            const [vendorData, payments, purchases] = await Promise.all([
                getVendorById(id),
                getVendorLedger(id),
                getPurchases(), // We'll filter these locally for now
                getPOSSettings()
            ]);

            if (!vendorData) {
                navigate('/vendors');
                return;
            }

            setVendor(vendorData);

            // Combine into a single ledger
            const entries: LedgerEntry[] = [];

            // Add purchases
            purchases.filter(p => p.vendor_id === id).forEach(p => {
                const itemNames = p.items.map(i => i.item_name).join(', ');
                const displayNames = itemNames.length > 30 ? itemNames.substring(0, 27) + '...' : itemNames;

                entries.push({
                    id: p.id,
                    date: p.purchase_date,
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
                    date: p.payment_date,
                    type: 'payment',
                    reference: p.reference_number || 'N/A',
                    description: `Payment via ${p.payment_method.replace('_', ' ')}`,
                    amount: p.amount,
                    balance_change: -p.amount // Payments decrease balance
                });
            });

            {/* Sort of Sort of entries.sort((a, b) => b.date.getTime() - a.date.getTime()); */ }
            setLedger(entries.sort((a, b) => b.date.getTime() - a.date.getTime()));
        } catch (error) {
            console.error('Error loading ledger:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Update settings in state when fetched
    useEffect(() => {
        const fetchSettings = async () => {
            const s = await getPOSSettings();
            setSettings(s);
        };
        fetchSettings();
    }, []);

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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/vendors')}
                        className="p-3 rounded-2xl bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground transition-all duration-300 group"
                    >
                        <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">{vendor.company}</h1>
                        <div className="flex items-center gap-2 text-muted-foreground mt-1">
                            <span className="flex items-center gap-1 text-sm font-medium bg-secondary/30 px-2 py-0.5 rounded-lg">
                                <Building2 className="w-3.5 h-3.5" />
                                {vendor.name}
                            </span>
                            <span className="text-muted-foreground/50">•</span>
                            <span className="text-sm">Vendor Ledger</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleExport}
                        className="btn-secondary flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-sm hover:bg-muted/50 transition-colors"
                        disabled={ledger.length === 0}
                        title="Export as CSV"
                    >
                        <Download className="w-4 h-4" /> CSV
                    </button>
                    <button
                        onClick={handlePrint}
                        className="btn-secondary flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-sm hover:bg-muted/50 transition-colors"
                        disabled={ledger.length === 0}
                        title="Export as PDF"
                    >
                        <Printer className="w-4 h-4" /> PDF
                    </button>
                    <button
                        onClick={() => setIsPaymentModalOpen(true)}
                        className="btn-primary flex items-center gap-2 px-5 py-2.5 rounded-xl shadow-lg shadow-primary/20"
                    >
                        <DollarSign className="w-4 h-4" /> Record Payment
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {stats.map((stat, i) => (
                    <AnimatedCard key={i} delay={i * 0.1}>
                        <div className="card-theme p-6 rounded-[2.5rem] border border-border/50 h-full relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                            <div className={`absolute top-0 right-0 w-32 h-32 opacity-10 rounded-full blur-3xl -mr-10 -mt-10 ${stat.bg.replace('/10', '')}`} />

                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                                <div className={`p-2 rounded-xl ${stat.bg} ${stat.color}`}>
                                    <stat.icon className="w-5 h-5" />
                                </div>
                            </div>

                            <div className="relative z-10">
                                <h3 className={`text-3xl font-bold tracking-tight ${stat.color} group-hover:scale-105 transition-transform duration-300 origin-left`}>
                                    {stat.value}
                                </h3>
                            </div>
                        </div>
                    </AnimatedCard>
                ))}
            </div>

            {/* Ledger Table */}
            <AnimatedCard delay={0.4}>
                <div className="card-theme p-0 rounded-[2.5rem] border border-border/50 overflow-hidden shadow-xl">
                    <div className="p-8 border-b border-border/30 bg-secondary/10 flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-bold text-foreground">Transaction History</h3>
                            <p className="text-sm text-muted-foreground mt-1">Detailed log of all purchases and payments</p>
                        </div>
                        <div className="bg-background/50 px-4 py-2 rounded-xl text-xs font-mono text-muted-foreground border border-border/30">
                            {ledger.length} ENTRIES
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-secondary/20">
                                    <th className="px-8 py-5 text-xs font-bold text-muted-foreground uppercase tracking-wider">Date</th>
                                    <th className="px-8 py-5 text-xs font-bold text-muted-foreground uppercase tracking-wider">Type</th>
                                    <th className="px-8 py-5 text-xs font-bold text-muted-foreground uppercase tracking-wider">Reference</th>
                                    <th className="px-8 py-5 text-xs font-bold text-muted-foreground uppercase tracking-wider">Description</th>
                                    <th className="px-8 py-5 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Amount</th>
                                    <th className="px-8 py-5 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Balance Impact</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/30">
                                {ledger.map((entry) => (
                                    <tr key={entry.id} className="hover:bg-secondary/30 transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-2 text-foreground font-medium">
                                                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                                                {entry.date.toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide inline-flex items-center gap-1.5 ${entry.type === 'purchase'
                                                ? 'bg-primary/10 text-primary border border-primary/20'
                                                : 'bg-success-500/10 text-success-500 border border-success-500/20'
                                                }`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${entry.type === 'purchase' ? 'bg-primary' : 'bg-success-500'}`} />
                                                {entry.type}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-muted-foreground font-mono text-xs">
                                            {entry.reference}
                                        </td>
                                        <td className="px-8 py-5 text-foreground text-sm max-w-xs truncate">
                                            {entry.description}
                                        </td>
                                        <td className="px-8 py-5 text-right font-bold text-foreground text-sm">
                                            {formatCurrency(entry.amount)}
                                        </td>
                                        <td className={`px-8 py-5 text-right font-bold text-sm ${entry.balance_change > 0 ? 'text-destructive' : 'text-success-500'
                                            }`}>
                                            <span className="bg-secondary/30 px-2 py-1 rounded-lg">
                                                {entry.balance_change > 0 ? '+' : ''}{formatCurrency(entry.balance_change)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {ledger.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-24 text-center">
                                            <div className="flex flex-col items-center justify-center opacity-50">
                                                <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                                                <p className="text-lg font-medium text-foreground">No transactions found</p>
                                                <p className="text-sm text-muted-foreground">This vendor has no recorded history yet.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </AnimatedCard>

            <RecordPaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                vendor={vendor}
                onSuccess={loadData}
            />

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
