import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatCurrency } from '../../lib/utils/notifications';

interface ProfitLossWidgetProps {
  revenue: number;
  expenses: number;
  purchases: number;
  isLoading?: boolean;
}

export default function ProfitLossWidget({ revenue, expenses, purchases, isLoading }: ProfitLossWidgetProps) {
  const grossProfit = revenue - purchases;
  const netProfit = grossProfit - expenses;
  const margin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
  const isPositive = netProfit >= 0;

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl border border-border/60 p-5 animate-pulse">
        <div className="h-4 w-32 bg-secondary rounded mb-4" />
        <div className="h-8 w-40 bg-secondary rounded mb-3" />
        <div className="space-y-2">
          {[0,1,2].map(i => <div key={i} className="h-3 bg-secondary rounded" />)}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-foreground">Profit & Loss</h3>
        <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg ${
          isPositive ? 'bg-success-500/10 text-success-500' : 'bg-error-500/10 text-error-500'
        }`}>
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {margin.toFixed(1)}% margin
        </span>
      </div>

      {/* Net profit hero */}
      <div className={`text-2xl font-bold tabular-nums mb-4 ${isPositive ? 'text-success-500' : 'text-error-500'}`}>
        {isPositive ? '+' : ''}{formatCurrency(netProfit)}
        <span className="text-xs font-medium text-muted-foreground ml-1">net profit</span>
      </div>

      {/* Breakdown rows */}
      <div className="space-y-2.5">
        {[
          { label: 'Revenue', value: revenue, color: 'text-success-500', sign: '+' },
          { label: 'Purchases (COGS)', value: purchases, color: 'text-error-500', sign: '-' },
          { label: 'Gross Profit', value: grossProfit, color: grossProfit >= 0 ? 'text-primary' : 'text-error-500', sign: grossProfit >= 0 ? '+' : '' },
          { label: 'Expenses', value: expenses, color: 'text-warning-500', sign: '-' },
        ].map(({ label, value, color, sign }) => (
          <div key={label} className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">{label}</span>
            <span className={`font-semibold tabular-nums ${color}`}>
              {sign}{formatCurrency(value)}
            </span>
          </div>
        ))}
        <div className="pt-2 border-t border-border/40 flex justify-between items-center text-sm font-bold">
          <span className="text-foreground">Net Profit</span>
          <span className={`tabular-nums ${isPositive ? 'text-success-500' : 'text-error-500'}`}>
            {isPositive ? '+' : ''}{formatCurrency(netProfit)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
