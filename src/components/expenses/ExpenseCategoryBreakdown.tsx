import { motion } from 'framer-motion';
import { PieChart, SlidersHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { EXPENSE_CATEGORIES, ExpenseCategory } from '../../lib/types';
import { formatCurrency } from '../../lib/utils/notifications';

interface CategoryBreakdownItem {
  category: string;
  amount: number;
}

interface ExpenseCategoryBreakdownProps {
  breakdown: CategoryBreakdownItem[];
  total: number;
  activeCategoryFilter?: string;
  onCategoryClick?: (category: string) => void;
}

const ACCENT_COLORS = [
  'from-purple-500 to-primary',
  'from-blue-500 to-cyan-400',
  'from-emerald-500 to-teal-400',
  'from-orange-500 to-amber-400',
  'from-rose-500 to-pink-400',
  'from-indigo-500 to-violet-400',
  'from-yellow-500 to-lime-400',
  'from-red-500 to-orange-400',
  'from-sky-500 to-blue-400',
];

export default function ExpenseCategoryBreakdown({ breakdown, total, activeCategoryFilter, onCategoryClick }: ExpenseCategoryBreakdownProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-card rounded-2xl border border-border/60 p-4 sm:p-5 shadow-sm lg:sticky lg:top-6">
      <h3 className="text-sm sm:text-base font-bold text-foreground mb-4 flex items-center gap-2">
        <PieChart className="w-4 h-4 text-purple-500" />
        {t('expenses.breakdown', 'Category Breakdown')}
        {activeCategoryFilter && activeCategoryFilter !== 'all' && (
          <span className="ml-auto text-xs text-primary font-medium">filtered</span>
        )}
      </h3>

      {breakdown.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-3">
          {t('expenses.noBreakdown', 'No data to display')}
        </p>
      ) : (
        <div className="space-y-3.5">
          {breakdown.map((cat, i) => {
            const categoryMeta = EXPENSE_CATEGORIES.find(c => c.value === cat.category);
            const pct = total > 0 ? (cat.amount / total) * 100 : 0;
            const isFiltered = activeCategoryFilter === cat.category;
            return (
              <motion.div
                key={cat.category}
                className={`space-y-1.5 cursor-pointer rounded-xl p-1.5 -mx-1.5 transition-all ${
                  isFiltered ? 'bg-primary/10 ring-1 ring-primary/20' : 'hover:bg-secondary/50'
                } ${activeCategoryFilter && activeCategoryFilter !== 'all' && !isFiltered ? 'opacity-40' : ''}`}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.08 }}
                onClick={() => onCategoryClick?.(isFiltered ? 'all' : cat.category)}
                title={`Click to filter by ${categoryMeta?.label ?? cat.category}`}
              >
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-muted-foreground flex items-center gap-1.5 truncate">
                    {categoryMeta?.icon}
                    <span className="truncate">
                      {t(`expenses.categories.${cat.category}`, categoryMeta?.label ?? cat.category)}
                    </span>
                  </span>
                  <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                    <span className="text-muted-foreground/60">{pct.toFixed(1)}%</span>
                    <span className="text-foreground font-semibold tabular-nums">
                      {formatCurrency(cat.amount)}
                    </span>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full bg-gradient-to-r ${ACCENT_COLORS[i % ACCENT_COLORS.length]} rounded-full`}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
              </motion.div>
            );
          })}

          {/* Total row */}
          <div className="pt-3 mt-1 border-t border-border/40 flex justify-between text-sm font-bold">
            <span className="text-foreground">{t('common.total', 'Total')}</span>
            <span className="text-error-500 tabular-nums">{formatCurrency(total)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
