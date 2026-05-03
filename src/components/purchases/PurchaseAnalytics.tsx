import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { TrendingUp, Building2, Package, DollarSign } from 'lucide-react';
import { Purchase } from '../../lib/types';
import { formatCurrency } from '../../lib/utils/notifications';

interface PurchaseAnalyticsProps {
  purchases: Purchase[];
}

const COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe'];

export default function PurchaseAnalytics({ purchases }: PurchaseAnalyticsProps) {
  // ── Daily spend (last 30 days) ──────────────────────────────────────────
  const dailyData = useMemo(() => {
    const days = eachDayOfInterval({ start: subDays(new Date(), 29), end: new Date() });
    return days.map(day => {
      const dayStr = format(day, 'MMM d');
      const total = purchases
        .filter(p => format(new Date(p.purchase_date), 'MMM d, yyyy') === format(day, 'MMM d, yyyy'))
        .reduce((s, p) => s + p.total_amount, 0);
      return { date: dayStr, total };
    }).filter((_, i) => i % 3 === 0); // sample every 3 days to avoid crowding
  }, [purchases]);

  // ── Top vendors ─────────────────────────────────────────────────────────
  const vendorData = useMemo(() => {
    const map: Record<string, number> = {};
    purchases.forEach(p => {
      map[p.vendor_name] = (map[p.vendor_name] || 0) + p.total_amount;
    });
    return Object.entries(map)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [purchases]);

  // ── Payment status breakdown ─────────────────────────────────────────────
  const statusData = useMemo(() => {
    const paid = purchases.filter(p => p.payment_status === 'paid').length;
    const partial = purchases.filter(p => p.payment_status === 'partial').length;
    const unpaid = purchases.filter(p => p.payment_status === 'unpaid').length;
    return [
      { name: 'Paid', value: paid, color: '#10b981' },
      { name: 'Partial', value: partial, color: '#f59e0b' },
      { name: 'Unpaid', value: unpaid, color: '#ef4444' },
    ].filter(d => d.value > 0);
  }, [purchases]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-card border border-border/60 rounded-xl px-3 py-2 shadow-lg text-xs">
        <p className="font-semibold text-foreground mb-1">{label}</p>
        <p className="text-primary">{formatCurrency(payload[0].value)}</p>
      </div>
    );
  };

  if (purchases.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* ── Spend over time ── */}
      <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Spend Over Time (Last 30 Days)
        </h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" opacity={0.3} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'rgb(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 10, fill: 'rgb(var(--muted-foreground))' }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="total" fill="rgb(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* ── Top vendors ── */}
        <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-purple-500" />
            Top Vendors
          </h3>
          <div className="space-y-3">
            {vendorData.map((v, i) => {
              const maxVal = vendorData[0]?.total || 1;
              return (
                <div key={v.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground truncate max-w-[60%]">{v.name}</span>
                    <span className="font-semibold text-foreground tabular-nums">{formatCurrency(v.total)}</span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                      initial={{ width: 0 }}
                      animate={{ width: `${(v.total / maxVal) * 100}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut', delay: i * 0.1 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Payment status ── */}
        <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-success-500" />
            Payment Status
          </h3>
          {statusData.length > 0 ? (
            <div className="flex items-center gap-4">
              <div className="h-32 w-32 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={28} outerRadius={48} dataKey="value" paddingAngle={3}>
                      {statusData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 flex-1">
                {statusData.map(d => (
                  <div key={d.name} className="flex items-center gap-2 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="text-muted-foreground flex-1">{d.name}</span>
                    <span className="font-bold text-foreground">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-4">No data</p>
          )}
        </div>
      </div>
    </div>
  );
}
