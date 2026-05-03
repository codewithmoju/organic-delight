import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Wallet, ArrowUpRight, CreditCard, Trash2, Pencil, DollarSign } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Expense, EXPENSE_CATEGORIES } from '../../lib/types';
import { formatCurrency } from '../../lib/utils/notifications';

interface ExpenseListProps {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
}

const METHOD_ICON: Record<string, React.ReactNode> = {
  cash: <Wallet className="w-3.5 h-3.5" />,
  bank_transfer: <ArrowUpRight className="w-3.5 h-3.5" />,
  digital: <CreditCard className="w-3.5 h-3.5" />,
};

export default function ExpenseList({ expenses, onEdit, onDelete }: ExpenseListProps) {
  const { t } = useTranslation();

  if (expenses.length === 0) {
    return (
      <div className="py-12 sm:py-16 text-center px-6">
        <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center mx-auto mb-3">
          <DollarSign className="w-8 h-8 text-muted-foreground/40" />
        </div>
        <h3 className="text-base font-semibold text-foreground">{t('expenses.noExpenses', 'No expenses yet')}</h3>
        <p className="text-muted-foreground text-sm mt-1">
          {t('expenses.noExpensesHint', 'Record your first expense to get started')}
        </p>
      </div>
    );
  }

  return (
    <>
      {/* ── Mobile card list (< sm) ── */}
      <div className="sm:hidden divide-y divide-border/30">
        <AnimatePresence>
          {expenses.map((expense, index) => (
            <motion.div
              key={expense.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ delay: index * 0.04 }}
              className="flex items-start gap-3 px-4 py-3"
            >
              <div className="w-9 h-9 rounded-xl bg-secondary/50 flex items-center justify-center text-base flex-shrink-0 mt-0.5">
                {EXPENSE_CATEGORIES.find(c => c.value === expense.category)?.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{expense.description}</p>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(expense.expense_date).toLocaleDateString()}
                  </span>
                  <span className="capitalize">{expense.payment_method.replace('_', ' ')}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <span className="text-sm font-bold text-error-500 tabular-nums">
                  {formatCurrency(expense.amount)}
                </span>
                <button
                  onClick={() => onEdit(expense)}
                  className="p-1.5 text-muted-foreground/50 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                  title={t('common.edit', 'Edit')}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={e => onDelete(expense.id, e)}
                  className="p-1.5 text-muted-foreground/50 hover:text-error-500 hover:bg-error-500/10 rounded-lg transition-all"
                  title={t('common.delete', 'Delete')}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ── Desktop table (≥ sm) ── */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-secondary/30 border-b border-border/40">
              <th className="px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t('expenses.table.expense', 'Expense')}
              </th>
              <th className="px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t('expenses.table.category', 'Category')}
              </th>
              <th className="px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t('expenses.table.date', 'Date')}
              </th>
              <th className="px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                {t('expenses.table.method', 'Method')}
              </th>
              <th className="px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">
                {t('expenses.table.amount', 'Amount')}
              </th>
              <th className="px-5 py-3.5 w-20" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            <AnimatePresence>
              {expenses.map((expense, index) => (
                <motion.tr
                  key={expense.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ delay: index * 0.04 }}
                  className="group hover:bg-secondary/30 transition-colors"
                >
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-foreground text-sm">{expense.description}</p>
                    {expense.reference_number && (
                      <p className="text-xs text-muted-foreground mt-0.5">Ref: {expense.reference_number}</p>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-secondary/60 text-xs font-medium text-foreground border border-border/40">
                      {EXPENSE_CATEGORIES.find(c => c.value === expense.category)?.icon}
                      {t(`expenses.categories.${expense.category}`, EXPENSE_CATEGORIES.find(c => c.value === expense.category)?.label ?? expense.category)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground whitespace-nowrap">
                      <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                      {new Date(expense.expense_date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 hidden lg:table-cell">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground capitalize">
                      {METHOD_ICON[expense.payment_method]}
                      {t(`expenses.form.methods.${expense.payment_method}`, expense.payment_method.replace('_', ' '))}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className="text-error-500 font-bold font-mono tracking-tight tabular-nums">
                      {formatCurrency(expense.amount)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onEdit(expense)}
                        className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                        title={t('common.edit', 'Edit')}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={e => onDelete(expense.id, e)}
                        className="p-1.5 text-muted-foreground hover:text-error-500 hover:bg-error-500/10 rounded-lg transition-all"
                        title={t('common.delete', 'Delete')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </>
  );
}
