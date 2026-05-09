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

const COLOR_RING = [
  'ring-purple-500/30', 'ring-blue-500/30', 'ring-emerald-500/30',
  'ring-orange-500/30', 'ring-rose-500/30', 'ring-indigo-500/30',
  'ring-yellow-500/30', 'ring-red-500/30', 'ring-sky-500/30',
];

export default function ExpenseBreakdownWidget({ breakdown, total, isLoading }: ExpenseBreakdownWidgetProps) {
  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl border border-border/60 p-5 animate-pulse">
        <div className="h-4 w-36 bg-secondary rounded mb-4" />
        <div className="space-y-3">
          {[0,1,2,3].map(i => <div key={i} className="h-10 bg-secondary rounded-xl" />)}
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
      whileHover={{ y: -2 }}
      className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm hover:shadow-md transition-shadow duration-300 relative overflow-hidden"
    >
      {/* Subtle gradient accent */}
      <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-purple-500/40 via-primary/20 to-emerald-500/40" />

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <PieChart className="w-4 h-4 text-muted-foreground" />
          Expense Breakdown
        </h3>
        <span className="text-xs font-semibold text-muted-foreground tabular-nums">
          {formatCurrency(total)} total
        </span>
      </div>

      {top.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">No expenses this period</p>
      ) : (
        <div className="space-y-3.5">
          {top.map((cat, i) => {
            const meta = EXPENSE_CATEGORIES.find(c => c.value === cat.category);
            const pct = total > 0 ? (cat.amount / total) * 100 : 0;
            return (
              <motion.div
                key={cat.category}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.06, duration: 0.3 }}
                className="group"
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <span className={`w-5 h-5 rounded-full ring-2 ${COLOR_RING[i % COLOR_RING.length]} flex items-center justify-center text-[10px]`}>
                      {meta?.icon}
                    </span>
                    <span className="truncate max-w-[100px] font-medium">{meta?.label ?? cat.category}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground/60 text-[10px]">{pct.toFixed(0)}%</span>
                    <span className={`font-semibold tabular-nums ${COLOR_TEXT[i % COLOR_TEXT.length]}`}>
                      {formatCurrency(cat.amount)}
                    </span>
                  </div>
                </div>
                <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${COLORS[i % COLORS.length]}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.7, ease: 'easeOut', delay: 0.2 + i * 0.08 }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
