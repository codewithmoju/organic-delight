import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Building2,
    Receipt,
    DollarSign,
    TrendingUp,
    FileText,
    Download
} from 'lucide-react';
import { Vendor } from '../../lib/types';
import {
    getVendorById,
    getVendorLedger
} from '../../lib/api/vendors';
import { getPurchases } from '../../lib/api/purchases';
import { formatCurrency } from '../../lib/utils/notifications';
import LoadingSpinner from '../ui/LoadingSpinner';
import RecordPaymentModal from './RecordPaymentModal';

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

    useEffect(() => {
        if (id) {
            loadData();
        }
    }, [id]);

    const loadData = async () => {
        if (!id) return;
        setIsLoading(true);
        try {
            const [vendorData, payments, purchases] = await Promise.all([
                getVendorById(id),
                getVendorLedger(id),
                getPurchases() // We'll filter these locally for now
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

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12 min-h-[60vh]">
                <LoadingSpinner size="lg" text="Loading ledger..." />
            </div>
        );
    }

    if (!vendor) return null;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/vendors')}
                        className="p-2 rounded-xl bg-dark-700/50 text-gray-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-white">{vendor.company}</h1>
                        <p className="text-gray-400 text-sm flex items-center gap-2">
                            <Building2 className="w-4 h-4" /> {vendor.name} • Vendor Ledger
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button className="btn-secondary flex items-center gap-2">
                        <Download className="w-4 h-4" /> Export
                    </button>
                    <button
                        onClick={() => setIsPaymentModalOpen(true)}
                        className="btn-primary flex items-center gap-2"
                    >
                        <DollarSign className="w-4 h-4" /> Record Payment
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="glass-card p-6">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-gray-400 uppercase tracking-wider">
                            {vendor.outstanding_balance < 0 ? 'Credit Balance' : 'Outstanding Balance'}
                        </p>
                        <TrendingUp className={`w-5 h-5 ${vendor.outstanding_balance < 0 ? 'text-success-400' : 'text-warning-400'}`} />
                    </div>
                    <p className={`text-3xl font-bold ${vendor.outstanding_balance < 0 ? 'text-success-400' : 'text-warning-400'}`}>
                        {formatCurrency(vendor.outstanding_balance)}
                    </p>
                </div>
                <div className="glass-card p-6">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-gray-400 uppercase tracking-wider">Total Purchases</p>
                        <Receipt className="w-5 h-5 text-primary-400" />
                    </div>
                    <p className="text-3xl font-bold text-primary-400">{formatCurrency(vendor.total_purchases)}</p>
                </div>
                <div className="glass-card p-6">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-gray-400 uppercase tracking-wider">Transactions</p>
                        <FileText className="w-5 h-5 text-accent-400" />
                    </div>
                    <p className="text-3xl font-bold text-white">{ledger.length}</p>
                </div>
            </div>

            {/* Ledger Table */}
            <div className="glass-card overflow-hidden">
                <div className="p-6 border-b border-dark-700/50">
                    <h3 className="text-lg font-semibold text-white">Transaction History</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-dark-900/50 text-gray-400 uppercase text-xs tracking-wider">
                                <th className="px-6 py-4 font-semibold">Date</th>
                                <th className="px-6 py-4 font-semibold">Type</th>
                                <th className="px-6 py-4 font-semibold">Reference</th>
                                <th className="px-6 py-4 font-semibold">Description</th>
                                <th className="px-6 py-4 font-semibold text-right">Amount</th>
                                <th className="px-6 py-4 font-semibold text-right">Balance Impact</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-700/30">
                            {ledger.map((entry) => (
                                <tr key={entry.id} className="hover:bg-dark-700/20 transition-colors">
                                    <td className="px-6 py-4 text-gray-300 text-sm">
                                        {entry.date.toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${entry.type === 'purchase'
                                            ? 'bg-primary-500/20 text-primary-400'
                                            : 'bg-success-500/20 text-success-400'
                                            }`}>
                                            {entry.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-400 font-mono text-sm">
                                        {entry.reference}
                                    </td>
                                    <td className="px-6 py-4 text-gray-300 text-sm">
                                        {entry.description}
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-white text-sm">
                                        {formatCurrency(entry.amount)}
                                    </td>
                                    <td className={`px-6 py-4 text-right font-bold text-sm ${entry.balance_change > 0 ? 'text-error-400' : 'text-success-400'
                                        }`}>
                                        {entry.balance_change > 0 ? '+' : ''}{formatCurrency(entry.balance_change)}
                                    </td>
                                </tr>
                            ))}
                            {ledger.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        No transactions found for this vendor
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <RecordPaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                vendor={vendor}
                onSuccess={loadData}
            />
        </div>
    );
}
