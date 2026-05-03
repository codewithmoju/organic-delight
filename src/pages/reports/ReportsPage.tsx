import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  Download,
  Package,
  Tag,
  TrendingUp,
  Receipt,
  Archive,
  Users,
  Building2,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../lib/utils/notifications';
import { exportToCSV } from '../../lib/utils/csvExport';
import ExportMenu from '../../components/ui/ExportMenu';
import {
  getSalesByProduct,
  getSalesByCategory,
  getProfitLossStatement,
  getTaxReport,
  getInventoryAging,
  getCustomerCreditAging,
  getVendorPaymentAging,
} from '../../lib/api/salesReports';

// ─── Types ────────────────────────────────────────────────────────────────────

type TabId =
  | 'sales-product'
  | 'sales-category'
  | 'pnl'
  | 'tax'
  | 'inventory-aging'
  | 'customer-aging'
  | 'vendor-aging';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ElementType;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS: Tab[] = [
  { id: 'sales-product', label: 'Sales by Product', icon: Package },
  { id: 'sales-category', label: 'Sales by Category', icon: Tag },
  { id: 'pnl', label: 'P&L Statement', icon: TrendingUp },
  { id: 'tax', label: 'Tax Report', icon: Receipt },
  { id: 'inventory-aging', label: 'Inventory Aging', icon: Archive },
  { id: 'customer-aging', label: 'Customer Aging', icon: Users },
  { id: 'vendor-aging', label: 'Vendor Aging', icon: Building2 },
];

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getMonthStart(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

function getToday(): string {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

function parseDate(str: string, endOfDay = false): Date {
  const d = new Date(str);
  if (endOfDay) {
    d.setHours(23, 59, 59, 999);
  } else {
    d.setHours(0, 0, 0, 0);
  }
  return d;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="animate-pulse space-y-2 p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3">
          {Array.from({ length: cols }).map((_, j) => (
            <div
              key={j}
              className="h-8 bg-secondary/60 rounded-lg flex-1"
              style={{ opacity: 1 - i * 0.12 }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="animate-pulse bg-card rounded-2xl border border-border/60 p-5 shadow-sm space-y-3">
      <div className="h-4 w-24 bg-secondary/60 rounded" />
      <div className="h-8 w-32 bg-secondary/60 rounded" />
      <div className="h-3 w-20 bg-secondary/40 rounded" />
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  colorClass?: string;
  bgClass?: string;
  delay?: number;
}

function StatCard({ label, value, sub, icon: Icon, colorClass = 'text-primary', bgClass = 'bg-primary/10', delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow"
    >
      <div className={`absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity ${bgClass}`} />
      <div className="relative z-10">
        <div className={`inline-flex p-2.5 rounded-xl ${bgClass} mb-3`}>
          <Icon className={`w-4 h-4 ${colorClass}`} />
        </div>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className={`text-2xl font-bold mt-0.5 ${colorClass}`}>{value}</p>
        {sub && <p className="text-xs text-muted-foreground/70 mt-1">{sub}</p>}
      </div>
    </motion.div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ message = 'No data for the selected period' }: { message?: string }) {
  return (
    <div className="py-16 flex flex-col items-center justify-center text-center gap-3">
      <div className="p-4 bg-secondary/50 rounded-2xl">
        <BarChart3 className="w-8 h-8 text-muted-foreground/50" />
      </div>
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  );
}

// ─── Export Button ────────────────────────────────────────────────────────────

function ExportButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-sm font-medium text-foreground transition-colors"
    >
      <Download className="w-4 h-4" />
      Export CSV
    </button>
  );
}

// ─── Sales by Product Tab ─────────────────────────────────────────────────────

function SalesByProductTab({ startDate, endDate }: { startDate: Date; endDate: Date }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getSalesByProduct(startDate, endDate)
      .then(setData)
      .catch(() => toast.error('Failed to load sales by product'))
      .finally(() => setLoading(false));
  }, [startDate, endDate]);

  const totalRevenue = data.reduce((s, r) => s + r.revenue, 0);
  const totalUnits = data.reduce((s, r) => s + r.quantity, 0);
  const topProduct = data[0]?.name ?? '—';

  const handleExport = () => {
    exportToCSV(
      data.map(r => ({
        Product: r.name,
        'Units Sold': r.quantity,
        Revenue: r.revenue.toFixed(2),
        Cost: r.cost.toFixed(2),
        Profit: r.profit.toFixed(2),
        'Margin %': r.margin.toFixed(1),
      })),
      'sales-by-product'
    );
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard label="Total Revenue" value={formatCurrency(totalRevenue)} icon={TrendingUp} colorClass="text-emerald-600 dark:text-emerald-400" bgClass="bg-emerald-500/10" delay={0} />
            <StatCard label="Total Units Sold" value={totalUnits.toLocaleString()} icon={Package} colorClass="text-blue-600 dark:text-blue-400" bgClass="bg-blue-500/10" delay={0.05} />
            <StatCard label="Top Product" value={topProduct} icon={BarChart3} colorClass="text-purple-600 dark:text-purple-400" bgClass="bg-purple-500/10" delay={0.1} />
          </>
        )}
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-card rounded-2xl border border-border/60 overflow-hidden shadow-sm"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/40 bg-secondary/30">
          <h3 className="font-semibold text-foreground text-sm">Product Breakdown</h3>
          <ExportButton onClick={handleExport} />
        </div>
        {loading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : data.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[640px]">
              <thead>
                <tr className="bg-secondary/30 border-b border-border/40">
                  <th className="px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Product Name</th>
                  <th className="px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Units Sold</th>
                  <th className="px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Revenue</th>
                  <th className="px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Cost</th>
                  <th className="px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Profit</th>
                  <th className="px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Margin %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {data.map((row, i) => (
                  <motion.tr
                    key={row.item_id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="hover:bg-secondary/20 transition-colors"
                  >
                    <td className="px-5 py-3 text-sm font-medium text-foreground">{row.name}</td>
                    <td className="px-5 py-3 text-sm text-right text-muted-foreground">{row.quantity.toLocaleString()}</td>
                    <td className="px-5 py-3 text-sm text-right font-semibold text-foreground">{formatCurrency(row.revenue)}</td>
                    <td className="px-5 py-3 text-sm text-right text-muted-foreground">{formatCurrency(row.cost)}</td>
                    <td className={`px-5 py-3 text-sm text-right font-semibold ${row.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                      {formatCurrency(row.profit)}
                    </td>
                    <td className="px-5 py-3 text-sm text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-12 h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(Math.max(row.margin, 0), 100)}%` }} />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground tabular-nums w-10 text-right">{row.margin.toFixed(1)}%</span>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ─── Sales by Category Tab ────────────────────────────────────────────────────

function SalesByCategoryTab({ startDate, endDate }: { startDate: Date; endDate: Date }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getSalesByCategory(startDate, endDate)
      .then(setData)
      .catch(() => toast.error('Failed to load sales by category'))
      .finally(() => setLoading(false));
  }, [startDate, endDate]);

  const totalRevenue = data.reduce((s, r) => s + r.revenue, 0);

  const handleExport = () => {
    exportToCSV(
      data.map(r => ({
        Category: r.name,
        'Units Sold': r.quantity,
        Revenue: r.revenue.toFixed(2),
        '% of Total': totalRevenue > 0 ? ((r.revenue / totalRevenue) * 100).toFixed(1) : '0',
      })),
      'sales-by-category'
    );
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <div className="bg-card border border-border/60 p-3 rounded-xl shadow-lg text-sm">
          <p className="font-semibold text-foreground mb-1">{label}</p>
          <p className="text-primary">{formatCurrency(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard label="Total Revenue" value={formatCurrency(totalRevenue)} icon={TrendingUp} colorClass="text-emerald-600 dark:text-emerald-400" bgClass="bg-emerald-500/10" delay={0} />
            <StatCard label="Categories" value={data.length} icon={Tag} colorClass="text-blue-600 dark:text-blue-400" bgClass="bg-blue-500/10" delay={0.05} />
          </>
        )}
      </div>

      {/* Chart */}
      {!loading && data.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm"
        >
          <h3 className="font-semibold text-foreground text-sm mb-4">Revenue by Category</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ left: 0, right: 24, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.08} horizontal={false} />
                <XAxis type="number" stroke="currentColor" opacity={0.4} fontSize={10} axisLine={false} tickLine={false} tickFormatter={v => formatCurrency(v)} />
                <YAxis dataKey="name" type="category" stroke="currentColor" opacity={0.7} fontSize={11} width={110} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'currentColor', opacity: 0.05 }} />
                <Bar dataKey="revenue" radius={[0, 6, 6, 0]} barSize={28}>
                  {data.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card rounded-2xl border border-border/60 overflow-hidden shadow-sm"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/40 bg-secondary/30">
          <h3 className="font-semibold text-foreground text-sm">Category Breakdown</h3>
          <ExportButton onClick={handleExport} />
        </div>
        {loading ? (
          <TableSkeleton rows={5} cols={4} />
        ) : data.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[480px]">
              <thead>
                <tr className="bg-secondary/30 border-b border-border/40">
                  <th className="px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Category</th>
                  <th className="px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Units Sold</th>
                  <th className="px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Revenue</th>
                  <th className="px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">% of Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {data.map((row, i) => {
                  const pct = totalRevenue > 0 ? (row.revenue / totalRevenue) * 100 : 0;
                  return (
                    <motion.tr
                      key={row.category_id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="hover:bg-secondary/20 transition-colors"
                    >
                      <td className="px-5 py-3 text-sm font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                          {row.name}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-right text-muted-foreground">{row.quantity.toLocaleString()}</td>
                      <td className="px-5 py-3 text-sm text-right font-semibold text-foreground">{formatCurrency(row.revenue)}</td>
                      <td className="px-5 py-3 text-sm text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                          </div>
                          <span className="text-xs font-medium text-muted-foreground tabular-nums w-10 text-right">{pct.toFixed(1)}%</span>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ─── P&L Statement Tab ────────────────────────────────────────────────────────

function PLStatementTab({ startDate, endDate }: { startDate: Date; endDate: Date }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getProfitLossStatement(startDate, endDate)
      .then(setData)
      .catch(() => toast.error('Failed to load P&L statement'))
      .finally(() => setLoading(false));
  }, [startDate, endDate]);

  const handleExport = () => {
    if (!data) return;
    const rows = [
      { Line: 'Gross Revenue', Amount: data.revenue.toFixed(2) },
      { Line: 'Less: Discounts', Amount: (-data.discounts).toFixed(2) },
      { Line: 'Less: Returns', Amount: (-data.returns).toFixed(2) },
      { Line: 'Net Revenue', Amount: data.netRevenue.toFixed(2) },
      { Line: 'Cost of Goods Sold', Amount: (-data.cogs).toFixed(2) },
      { Line: 'Gross Profit', Amount: data.grossProfit.toFixed(2) },
      ...Object.entries(data.expenseByCategory).map(([cat, amt]) => ({ Line: `Expense: ${cat}`, Amount: (-(amt as number)).toFixed(2) })),
      { Line: 'Total Expenses', Amount: (-data.expenses).toFixed(2) },
      { Line: 'Operating Profit', Amount: data.operatingProfit.toFixed(2) },
    ];
    exportToCSV(rows, 'profit-loss-statement');
  };

  const PLRow = ({ label, value, indent = false, bold = false, positive = true, separator = false }: {
    label: string; value: number; indent?: boolean; bold?: boolean; positive?: boolean; separator?: boolean;
  }) => (
    <div className={`flex items-center justify-between py-2.5 ${separator ? 'border-t border-border/40 mt-1' : ''} ${indent ? 'pl-6' : ''}`}>
      <span className={`text-sm ${bold ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>{label}</span>
      <span className={`text-sm tabular-nums font-mono ${bold ? 'font-bold' : 'font-medium'} ${value < 0 ? 'text-red-500' : positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`}>
        {formatCurrency(value)}
      </span>
    </div>
  );

  if (loading) {
    return (
      <div className="bg-card rounded-2xl border border-border/60 p-6 shadow-sm animate-pulse space-y-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex justify-between">
            <div className="h-4 bg-secondary/60 rounded w-40" />
            <div className="h-4 bg-secondary/60 rounded w-24" />
          </div>
        ))}
      </div>
    );
  }

  if (!data) return <EmptyState message="No financial data for the selected period" />;

  const grossMargin = data.netRevenue > 0 ? (data.grossProfit / data.netRevenue) * 100 : 0;

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl border border-border/60 overflow-hidden shadow-sm"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 bg-secondary/30">
          <div>
            <h3 className="font-semibold text-foreground">Profit & Loss Statement</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Income, costs, and operating result</p>
          </div>
          <ExportButton onClick={handleExport} />
        </div>

        <div className="p-6 space-y-1 divide-y divide-border/20">
          {/* Income */}
          <div className="pb-3">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Income</p>
            <PLRow label="Gross Revenue" value={data.revenue} positive />
            <PLRow label="Less: Discounts" value={-data.discounts} indent positive={false} />
            <PLRow label="Less: Returns" value={-data.returns} indent positive={false} />
            <PLRow label="Net Revenue" value={data.netRevenue} bold separator />
          </div>

          {/* COGS */}
          <div className="py-3">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Cost of Goods</p>
            <PLRow label="Cost of Goods Sold" value={-data.cogs} positive={false} />
            <PLRow label="Gross Profit" value={data.grossProfit} bold separator />
            <div className="flex items-center justify-between py-1.5 pl-6">
              <span className="text-xs text-muted-foreground">Gross Margin</span>
              <span className={`text-xs font-semibold tabular-nums ${grossMargin >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                {grossMargin.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Expenses */}
          <div className="py-3">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Operating Expenses</p>
            {Object.entries(data.expenseByCategory).length === 0 ? (
              <p className="text-sm text-muted-foreground pl-2 py-1">No expenses recorded</p>
            ) : (
              Object.entries(data.expenseByCategory).map(([cat, amt]) => (
                <PLRow key={cat} label={cat || 'Uncategorized'} value={-(amt as number)} indent positive={false} />
              ))
            )}
            <PLRow label="Total Expenses" value={-data.expenses} bold separator />
          </div>

          {/* Bottom line */}
          <div className="pt-3">
            <div className={`flex items-center justify-between p-4 rounded-xl ${data.operatingProfit >= 0 ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
              <span className="font-bold text-foreground">Operating {data.operatingProfit >= 0 ? 'Profit' : 'Loss'}</span>
              <span className={`text-xl font-bold tabular-nums font-mono ${data.operatingProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                {formatCurrency(data.operatingProfit)}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Additional info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard label="Tax Collected" value={formatCurrency(data.taxCollected)} icon={Receipt} colorClass="text-amber-600 dark:text-amber-400" bgClass="bg-amber-500/10" delay={0.1} />
        <StatCard label="Total Purchases" value={formatCurrency(data.totalPurchases)} icon={Package} colorClass="text-blue-600 dark:text-blue-400" bgClass="bg-blue-500/10" delay={0.15} />
      </div>
    </div>
  );
}

// ─── Tax Report Tab ───────────────────────────────────────────────────────────

function TaxReportTab({ startDate, endDate }: { startDate: Date; endDate: Date }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getTaxReport(startDate, endDate)
      .then(setData)
      .catch(() => toast.error('Failed to load tax report'))
      .finally(() => setLoading(false));
  }, [startDate, endDate]);

  const handleExport = () => {
    if (!data) return;
    const rows = [
      { Metric: 'Total Tax Collected', Value: data.totalTaxCollected.toFixed(2) },
      { Metric: 'Taxable Revenue', Value: data.taxableRevenue.toFixed(2) },
      { Metric: 'Effective Tax Rate', Value: data.taxableRevenue > 0 ? ((data.totalTaxCollected / data.taxableRevenue) * 100).toFixed(2) + '%' : '0%' },
      { Metric: 'Transaction Count', Value: data.transactionCount },
      ...Object.entries(data.byMethod).map(([method, amt]) => ({ Metric: `Tax by ${method}`, Value: (amt as number).toFixed(2) })),
    ];
    exportToCSV(rows, 'tax-report');
  };

  const effectiveRate = data && data.taxableRevenue > 0 ? (data.totalTaxCollected / data.taxableRevenue) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard label="Total Tax Collected" value={formatCurrency(data?.totalTaxCollected ?? 0)} icon={Receipt} colorClass="text-amber-600 dark:text-amber-400" bgClass="bg-amber-500/10" delay={0} />
            <StatCard label="Taxable Revenue" value={formatCurrency(data?.taxableRevenue ?? 0)} icon={TrendingUp} colorClass="text-emerald-600 dark:text-emerald-400" bgClass="bg-emerald-500/10" delay={0.05} />
            <StatCard label="Effective Tax Rate" value={`${effectiveRate.toFixed(2)}%`} icon={BarChart3} colorClass="text-blue-600 dark:text-blue-400" bgClass="bg-blue-500/10" delay={0.1} sub={`${data?.transactionCount ?? 0} transactions`} />
          </>
        )}
      </div>

      {/* Breakdown by payment method */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-card rounded-2xl border border-border/60 overflow-hidden shadow-sm"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/40 bg-secondary/30">
          <h3 className="font-semibold text-foreground text-sm">Tax by Payment Method</h3>
          <ExportButton onClick={handleExport} />
        </div>
        {loading ? (
          <TableSkeleton rows={3} cols={2} />
        ) : !data || Object.keys(data.byMethod).length === 0 ? (
          <EmptyState />
        ) : (
          <div className="divide-y divide-border/30">
            {Object.entries(data.byMethod).map(([method, amt], i) => (
              <motion.div
                key={method}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center justify-between px-5 py-4 hover:bg-secondary/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <span className="text-sm font-medium text-foreground capitalize">{method}</span>
                </div>
                <span className="text-sm font-semibold text-amber-600 dark:text-amber-400 tabular-nums">{formatCurrency(amt as number)}</span>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ─── Inventory Aging Tab ──────────────────────────────────────────────────────

function InventoryAgingTab() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState<30 | 60 | 90>(30);

  const load = useCallback((d: number) => {
    setLoading(true);
    getInventoryAging(d)
      .then(setData)
      .catch((err) => {
        console.error('Inventory aging error:', err);
        toast.error(err?.message?.includes('index')
          ? 'Missing Firestore index. Check console for the creation link.'
          : 'Failed to load inventory aging');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(days); }, [days, load]);

  const totalValue = data.reduce((s, r) => s + r.value, 0);

  const handleExport = () => {
    exportToCSV(
      data.map(r => ({
        'Item Name': r.name,
        Quantity: r.quantity,
        'Value at Risk': r.value.toFixed(2),
        'Days Not Sold': r.daysStagnant,
        'Last Sold': r.lastSold ? r.lastSold.toLocaleDateString() : 'Never',
      })),
      `inventory-aging-${days}d`
    );
  };

  return (
    <div className="space-y-4">
      {/* Days filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Stagnant for:</span>
        {([30, 60, 90] as const).map(d => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${days === d ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80 text-foreground'}`}
          >
            {d} days
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard label="Stagnant Items" value={data.length} icon={Archive} colorClass="text-amber-600 dark:text-amber-400" bgClass="bg-amber-500/10" delay={0} sub={`Not sold in ${days}+ days`} />
            <StatCard label="Total Value at Risk" value={formatCurrency(totalValue)} icon={TrendingUp} colorClass="text-red-500" bgClass="bg-red-500/10" delay={0.05} />
          </>
        )}
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card rounded-2xl border border-border/60 overflow-hidden shadow-sm"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/40 bg-secondary/30">
          <h3 className="font-semibold text-foreground text-sm">Stagnant Inventory</h3>
          <ExportButton onClick={handleExport} />
        </div>
        {loading ? (
          <TableSkeleton rows={5} cols={4} />
        ) : data.length === 0 ? (
          <EmptyState message={`No stagnant items found for ${days}+ days`} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[480px]">
              <thead>
                <tr className="bg-secondary/30 border-b border-border/40">
                  <th className="px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Item Name</th>
                  <th className="px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Qty</th>
                  <th className="px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Value</th>
                  <th className="px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Days Not Sold</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {data.map((row, i) => (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="hover:bg-secondary/20 transition-colors"
                  >
                    <td className="px-5 py-3 text-sm font-medium text-foreground">{row.name}</td>
                    <td className="px-5 py-3 text-sm text-right text-muted-foreground">{row.quantity.toLocaleString()}</td>
                    <td className="px-5 py-3 text-sm text-right font-semibold text-red-500">{formatCurrency(row.value)}</td>
                    <td className="px-5 py-3 text-sm text-right">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold">
                        {row.daysStagnant}+ days
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ─── Customer Aging Tab ───────────────────────────────────────────────────────

function CustomerAgingTab() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getCustomerCreditAging()
      .then(setData)
      .catch(() => toast.error('Failed to load customer aging'))
      .finally(() => setLoading(false));
  }, []);

  const totalOwed = data.reduce((s, r) => s + (r.outstanding_balance || 0), 0);

  const handleExport = () => {
    exportToCSV(
      data.map(r => ({
        'Customer Name': r.name,
        Phone: r.phone || '',
        'Outstanding Balance': (r.outstanding_balance || 0).toFixed(2),
      })),
      'customer-aging'
    );
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard label="Customers with Balance" value={data.length} icon={Users} colorClass="text-blue-600 dark:text-blue-400" bgClass="bg-blue-500/10" delay={0} />
            <StatCard label="Total Owed to You" value={formatCurrency(totalOwed)} icon={TrendingUp} colorClass="text-emerald-600 dark:text-emerald-400" bgClass="bg-emerald-500/10" delay={0.05} />
          </>
        )}
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card rounded-2xl border border-border/60 overflow-hidden shadow-sm"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/40 bg-secondary/30">
          <h3 className="font-semibold text-foreground text-sm">Customer Credit Balances</h3>
          <ExportButton onClick={handleExport} />
        </div>
        {loading ? (
          <TableSkeleton rows={5} cols={4} />
        ) : data.length === 0 ? (
          <EmptyState message="No customers with outstanding balances" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[480px]">
              <thead>
                <tr className="bg-secondary/30 border-b border-border/40">
                  <th className="px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Customer Name</th>
                  <th className="px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Phone</th>
                  <th className="px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Outstanding Balance</th>
                  <th className="px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider text-center">Ledger</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {data.map((row, i) => (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="hover:bg-secondary/20 transition-colors"
                  >
                    <td className="px-5 py-3 text-sm font-medium text-foreground">{row.name}</td>
                    <td className="px-5 py-3 text-sm text-muted-foreground">{row.phone || '—'}</td>
                    <td className="px-5 py-3 text-sm text-right font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {formatCurrency(row.outstanding_balance || 0)}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <Link
                        to={`/customers/${row.id}/ledger`}
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                      >
                        View <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ─── Vendor Aging Tab ─────────────────────────────────────────────────────────

function VendorAgingTab() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getVendorPaymentAging()
      .then(setData)
      .catch(() => toast.error('Failed to load vendor aging'))
      .finally(() => setLoading(false));
  }, []);

  const totalOwed = data.reduce((s, r) => s + (r.outstanding_balance || 0), 0);

  const handleExport = () => {
    exportToCSV(
      data.map(r => ({
        'Vendor Name': r.name,
        Company: r.company_name || '',
        'Outstanding Balance': (r.outstanding_balance || 0).toFixed(2),
      })),
      'vendor-aging'
    );
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard label="Vendors with Balance" value={data.length} icon={Building2} colorClass="text-purple-600 dark:text-purple-400" bgClass="bg-purple-500/10" delay={0} />
            <StatCard label="Total You Owe" value={formatCurrency(totalOwed)} icon={TrendingUp} colorClass="text-red-500" bgClass="bg-red-500/10" delay={0.05} />
          </>
        )}
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card rounded-2xl border border-border/60 overflow-hidden shadow-sm"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/40 bg-secondary/30">
          <h3 className="font-semibold text-foreground text-sm">Vendor Payment Balances</h3>
          <ExportButton onClick={handleExport} />
        </div>
        {loading ? (
          <TableSkeleton rows={5} cols={4} />
        ) : data.length === 0 ? (
          <EmptyState message="No vendors with outstanding balances" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[480px]">
              <thead>
                <tr className="bg-secondary/30 border-b border-border/40">
                  <th className="px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Vendor Name</th>
                  <th className="px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Company</th>
                  <th className="px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Outstanding Balance</th>
                  <th className="px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider text-center">Ledger</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {data.map((row, i) => (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="hover:bg-secondary/20 transition-colors"
                  >
                    <td className="px-5 py-3 text-sm font-medium text-foreground">{row.name}</td>
                    <td className="px-5 py-3 text-sm text-muted-foreground">{row.company_name || '—'}</td>
                    <td className="px-5 py-3 text-sm text-right font-semibold text-red-500 tabular-nums">
                      {formatCurrency(row.outstanding_balance || 0)}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <Link
                        to={`/vendors/${row.id}/ledger`}
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                      >
                        View <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ─── Main ReportsPage ─────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('sales-product');
  const [fromDate, setFromDate] = useState(getMonthStart());
  const [toDate, setToDate] = useState(getToday());
  const [refreshKey, setRefreshKey] = useState(0);

  const startDate = parseDate(fromDate, false);
  const endDate = parseDate(toDate, true);

  const handleRefresh = () => setRefreshKey(k => k + 1);

  const isDateRangeTab = !['inventory-aging', 'customer-aging', 'vendor-aging'].includes(activeTab);

  return (
    <div className="space-y-5">
      {/* ── Page Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="app-page-title flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary flex-shrink-0" />
            Reports
          </h1>
          <p className="app-page-subtitle">Financial insights, aging analysis, and business intelligence</p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {isDateRangeTab && (
            <>
              <div className="flex items-center gap-1.5">
                <label className="text-xs text-muted-foreground font-medium hidden sm:block">From</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={e => setFromDate(e.target.value)}
                  className="h-9 px-3 rounded-xl bg-card border border-border/60 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <label className="text-xs text-muted-foreground font-medium hidden sm:block">To</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={e => setToDate(e.target.value)}
                  className="h-9 px-3 rounded-xl bg-card border border-border/60 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                />
              </div>
            </>
          )}
          <button
            onClick={handleRefresh}
            className="h-9 w-9 rounded-xl bg-card border border-border/60 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-all"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {/* ── Tab Bar ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.3 }}
        className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide"
      >
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-card border border-border/60 text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </motion.div>

      {/* ── Tab Content ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${activeTab}-${refreshKey}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'sales-product' && (
            <SalesByProductTab key={`sp-${refreshKey}`} startDate={startDate} endDate={endDate} />
          )}
          {activeTab === 'sales-category' && (
            <SalesByCategoryTab key={`sc-${refreshKey}`} startDate={startDate} endDate={endDate} />
          )}
          {activeTab === 'pnl' && (
            <PLStatementTab key={`pnl-${refreshKey}`} startDate={startDate} endDate={endDate} />
          )}
          {activeTab === 'tax' && (
            <TaxReportTab key={`tax-${refreshKey}`} startDate={startDate} endDate={endDate} />
          )}
          {activeTab === 'inventory-aging' && (
            <InventoryAgingTab key={`ia-${refreshKey}`} />
          )}
          {activeTab === 'customer-aging' && (
            <CustomerAgingTab key={`ca-${refreshKey}`} />
          )}
          {activeTab === 'vendor-aging' && (
            <VendorAgingTab key={`va-${refreshKey}`} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}


