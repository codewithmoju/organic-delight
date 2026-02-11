import { useState, useEffect } from 'react';
import { DollarSign, Filter, TrendingUp, Package, BarChart3, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { calculateInventoryValuation, ItemValuation } from '../../lib/api/valuation';
import { formatCurrency } from '../../lib/utils/notifications';
import ValuationSkeleton from './ValuationSkeleton';
import AnimatedCard from '../ui/AnimatedCard';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export default function ValuationReport() {
    const [method, setMethod] = useState<'FIFO' | 'LIFO'>('FIFO');
    const [data, setData] = useState<{ items: ItemValuation[], totalValue: number } | null>(() => {
        try {
            const cached = localStorage.getItem('valuation_cache');
            return cached ? JSON.parse(cached) : null;
        } catch { return null; }
    });
    const [isLoading, setIsLoading] = useState(() => !localStorage.getItem('valuation_cache'));
    const { t } = useTranslation();

    useEffect(() => {
        const hasCache = !!data;
        loadValuation(!hasCache);
    }, [method]);

    const loadValuation = async (showLoading = true) => {
        if (showLoading) setIsLoading(true);
        try {
            // Simulate delay for skeleton demo
            // await new Promise(resolve => setTimeout(resolve, 800)); 
            const result = await calculateInventoryValuation(method);
            setData(result);
            localStorage.setItem('valuation_cache', JSON.stringify(result));
        } catch (error) {
            console.error('Valuation error:', error);
            toast.error('Failed to calculate valuation');
        } finally {
            if (showLoading) setIsLoading(false);
        }
    };

    if (isLoading) return <ValuationSkeleton />;

    const stats = [
        {
            label: t('valuation.totalAssetValue'),
            value: formatCurrency(data?.totalValue || 0),
            icon: DollarSign,
            color: 'text-success-500',
            bg: 'bg-success-500/10',
            subtext: t('valuation.calculatedUsing', { method })
        },
        {
            label: t('valuation.stockedItems'),
            value: data?.items.length || 0,
            icon: Package,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
            subtext: t('valuation.acrossCategories')
        },
        {
            label: t('valuation.avgItemValue'),
            value: formatCurrency((data?.totalValue || 0) / (data?.items.length || 1)),
            icon: TrendingUp,
            color: 'text-purple-500',
            bg: 'bg-purple-500/10',
            subtext: t('valuation.perUniqueProduct')
        }
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-gradient flex items-center gap-3">
                        <BarChart3 className="w-8 h-8 text-primary" />
                        {t('valuation.title')}
                    </h1>
                    <p className="text-muted-foreground mt-1 text-lg">{t('valuation.subtitle')}</p>
                </div>

                {/* Custom Toggle */}
                <div className="bg-secondary/50 p-1 rounded-2xl inline-flex relative shadow-inner">
                    {/* Active Background Pill */}
                    <motion.div
                        className="absolute top-1 bottom-1 bg-white dark:bg-dark-700 rounded-xl shadow-sm z-0"
                        initial={false}
                        animate={{
                            x: method === 'FIFO' ? 4 : '100%',
                            width: 'calc(50% - 8px)'
                        }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />

                    {(['FIFO', 'LIFO'] as const).map((m) => (
                        <button
                            key={m}
                            onClick={() => setMethod(m)}
                            className={`relative z-10 px-6 py-2 rounded-xl text-sm font-bold transition-colors w-24 ${method === m ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            {m}
                        </button>
                    ))}
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, index) => (
                    <AnimatedCard key={index} delay={index * 0.1}>
                        <div className="card-theme p-6 rounded-[2.5rem] border border-border/50 h-full relative overflow-hidden hover:shadow-lg transition-all duration-300 group">
                            <div className={`absolute top-0 right-0 w-32 h-32 opacity-10 rounded-full blur-3xl -mr-10 -mt-10 ${stat.bg.replace('/10', '')}`} />

                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div className={`p-3 rounded-2xl ${stat.bg}`}>
                                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                                </div>
                                <div className="bg-secondary/30 px-2 py-1 rounded-lg">
                                    <Info className="w-4 h-4 text-muted-foreground" />
                                </div>
                            </div>

                            <div className="relative z-10">
                                <p className="text-muted-foreground font-medium text-sm mb-1">{stat.label}</p>
                                <h3 className={`text-3xl font-bold tracking-tight ${stat.color} group-hover:scale-105 transition-transform duration-300 origin-left`}>
                                    {stat.value}
                                </h3>
                                <div className="flex items-center gap-2 mt-4 text-xs font-medium text-muted-foreground/80 bg-secondary/30 self-start inline-flex px-2 py-1 rounded-lg">
                                    <div className={`w-1.5 h-1.5 rounded-full ${stat.color.replace('text-', 'bg-')}`} />
                                    {stat.subtext}
                                </div>
                            </div>
                        </div>
                    </AnimatedCard>
                ))}
            </div>

            {/* Detail Table Card */}
            <AnimatedCard delay={0.4}>
                <div className="card-theme p-0 rounded-[2.5rem] border border-border/50 overflow-hidden shadow-xl">
                    <div className="p-8 border-b border-border/30 bg-secondary/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h3 className="text-xl font-bold text-foreground">{t('valuation.breakdown')}</h3>
                            <p className="text-muted-foreground text-sm mt-1">Detailed valuation by product</p>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-background/50 rounded-xl border border-border/30 text-xs font-semibold text-primary">
                            <Filter className="w-3.5 h-3.5" />
                            {t('valuation.activeBatches')}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-secondary/20">
                                    <th className="px-8 py-5 text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('valuation.table.productName')}</th>
                                    <th className="px-8 py-5 text-xs font-bold text-muted-foreground uppercase tracking-wider text-center">{t('valuation.table.qty')}</th>
                                    <th className="px-8 py-5 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">{t('valuation.table.valuation')}</th>
                                    <th className="px-8 py-5 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">{t('valuation.table.details')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/30">
                                {data?.items.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-secondary/30 transition-colors group cursor-default">
                                        <td className="px-8 py-5">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-foreground group-hover:text-primary transition-colors text-base">{item.item_name}</span>
                                                <span className="text-xs text-muted-foreground font-mono mt-0.5">ID: {idx + 1000}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <span className="bg-secondary/50 px-3 py-1 rounded-lg font-bold text-foreground text-sm">
                                                {item.current_stock}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <span className="font-bold text-success-500 text-base">{formatCurrency(item.total_value)}</span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex flex-col items-end gap-1.5">
                                                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide bg-secondary/30 px-1.5 py-0.5 rounded">
                                                    {t('valuation.table.batchesCount', { count: item.batches.length })}
                                                </span>
                                                <div className="flex gap-1">
                                                    {item.batches.slice(0, 5).map((_, bIdx) => (
                                                        <motion.div
                                                            key={bIdx}
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            transition={{ delay: 0.05 * bIdx }}
                                                            className="w-2 h-2 rounded-full bg-primary-500/50"
                                                            title={`Batch ${bIdx + 1}`}
                                                        />
                                                    ))}
                                                    {item.batches.length > 5 && (
                                                        <div className="w-2 h-2 rounded-full bg-border text-[6px] flex items-center justify-center">+</div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </AnimatedCard>
        </div>
    );
}
