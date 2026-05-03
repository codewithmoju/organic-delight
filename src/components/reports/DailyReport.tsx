import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign, TrendingUp, TrendingDown, CreditCard,
  Wallet, ShoppingBag, RefreshCcw, ArrowUpRight,
  ArrowDownRight, Receipt, Package, Calendar
} from 'lucide-react';
import { DailyOperationsReport } from '../../lib/types';
import { generateDailyReport } from '../../lib/api/reports';
import { formatCurrency } from '../../lib/utils/notifications';
import LoadingSpinner from '../ui/LoadingSpinner';
import { readScopedJSON, writeScopedJSON } from '../../lib/utils/storageScope';

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({
  title, value, icon: Icon, accent, subValue, trend,
}: {
  title: string;
  value: number;
  icon: any;
  accent: string;
  subValue?: string;
  trend?: 'up' | 'down' | 'neutral';
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative overflow-hidden rounded-2xl bg-card border border-border/60 p-4 sm:p-5 hover:shadow-md transition-all duration-300"
    >
      <div className={`absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl opacity-15 group-hover:opacity-25 transition-opacity ${accent}`} />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground truncate">{title}</p>
          <h3 className="text-xl sm:text-2xl font-bold text-foreground mt-1 tracking-tight tabular-nums">
            {formatCurrency(value)}
          </h3>
          {subValue && <p className="text-xs text-muted-foreground mt-1">{subValue}</p>}
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <div className={`p-2.5 rounded-xl ${accent} bg-opacity-10`}>
            <Icon className={`w-5 h-5 ${accent.replace('bg-', 'text-')}`} />
          </div>
          {trend && trend !== 'neutral' && (
            <span className={`text-xs font-semibold ${trend === 'up' ? 'text-success-500' : 'text-error-500'}`}>
              {trend === 'up' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Row helper ────────────────────────────────────────────────────────────────
function Row({ label, value, valueClass = '' }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-border/30 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm font-semibold tabular-nums ${valueClass || 'text-foreground'}`}>{value}</span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function DailyReport() {
  const [report, setReport] = useState<DailyOperationsReport | null>(() =>
    readScopedJSON<DailyOperationsReport | null>('daily_report_cache', null, undefined, 'daily_report_cache')
  );

  const [selectedDate, setSelectedDate] = useState(() => {
    const cached = readScopedJSON<string | null>('daily_report_date_cache', null, undefined, 'daily_report_date_cache');
    return cached ? new Date(cached) : new Date();
  });

  const [isLoading, setIsLoading] = useState(
    () => readScopedJSON<DailyOperationsReport | null>('daily_report_cache', null, undefined, 'daily_report_cache') == null
  );

  useEffect(() => {
    loadReport(!report);
  }, [selectedDate]);

  const loadReport = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const data = await generateDailyReport(selectedDate);
      setReport(data);
      writeScopedJSON('daily_report_cache', data);
      writeScopedJSON('daily_report_date_cache', selectedDate.toISOString());
    } catch (error) {
      console.error('Error loading daily report:', error);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Generating daily report..." />
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="app-page-title">Daily Operations Report</h1>
          <p className="app-page-subtitle">
            {selectedDate.toLocaleDateString('en-US', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="date"
              value={selectedDate.toISOString().split('T')[0]}
              onChange={e => setSelectedDate(new Date(e.target.value))}
              className="h-10 pl-9 pr-4 bg-card border border-border/60 rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => loadReport(true)}
            className="h-10 w-10 flex items-center justify-center rounded-xl bg-card border border-border/60 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <RefreshCcw className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {report ? (
        <>
          {/* ─── Sales Stats ─── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard
              title="Total Sales"
              value={report.total_sales}
              icon={DollarSign}
              accent="bg-success-500"
              subValue={`${report.transactions_count} transactions`}
              trend="up"
            />
            <StatCard
              title="Cash Sales"
              value={report.cash_sales}
              icon={Wallet}
              accent="bg-primary"
            />
            <StatCard
              title="Credit Sales (Udhaar)"
              value={report.credit_sales}
              icon={CreditCard}
              accent="bg-warning-500"
            />
            <StatCard
              title="Card / Digital"
              value={report.card_sales + report.digital_sales}
              icon={ShoppingBag}
              accent="bg-purple-500"
            />
          </div>

          {/* ─── Financial Detail ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Income & Expenses */}
            <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm">
              <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-success-500" />
                Income & Expenses
              </h3>
              <div className="space-y-0">
                <Row label="Total Sales" value={`+${formatCurrency(report.total_sales)}`} valueClass="text-success-500" />
                <Row label="Customer Collections" value={`+${formatCurrency(report.customer_collections)}`} valueClass="text-success-500" />
                <Row label="Total Expenses" value={`-${formatCurrency(report.total_expenses)}`} valueClass="text-error-500" />
                <Row label="Vendor Payments" value={`-${formatCurrency(report.vendor_payments)}`} valueClass="text-error-500" />
                <Row label="Total Returns" value={`-${formatCurrency(report.total_returns)}`} valueClass="text-error-500" />
                <Row label="Total Discounts" value={`-${formatCurrency(report.total_discounts)}`} valueClass="text-warning-500" />
              </div>
            </div>

            {/* Profit & Cash */}
            <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm">
              <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-primary" />
                Profit & Cash Summary
              </h3>
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-success-500/10 border border-success-500/20">
                  <p className="text-xs text-muted-foreground mb-1">Gross Profit</p>
                  <p className="text-2xl font-bold text-success-500 tabular-nums">{formatCurrency(report.gross_profit)}</p>
                </div>
                <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                  <p className="text-xs text-muted-foreground mb-1">Net Profit</p>
                  <p className="text-2xl font-bold text-primary tabular-nums">{formatCurrency(report.net_profit)}</p>
                </div>
                <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <p className="text-xs text-muted-foreground mb-1">Cash on Hand</p>
                  <p className="text-2xl font-bold text-purple-500 tabular-nums">{formatCurrency(report.cash_on_hand)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Cash Sales + Collections − Expenses − Vendor Payments − Returns
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ─── Quick Stats ─── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: Receipt, label: 'Transactions', value: report.transactions_count.toString(), accent: 'bg-primary' },
              { icon: RefreshCcw, label: 'Returns', value: report.returns_count.toString(), accent: 'bg-warning-500' },
              { icon: Package, label: 'Purchases', value: formatCurrency(report.total_purchases), accent: 'bg-purple-500' },
              { icon: DollarSign, label: 'Avg. Transaction', value: formatCurrency(report.average_transaction_value), accent: 'bg-success-500' },
            ].map(({ icon: Icon, label, value, accent }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card rounded-2xl border border-border/60 p-4 text-center hover:shadow-md transition-all"
              >
                <div className={`w-10 h-10 rounded-xl ${accent} bg-opacity-10 flex items-center justify-center mx-auto mb-2`}>
                  <Icon className={`w-5 h-5 ${accent.replace('bg-', 'text-')}`} />
                </div>
                <p className="text-lg font-bold text-foreground tabular-nums">{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </motion.div>
            ))}
          </div>
        </>
      ) : (
        <div className="py-16 text-center">
          <DollarSign className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No data available for this date</p>
        </div>
      )}
    </div>
  );
}
