import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { TrendingUp, Award, Target, Info, Calendar } from 'lucide-react';
import { getProductPerformance, ProductRanking } from '../../lib/api/performance';
import { formatCurrency } from '../../lib/utils/notifications';
import { useAuthStore } from '../../lib/store';
import AnimatedCard from '../ui/AnimatedCard';
import PerformanceSkeleton from '../skeletons/PerformanceSkeleton';

export default function PerformanceDashboard() {
    const { profile } = useAuthStore();
    const [data, setData] = useState<ProductRanking[]>(() => {
        try {
            const cached = localStorage.getItem('performance_cache');
            return cached ? JSON.parse(cached) : [];
        } catch { return []; }
    });
    const [isLoading, setIsLoading] = useState(() => !localStorage.getItem('performance_cache'));
    const [timeRange, setTimeRange] = useState(30);

    useEffect(() => {
        const hasCache = data.length > 0;
        loadPerformance(!hasCache);
    }, [timeRange]);

    const loadPerformance = async (showLoading = true) => {
        if (showLoading) setIsLoading(true);
        try {
            const rankings = await getProductPerformance(timeRange);
            setData(rankings);
            localStorage.setItem('performance_cache', JSON.stringify(rankings));
        } catch (error) {
            console.error('Error:', error);
        } finally {
            if (showLoading) setIsLoading(false);
        }
    };

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

    if (isLoading) return <PerformanceSkeleton />;

    const top10 = data.slice(0, 5);
    const bottom5 = [...data].sort((a, b) => a.profit - b.profit).slice(0, 3);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-card/95 backdrop-blur-md border border-border/50 p-3 rounded-xl shadow-xl">
                    <p className="font-semibold text-foreground mb-1">{label}</p>
                    <p className="text-sm" style={{ color: payload[0].fill }}>
                        {formatCurrency(payload[0].value)}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* ─── HEADER ─── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-foreground flex items-center gap-3">
                        <div className="p-2 bg-accent/10 rounded-xl">
                            <Award className="w-6 h-6 text-accent" />
                        </div>
                        Product Performance
                    </h2>
                    <p className="text-muted-foreground mt-1 ml-1">Discover your most profitable and popular items</p>
                </div>

                <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(Number(e.target.value))}
                        className="appearance-none bg-card border border-border/60 hover:border-primary/50 text-foreground py-2.5 pl-10 pr-10 rounded-xl shadow-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer font-medium"
                    >
                        <option value={7}>Last 7 Days</option>
                        <option value={30}>Last 30 Days</option>
                        <option value={90}>Last 90 Days</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Top Performers Chart */}
                <AnimatedCard delay={0.1} className="h-full">
                    <div className="p-6 h-full flex flex-col">
                        <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                            <div className="p-1.5 bg-green-500/10 rounded-lg">
                                <TrendingUp className="w-5 h-5 text-green-500" />
                            </div>
                            Profitability Leaders <span className="text-sm font-normal text-muted-foreground ml-1">(Top 5)</span>
                        </h3>
                        <div className="flex-1 min-h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={top10} layout="vertical" margin={{ left: 0, right: 30 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} horizontal={true} vertical={false} />
                                    <XAxis type="number" stroke="currentColor" opacity={0.4} fontSize={10} axisLine={false} tickLine={false} tickFormatter={(val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: profile?.preferred_currency || 'PKR', maximumFractionDigits: 0 }).format(val)} />
                                    <YAxis dataKey="name" type="category" stroke="currentColor" opacity={0.7} fontSize={11} width={100} axisLine={false} tickLine={false} />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'currentColor', opacity: 0.05 }} />
                                    <Bar dataKey="profit" radius={[0, 6, 6, 0]} barSize={32}>
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
                <AnimatedCard delay={0.2} className="h-full">
                    <div className="p-6 h-full flex flex-col">
                        <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                            <div className="p-1.5 bg-primary/10 rounded-lg">
                                <Target className="w-5 h-5 text-primary" />
                            </div>
                            Profit Contribution Share
                        </h3>
                        <div className="flex-1 min-h-[300px] relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={top10}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius="60%"
                                        outerRadius="80%"
                                        paddingAngle={5}
                                        dataKey="profit"
                                        stroke="none"
                                        cornerRadius={6}
                                    >
                                        {top10.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Center Text Overlay */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <span className="text-sm font-medium text-muted-foreground">Top 5</span>
                            </div>
                        </div>
                    </div>
                </AnimatedCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <AnimatedCard delay={0.3} className="h-full overflow-hidden">
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-foreground mb-6">Performance Details</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-border/40">
                                            <th className="pb-4 pl-4 text-muted-foreground font-semibold text-xs uppercase tracking-wider">Product</th>
                                            <th className="pb-4 text-muted-foreground font-semibold text-xs uppercase tracking-wider text-center">Qty</th>
                                            <th className="pb-4 text-muted-foreground font-semibold text-xs uppercase tracking-wider text-right">Profit</th>
                                            <th className="pb-4 pr-4 text-muted-foreground font-semibold text-xs uppercase tracking-wider text-right">Margin</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/30">
                                        {data.slice(0, 8).map((p, idx) => (
                                            <tr key={idx} className="group hover:bg-secondary/30 transition-colors">
                                                <td className="py-3 pl-4 text-foreground font-medium text-sm">{p.name}</td>
                                                <td className="py-3 text-center text-muted-foreground text-sm">
                                                    <span className="bg-secondary/50 px-2 py-0.5 rounded-md text-xs">{p.quantity}</span>
                                                </td>
                                                <td className="py-3 text-right font-bold text-green-500 font-mono text-sm">{formatCurrency(p.profit)}</td>
                                                <td className="py-3 pr-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                                                            <div className="h-full bg-accent rounded-full" style={{ width: `${Math.min(p.margin, 100)}%` }} />
                                                        </div>
                                                        <span className="text-xs font-medium text-accent">{p.margin.toFixed(1)}%</span>
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

                <div>
                    <AnimatedCard delay={0.4} className="h-full border-red-500/20 bg-gradient-to-br from-card to-red-500/5">
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-red-500 mb-6 flex items-center gap-2">
                                <Info className="w-5 h-5" />
                                Underperformers
                            </h3>
                            <div className="space-y-4">
                                {bottom5.map((p, idx) => (
                                    <div key={idx} className="p-4 rounded-xl bg-card/50 border border-red-500/10 hover:border-red-500/30 transition-colors">
                                        <p className="text-foreground font-medium mb-2 text-sm">{p.name}</p>
                                        <div className="flex justify-between items-end">
                                            <span className="text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded">{p.quantity} sold</span>
                                            <span className="text-red-500 font-bold text-sm">{formatCurrency(p.profit)} profit</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-8 p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                                <p className="text-xs text-red-400 italic">
                                    "Consider discounting these items to free up warehouse space and improve cash flow."
                                </p>
                            </div>
                        </div>
                    </AnimatedCard>
                </div>
            </div>
        </div>
    );
}
