import { motion } from 'framer-motion';
import { PieChart } from 'lucide-react';
import { EXPENSE_CATEGORIES } from '../../lib/types';
import { formatCurrency } from '../../lib/utils/notifications';

interface CategoryItem {
  category: string;
  amount: number;
}

interface ExpenseBreakdownWidgetProps {
  breakdown: CategoryItem[];
  total: number;
  isLoading?: boolean;
}

const COLORS = [
  'bg-purple-500', 'bg-blue-500', 'bg-emerald-500',
  'bg-orange-500', 'bg-rose-500', 'bg-indigo-500',
  'bg-yellow-500', 'bg-red-500', 'bg-sky-500',
];

const COLOR_TEXT = [
  'text-purple-500', 'text-blue-500', 'text-emerald-500',
  'text-orange-500', 'text-rose-500', 'text-indigo-500',
  'text-yellow-500', 'text-red-500', 'text-sky-500',
];

export default function ExpenseBreakdownWidget({ breakdown, total, isLoading }: ExpenseBreakdownWidgetProps) {
  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl border border-border/60 p-5 animate-pulse">
        <div className="h-4 w-36 bg-secondary rounded mb-4" />
        <div className="space-y-3">
          {[0,1,2,3].map(i => <div key={i} className="h-8 bg-secondary rounded-xl" />)}
        </div>
      </div>
    );
  }

  const top = breakdown.slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-foreground">Expense Breakdown</h3>
        <span className="text-xs font-semibold text-muted-foreground tabular-nums">
          {formatCurrency(total)} total
        </span>
      </div>

      {top.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">No expenses this period</p>
      ) : (
        <div className="space-y-3">
          {top.map((cat, i) => {
            const meta = EXPENSE_CATEGORIES.find(c => c.value === cat.category);
            const pct = total > 0 ? (cat.amount / total) * 100 : 0;
            return (
              <div key={cat.category}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <span>{meta?.icon}</span>
                    <span className="truncate max-w-[120px]">{meta?.label ?? cat.category}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground/60">{pct.toFixed(0)}%</span>
                    <span className={`font-semibold tabular-nums ${COLOR_TEXT[i % COLOR_TEXT.length]}`}>
                      {formatCurrency(cat.amount)}
                    </span>
                  </div>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${COLORS[i % COLORS.length]}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.7, ease: 'easeOut', delay: i * 0.08 }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
