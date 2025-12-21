import { useState, useEffect } from 'react';
import { DollarSign, Filter } from 'lucide-react';
import { calculateInventoryValuation, ItemValuation } from '../../lib/api/valuation';
import { formatCurrency } from '../../lib/utils/notifications';
import LoadingSpinner from '../ui/LoadingSpinner';
import AnimatedCard from '../ui/AnimatedCard';
import { toast } from 'sonner';

export default function ValuationReport() {
    const [method, setMethod] = useState<'FIFO' | 'LIFO'>('FIFO');
    const [data, setData] = useState<{ items: ItemValuation[], totalValue: number } | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadValuation();
    }, [method]);

    const loadValuation = async () => {
        setIsLoading(true);
        try {
            const result = await calculateInventoryValuation(method);
            setData(result);
        } catch (error) {
            console.error('Valuation error:', error);
            toast.error('Failed to calculate valuation');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) return <LoadingSpinner text="Analyzing inventory batches..." />;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <DollarSign className="w-6 h-6 text-success-400" />
                        Inventory Valuation
                    </h2>
                    <p className="text-gray-400">Total monetary value of your stock</p>
                </div>

                <div className="flex bg-dark-700/50 rounded-xl p-1 border border-dark-600/50">
                    {(['FIFO', 'LIFO'] as const).map((m) => (
                        <button
                            key={m}
                            onClick={() => setMethod(m)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${method === m
                                ? 'bg-primary-600 text-white shadow-glow'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            {m}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatedCard delay={0.1}>
                    <div className="p-6">
                        <p className="text-gray-400 text-sm mb-1">Total Asset Value</p>
                        <p className="text-3xl font-bold text-success-400">
                            {formatCurrency(data?.totalValue || 0)}
                        </p>
                        <div className="mt-4 flex items-center gap-2 text-xs text-gray-500 bg-dark-900/50 p-2 rounded-lg">
                            <span className="w-2 h-2 rounded-full bg-success-500" />
                            Calculated using {method} method
                        </div>
                    </div>
                </AnimatedCard>

                <AnimatedCard delay={0.2}>
                    <div className="p-6">
                        <p className="text-gray-400 text-sm mb-1">Stocked Items</p>
                        <p className="text-3xl font-bold text-white">
                            {data?.items.length || 0}
                        </p>
                        <p className="text-xs text-gray-500 mt-4">Across all categories</p>
                    </div>
                </AnimatedCard>

                <AnimatedCard delay={0.3}>
                    <div className="p-6">
                        <p className="text-gray-400 text-sm mb-1">Avg. Item Value</p>
                        <p className="text-3xl font-bold text-primary-400">
                            {formatCurrency((data?.totalValue || 0) / (data?.items.length || 1))}
                        </p>
                        <p className="text-xs text-gray-500 mt-4">Per unique product</p>
                    </div>
                </AnimatedCard>
            </div>

            <AnimatedCard delay={0.4}>
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-white">Batched Inventory Breakdown</h3>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                            <Filter className="w-4 h-4" />
                            Showing active batches only
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-dark-700/50">
                                    <th className="pb-3 text-gray-400 font-medium text-sm">Product Name</th>
                                    <th className="pb-3 text-gray-400 font-medium text-sm text-center">Qty</th>
                                    <th className="pb-3 text-gray-400 font-medium text-sm text-right">Valuation</th>
                                    <th className="pb-3 text-gray-400 font-medium text-sm text-right">Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data?.items.map((item, idx) => (
                                    <tr key={idx} className="border-b border-dark-700/30 hover:bg-dark-700/20 transition-colors group">
                                        <td className="py-4 font-medium text-white">{item.item_name}</td>
                                        <td className="py-4 text-center text-gray-300">{item.current_stock}</td>
                                        <td className="py-4 text-right font-bold text-success-400">{formatCurrency(item.total_value)}</td>
                                        <td className="py-4 text-right">
                                            <div className="flex flex-col items-end gap-1">
                                                <span className="text-[10px] text-gray-500">
                                                    {item.batches.length} purchase batches
                                                </span>
                                                <div className="flex gap-0.5">
                                                    {item.batches.slice(0, 5).map((_, bIdx) => (
                                                        <div key={bIdx} className="w-1.5 h-1.5 rounded-full bg-primary-500/50" />
                                                    ))}
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
