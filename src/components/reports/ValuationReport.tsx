import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Package, BarChart3, Filter, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { calculateInventoryValuation, ItemValuation } from '../../lib/api/valuation';
import { formatCurrency } from '../../lib/utils/notifications';
import ValuationSkeleton from './ValuationSkeleton';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { readScopedJSON, writeScopedJSON } from '../../lib/utils/storageScope';

export default function ValuationReport() {
    const { t } = useTranslation();
    const [method, setMethod] = useState<'FIFO' | 'LIFO'>('FIFO');
    const [data, setData] = useState<{ items: ItemValuation[]; totalValue: number } | null>(() =>
        readScopedJSON<{ items: ItemValuation[]; totalValue: number } | null>(
            'valuation_cache',
            null,
            undefined,
            'valuation_cache'
        )
    );
    const [isLoading, setIsLoading] = useState(
        () =>
            readScopedJSON<{ items: ItemValuation[]; totalValue: number } | null>(
                'valuation_cache',
                null,
                undefined,
                'valuation_cache'
            ) == null
    );
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        const hasCache = !!data;
        loadValuation(!hasCache);
    }, [method]);

    const loadValuation = async (showLoading = true) => {
        if (showLoading) setIsLoading(true);
        else setIsRefreshing(true);
        try {
            const result = await calculateInventoryValuation(method);
            setData(result);
            writeScopedJSON('valuation_cache', result);
        } catch (error) {
            console.error('Valuation error:', error);
            toast.error('Failed to calculate valuation');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    if (isLoading) return <ValuationSkeleton />;

    const totalValue = data?.totalValue || 0;
    const itemCount = data?.items.length || 0;
    const avgValue = itemCount > 0 ? totalValue / itemCount : 0;

    const stats = [
        {
            label: t('valuation.totalAssetValue', 'Total Asset Value'),
            value: formatCurrency(totalValue),
            icon: DollarSign,
            colorClass: 'text-success-600 dark:text-success-400',
            bgClass: 'bg-success-500/10',
            sub: t('valuation.calculatedUsing', { method, defaultValue: `${method} method` }),
        },
        {
            label: t('valuation.stockedItems', 'Stocked Items'),
            value: itemCount,
            icon: Package,
            colorClass: 'text-primary',
            bgClass: 'bg-primary/10',
            sub: t('valuation.acrossCategories', 'Across all categories'),
        },
        {
            label: t('valuation.avgItemValue', 'Avg. Item Value'),
            value: formatCurrency(avgValue),
            icon: TrendingUp,
            colorClass: 'text-purple-600 dark:text-purple-400',
            bgClass: 'bg-purple-500/10',
            sub: t('valuation.perUniqueProduct', 'Per unique product'),
        },
    ];

    return (
        <div className="space-y-4 sm:space-y-6">

            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div>
                    <h1 className="app-page-title flex items-center gap-2">
                        <BarChart3 className="w-6 h-6 sm:w-7 sm:h-7 text-primary flex-shrink-0" />
                        {t('valuation.title', 'Warehouse Value')}
                    </h1>
                    <p className="app-page-subtitle">{t('valuation.subtitle', 'Real-time inventory asset valuation')}</p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Refresh */}
                    <button
                        onClick={() => loadValuation(false)}
                        disabled={isRefreshing}
                        className="h-10 w-10 rounded-xl bg-card border border-border/60 flex items-center justify-center text-foreground-muted hover:text-primary hover:border-primary/50 transition-all disabled:opacity-50"
                        title="Refresh"
                    >
                        <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </button>

                    {/* FIFO / LIFO toggle */}
                    <div className="relative flex bg-secondary/50 p-1 rounded-xl shadow-inner">
                        <motion.div
                            className="absolute top-1 bottom-1 bg-card rounded-lg shadow-sm z-0"
                            initial={false}
                            animate={{
                                x: method === 'FIFO' ? 4 : 'calc(100% + 4px)',
                                width: 'calc(50% - 8px)',
                            }}
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                        {(['FIFO', 'LIFO'] as const).map(m => (
                            <button
                                key={m}
                                onClick={() => setMethod(m)}
                                className={`relative z-10 px-4 sm:px-5 py-2 rounded-lg text-sm font-bold transition-colors w-16 sm:w-20 ${
                                    method === m ? 'text-foreground' : 'text-foreground-muted hover:text-foreground'
                                }`}
                            >
                                {m}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Stat cards — 1 col mobile, 3 col sm+ ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                {stats.map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08, duration: 0.4 }}
                        className="card-theme p-4 sm:p-5 rounded-2xl sm:rounded-[2rem] border border-border/50 relative overflow-hidden hover:shadow-lg transition-all duration-300 group"
                    >
                        {/* Glow */}
                        <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity ${stat.bgClass}`} />

                        <div className="relative z-10 flex items-center gap-4 sm:block">
                            {/* Icon */}
                            <div className={`p-2.5 rounded-xl ${stat.bgClass} flex-shrink-0 sm:mb-3`}>
                                <stat.icon className={`w-5 h-5 ${stat.colorClass}`} />
                            </div>

                            {/* Values */}
                            <div className="flex-1 min-w-0 sm:mt-0">
                                <p className="text-xs sm:text-sm font-medium text-foreground-muted truncate">{stat.label}</p>
                                <AnimatePresence mode="wait">
                                    <motion.p
                                        key={`${stat.value}-${method}`}
                                        initial={{ opacity: 0, y: 4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -4 }}
                                        transition={{ duration: 0.25 }}
                                        className={`text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight mt-0.5 ${stat.colorClass}`}
                                    >
                                        {stat.value}
                                    </motion.p>
                                </AnimatePresence>
                                <p className="text-xs text-foreground-muted/60 mt-1 hidden sm:block">{stat.sub}</p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* ── Detail table card ── */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="card-theme rounded-2xl sm:rounded-[2rem] border border-border/50 overflow-hidden shadow-sm"
            >
                {/* Card header */}
                <div className="px-4 sm:px-6 py-4 border-b border-border/30 bg-secondary/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                        <h3 className="text-base sm:text-lg font-bold text-foreground">
                            {t('valuation.breakdown', 'Product Breakdown')}
                        </h3>
                        <p className="text-xs text-foreground-muted mt-0.5">
                            {t('valuation.breakdownSub', 'Detailed valuation by product')}
                        </p>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-background/60 rounded-xl border border-border/40 text-xs font-semibold text-primary flex-shrink-0">
                        <Filter className="w-3.5 h-3.5" />
                        {t('valuation.activeBatches', 'Active batches')}
                    </div>
                </div>

                {/* ── Mobile card list (< sm) ── */}
                <div className="sm:hidden divide-y divide-border/30">
                    {data?.items.map((item, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: idx * 0.03 }}
                            className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-secondary/20 transition-colors"
                        >
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-foreground truncate">{item.item_name}</p>
                                <p className="text-xs text-foreground-muted mt-0.5">
                                    {item.batches.length} batch{item.batches.length !== 1 ? 'es' : ''}
                                </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                                <p className="text-sm font-bold text-success-600 dark:text-success-400">
                                    {formatCurrency(item.total_value)}
                                </p>
                                <p className="text-xs text-foreground-muted">
                                    {item.current_stock} units
                                </p>
                            </div>
                        </motion.div>
                    ))}

                    {(!data?.items || data.items.length === 0) && (
                        <div className="py-12 text-center text-foreground-muted text-sm">
                            No items to display
                        </div>
                    )}
                </div>

                {/* ── Desktop table (≥ sm) ── */}
                <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-secondary/20 border-b border-border/30">
                                <th className="px-5 lg:px-8 py-4 text-xs font-bold text-foreground-muted uppercase tracking-wider">
                                    {t('valuation.table.productName', 'Product')}
                                </th>
                                <th className="px-5 lg:px-8 py-4 text-xs font-bold text-foreground-muted uppercase tracking-wider text-center">
                                    {t('valuation.table.qty', 'Qty')}
                                </th>
                                <th className="px-5 lg:px-8 py-4 text-xs font-bold text-foreground-muted uppercase tracking-wider text-right">
                                    {t('valuation.table.valuation', 'Value')}
                                </th>
                                <th className="px-5 lg:px-8 py-4 text-xs font-bold text-foreground-muted uppercase tracking-wider text-right hidden lg:table-cell">
                                    {t('valuation.table.details', 'Batches')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/20">
                            {data?.items.map((item, idx) => (
                                <motion.tr
                                    key={idx}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: idx * 0.03 }}
                                    className="hover:bg-secondary/20 transition-colors group"
                                >
                                    <td className="px-5 lg:px-8 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-foreground group-hover:text-primary transition-colors text-sm">
                                                {item.item_name}
                                            </span>
                                            <span className="text-xs text-foreground-muted font-mono mt-0.5">
                                                #{String(idx + 1000)}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-5 lg:px-8 py-4 text-center">
                                        <span className="bg-secondary/50 px-2.5 py-1 rounded-lg font-bold text-foreground text-sm">
                                            {item.current_stock}
                                        </span>
                                    </td>
                                    <td className="px-5 lg:px-8 py-4 text-right">
                                        <span className="font-bold text-success-600 dark:text-success-400 text-sm">
                                            {formatCurrency(item.total_value)}
                                        </span>
                                    </td>
                                    <td className="px-5 lg:px-8 py-4 text-right hidden lg:table-cell">
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="text-[10px] font-semibold text-foreground-muted uppercase tracking-wide bg-secondary/40 px-1.5 py-0.5 rounded">
                                                {t('valuation.table.batchesCount', { count: item.batches.length, defaultValue: `${item.batches.length} batch${item.batches.length !== 1 ? 'es' : ''}` })}
                                            </span>
                                            <div className="flex gap-1">
                                                {item.batches.slice(0, 5).map((_, bIdx) => (
                                                    <motion.div
                                                        key={bIdx}
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        transition={{ delay: 0.04 * bIdx }}
                                                        className="w-2 h-2 rounded-full bg-primary/50"
                                                        title={`Batch ${bIdx + 1}`}
                                                    />
                                                ))}
                                                {item.batches.length > 5 && (
                                                    <div className="w-2 h-2 rounded-full bg-border" />
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>

                    {(!data?.items || data.items.length === 0) && (
                        <div className="py-16 text-center text-foreground-muted text-sm">
                            No items to display
                        </div>
                    )}
                </div>

                {/* Footer summary */}
                {data && data.items.length > 0 && (
                    <div className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4 border-t border-border/30 bg-secondary/10 flex items-center justify-between">
                        <span className="text-xs sm:text-sm text-foreground-muted font-medium">
                            {itemCount} product{itemCount !== 1 ? 's' : ''} · {method} method
                        </span>
                        <span className="text-sm sm:text-base font-bold text-success-600 dark:text-success-400">
                            {formatCurrency(totalValue)}
                        </span>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
