import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Star, TrendingUp, Package, RotateCcw, Clock } from 'lucide-react';
import { Purchase } from '../../lib/types';
import { formatCurrency } from '../../lib/utils/notifications';

interface VendorPerformanceProps {
  vendorId: string;
  vendorName: string;
  purchases: Purchase[];
}

function MetricRow({ label, value, sub, icon: Icon, color }: {
  label: string; value: string; sub?: string; icon: any; color: string;
}) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border/30 last:border-0">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-bold text-foreground">{value}</p>
        {sub && <p className="text-xs text-muted-foreground/70">{sub}</p>}
      </div>
    </div>
  );
}

export default function VendorPerformance({ vendorId, vendorName, purchases }: VendorPerformanceProps) {
  const metrics = useMemo(() => {
    if (!purchases.length) return null;

    const totalOrders = purchases.length;
    const totalSpend = purchases.reduce((s, p) => s + p.total_amount, 0);
    const avgOrderValue = totalSpend / totalOrders;

    // On-time delivery: purchases marked as 'received' vs total
    const received = purchases.filter(p => p.delivery_status === 'received').length;
    const deliveryRate = totalOrders > 0 ? (received / totalOrders) * 100 : 0;

    // Return rate: purchases with returns (pending_amount changed after paid)
    const withReturns = purchases.filter(p => p.payment_status === 'paid' && p.pending_amount < 0).length;
    const returnRate = totalOrders > 0 ? (withReturns / totalOrders) * 100 : 0;

    // Average days to receive (rough: compare purchase_date to delivered_at)
    const deliveredPurchases = purchases.filter(p => p.delivered_at && p.purchase_date);
    const avgDaysToReceive = deliveredPurchases.length > 0
      ? deliveredPurchases.reduce((s, p) => {
          const days = (new Date(p.delivered_at!).getTime() - new Date(p.purchase_date).getTime()) / 86400000;
          return s + days;
        }, 0) / deliveredPurchases.length
      : null;

    // Simple score: 0-5 stars based on delivery rate
    const score = Math.round((deliveryRate / 100) * 5 * 10) / 10;

    return { totalOrders, totalSpend, avgOrderValue, deliveryRate, returnRate, avgDaysToReceive, score };
  }, [purchases]);

  if (!metrics) {
    return (
      <div className="text-center py-6">
        <Package className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-xs text-muted-foreground">No purchase history to calculate metrics</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Score */}
      <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/10">
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map(i => (
            <Star
              key={i}
              className={`w-5 h-5 ${i <= Math.round(metrics.score) ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30'}`}
            />
          ))}
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">{metrics.score.toFixed(1)} / 5.0</p>
          <p className="text-xs text-muted-foreground">Performance Score</p>
        </div>
      </div>

      {/* Metrics */}
      <div className="space-y-0">
        <MetricRow
          label="Total Orders"
          value={metrics.totalOrders.toString()}
          sub={`Avg ${formatCurrency(metrics.avgOrderValue)} per order`}
          icon={Package}
          color="bg-blue-500/10 text-blue-500"
        />
        <MetricRow
          label="Total Spend"
          value={formatCurrency(metrics.totalSpend)}
          icon={TrendingUp}
          color="bg-emerald-500/10 text-emerald-500"
        />
        <MetricRow
          label="Delivery Rate"
          value={`${metrics.deliveryRate.toFixed(0)}%`}
          sub={`${purchases.filter(p => p.delivery_status === 'received').length} of ${metrics.totalOrders} orders received`}
          icon={Clock}
          color="bg-purple-500/10 text-purple-500"
        />
        {metrics.avgDaysToReceive !== null && (
          <MetricRow
            label="Avg. Days to Receive"
            value={`${metrics.avgDaysToReceive.toFixed(1)} days`}
            icon={Clock}
            color="bg-orange-500/10 text-orange-500"
          />
        )}
        <MetricRow
          label="Return Rate"
          value={`${metrics.returnRate.toFixed(1)}%`}
          icon={RotateCcw}
          color="bg-rose-500/10 text-rose-500"
        />
      </div>
    </div>
  );
}
