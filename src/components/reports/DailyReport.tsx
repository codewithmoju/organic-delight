import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Calendar,
    DollarSign,
    TrendingUp,
    TrendingDown,
    CreditCard,
    Wallet,
    ShoppingBag,
    RefreshCcw,
    ArrowUpRight,
    ArrowDownRight,
    Receipt,
    Users,
    Building2,
    Package
} from 'lucide-react';
import { DailyOperationsReport } from '../../lib/types';
import { generateDailyReport } from '../../lib/api/reports';
import { formatCurrency } from '../../lib/utils/notifications';
import LoadingSpinner from '../ui/LoadingSpinner';

export default function DailyReport() {
    const [report, setReport] = useState<DailyOperationsReport | null>(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadReport();
    }, [selectedDate]);

    const loadReport = async () => {
        setIsLoading(true);
        try {
            const data = await generateDailyReport(selectedDate);
            setReport(data);
        } catch (error) {
            console.error('Error loading daily report:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const StatCard = ({
        title,
        value,
        icon: Icon,
        color,
        subValue,
        trend
    }: {
        title: string;
        value: number;
        icon: any;
        color: string;
        subValue?: string;
        trend?: 'up' | 'down' | 'neutral';
    }) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-5 hover-lift"
        >
            <div className="flex items-center justify-between">
                <div className={`p-3 rounded-xl ${color}`}>
                    <Icon className="w-6 h-6" />
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 text-sm ${trend === 'up' ? 'text-success-400' : trend === 'down' ? 'text-error-400' : 'text-gray-400'
                        }`}>
                        {trend === 'up' && <ArrowUpRight className="w-4 h-4" />}
                        {trend === 'down' && <ArrowDownRight className="w-4 h-4" />}
                    </div>
                )}
            </div>
            <div className="mt-4">
                <h3 className="text-gray-400 text-sm">{title}</h3>
                <p className="text-2xl font-bold text-white mt-1">{formatCurrency(value)}</p>
                {subValue && <p className="text-xs text-gray-500 mt-1">{subValue}</p>}
            </div>
        </motion.div>
    );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <LoadingSpinner size="lg" text="Generating daily report..." />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gradient">Daily Operations Report</h1>
                    <p className="text-gray-400 mt-1">{formatDate(selectedDate)}</p>
                </div>

                <div className="flex items-center gap-3">
                    <input
                        type="date"
                        value={selectedDate.toISOString().split('T')[0]}
                        onChange={(e) => setSelectedDate(new Date(e.target.value))}
                        className="input-dark"
                    />
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={loadReport}
                        className="btn-secondary p-2"
                    >
                        <RefreshCcw className="w-5 h-5" />
                    </motion.button>
                </div>
            </div>

            {report && (
                <>
                    {/* Summary Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard
                            title="Total Sales"
                            value={report.total_sales}
                            icon={DollarSign}
                            color="bg-success-500/20 text-success-400"
                            subValue={`${report.transactions_count} transactions`}
                            trend="up"
                        />
                        <StatCard
                            title="Cash Sales"
                            value={report.cash_sales}
                            icon={Wallet}
                            color="bg-primary-500/20 text-primary-400"
                        />
                        <StatCard
                            title="Credit Sales (Udhaar)"
                            value={report.credit_sales}
                            icon={CreditCard}
                            color="bg-warning-500/20 text-warning-400"
                        />
                        <StatCard
                            title="Card/Digital Sales"
                            value={report.card_sales + report.digital_sales}
                            icon={ShoppingBag}
                            color="bg-accent-500/20 text-accent-400"
                        />
                    </div>

                    {/* Financial Summary */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Income & Expenses */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass-card p-6"
                        >
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-success-400" />
                                Income & Expenses
                            </h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-3 border-b border-dark-700/50">
                                    <span className="text-gray-400">Total Sales</span>
                                    <span className="text-success-400 font-semibold">+{formatCurrency(report.total_sales)}</span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-dark-700/50">
                                    <span className="text-gray-400">Customer Collections</span>
                                    <span className="text-success-400 font-semibold">+{formatCurrency(report.customer_collections)}</span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-dark-700/50">
                                    <span className="text-gray-400">Total Expenses</span>
                                    <span className="text-error-400 font-semibold">-{formatCurrency(report.total_expenses)}</span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-dark-700/50">
                                    <span className="text-gray-400">Vendor Payments</span>
                                    <span className="text-error-400 font-semibold">-{formatCurrency(report.vendor_payments)}</span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-dark-700/50">
                                    <span className="text-gray-400">Total Returns</span>
                                    <span className="text-error-400 font-semibold">-{formatCurrency(report.total_returns)}</span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-dark-700/50">
                                    <span className="text-gray-400">Total Discounts</span>
                                    <span className="text-warning-400 font-semibold">-{formatCurrency(report.total_discounts)}</span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Profit Summary */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="glass-card p-6"
                        >
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <TrendingDown className="w-5 h-5 text-primary-400" />
                                Profit & Cash Summary
                            </h3>
                            <div className="space-y-4">
                                <div className="p-4 rounded-xl bg-success-500/10 border border-success-500/30">
                                    <p className="text-gray-400 text-sm">Gross Profit</p>
                                    <p className="text-3xl font-bold text-success-400">{formatCurrency(report.gross_profit)}</p>
                                </div>
                                <div className="p-4 rounded-xl bg-primary-500/10 border border-primary-500/30">
                                    <p className="text-gray-400 text-sm">Net Profit</p>
                                    <p className="text-3xl font-bold text-primary-400">{formatCurrency(report.net_profit)}</p>
                                </div>
                                <div className="p-4 rounded-xl bg-accent-500/10 border border-accent-500/30">
                                    <p className="text-gray-400 text-sm">Cash on Hand</p>
                                    <p className="text-3xl font-bold text-accent-400">{formatCurrency(report.cash_on_hand)}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        = Cash Sales + Collections - Cash Expenses - Vendor Payments - Returns
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="glass-card p-4 text-center"
                        >
                            <Receipt className="w-8 h-8 text-primary-400 mx-auto" />
                            <p className="text-2xl font-bold text-white mt-2">{report.transactions_count}</p>
                            <p className="text-gray-400 text-sm">Transactions</p>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 }}
                            className="glass-card p-4 text-center"
                        >
                            <RefreshCcw className="w-8 h-8 text-warning-400 mx-auto" />
                            <p className="text-2xl font-bold text-white mt-2">{report.returns_count}</p>
                            <p className="text-gray-400 text-sm">Returns</p>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                            className="glass-card p-4 text-center"
                        >
                            <Package className="w-8 h-8 text-accent-400 mx-auto" />
                            <p className="text-2xl font-bold text-white mt-2">{formatCurrency(report.total_purchases)}</p>
                            <p className="text-gray-400 text-sm">Purchases</p>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 }}
                            className="glass-card p-4 text-center"
                        >
                            <DollarSign className="w-8 h-8 text-success-400 mx-auto" />
                            <p className="text-2xl font-bold text-white mt-2">{formatCurrency(report.average_transaction_value)}</p>
                            <p className="text-gray-400 text-sm">Avg. Transaction</p>
                        </motion.div>
                    </div>
                </>
            )}
        </div>
    );
}
