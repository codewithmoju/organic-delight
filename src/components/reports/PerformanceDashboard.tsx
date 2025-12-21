import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { TrendingUp, Award, Target, Info } from 'lucide-react';
import { getProductPerformance, ProductRanking } from '../../lib/api/performance';
import { formatCurrency } from '../../lib/utils/notifications';
import LoadingSpinner from '../ui/LoadingSpinner';
import AnimatedCard from '../ui/AnimatedCard';

export default function PerformanceDashboard() {
    const [data, setData] = useState<ProductRanking[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [timeRange, setTimeRange] = useState(30);

    useEffect(() => {
        loadPerformance();
    }, [timeRange]);

    const loadPerformance = async () => {
        setIsLoading(true);
        try {
            const rankings = await getProductPerformance(timeRange);
            setData(rankings);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

    if (isLoading) return <LoadingSpinner text="Consulting sales data..." />;

    const top10 = data.slice(0, 5);
    const bottom5 = [...data].sort((a, b) => a.profit - b.profit).slice(0, 3);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Award className="w-6 h-6 text-accent-400" />
                        Product Performance
                    </h2>
                    <p className="text-gray-400">Discover your most profitable and popular items</p>
                </div>

                <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(Number(e.target.value))}
                    className="input-dark py-2 px-4 rounded-xl border border-dark-600/50"
                >
                    <option value={7}>Last 7 Days</option>
                    <option value={30}>Last 30 Days</option>
                    <option value={90}>Last 90 Days</option>
                </select>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Top Performers Chart */}
                <AnimatedCard delay={0.1}>
                    <div className="p-6">
                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-success-400" />
                            Profitability Leaders (Top 5)
                        </h3>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={top10} layout="vertical" margin={{ left: 40 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} opacity={0.3} />
                                    <XAxis type="number" stroke="#9CA3AF" fontSize={10} axisLine={false} tickLine={false} />
                                    <YAxis dataKey="name" type="category" stroke="#9CA3AF" fontSize={10} width={100} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '12px' }}
                                        formatter={(value: any) => formatCurrency(value)}
                                    />
                                    <Bar dataKey="profit" radius={[0, 4, 4, 0]}>
                                        {top10.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </AnimatedCard>

                {/* Profit Contribution Pie */}
                <AnimatedCard delay={0.2}>
                    <div className="p-6">
                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <Target className="w-5 h-5 text-primary-400" />
                            Profit Contribution Share
                        </h3>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={top10}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="profit"
                                        stroke="none"
                                    >
                                        {top10.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: any) => formatCurrency(value)} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </AnimatedCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <AnimatedCard delay={0.3}>
                        <div className="p-6">
                            <h3 className="text-lg font-bold text-white mb-6">Performance Details</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-dark-700/50">
                                            <th className="pb-3 text-gray-400 font-medium text-sm">Product</th>
                                            <th className="pb-3 text-gray-400 font-medium text-sm text-center">Qty</th>
                                            <th className="pb-3 text-gray-400 font-medium text-sm text-right">Profit</th>
                                            <th className="pb-3 text-gray-400 font-medium text-sm text-right">Margin</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.slice(0, 8).map((p, idx) => (
                                            <tr key={idx} className="border-b border-dark-700/30 hover:bg-dark-700/20 transition-colors">
                                                <td className="py-4 text-white font-medium">{p.name}</td>
                                                <td className="py-4 text-center text-gray-300">{p.quantity}</td>
                                                <td className="py-4 text-right font-bold text-success-400">{formatCurrency(p.profit)}</td>
                                                <td className="py-4 text-right text-accent-400">{p.margin.toFixed(1)}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </AnimatedCard>
                </div>

                <div>
                    <AnimatedCard delay={0.4} className="border-error-500/30 bg-error-500/5">
                        <div className="p-6">
                            <h3 className="text-lg font-bold text-error-400 mb-6 flex items-center gap-2">
                                <Info className="w-5 h-5" />
                                Underperformers
                            </h3>
                            <div className="space-y-4">
                                {bottom5.map((p, idx) => (
                                    <div key={idx} className="p-4 rounded-xl bg-dark-900/50 border border-error-500/10">
                                        <p className="text-white font-medium mb-1">{p.name}</p>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-gray-500">{p.quantity} sold</span>
                                            <span className="text-error-400 font-bold">{formatCurrency(p.profit)} profit</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <p className="mt-6 text-xs text-gray-500 italic">
                                Consider discounting these items to free up warehouse space.
                            </p>
                        </div>
                    </AnimatedCard>
                </div>
            </div>
        </div>
    );
}
