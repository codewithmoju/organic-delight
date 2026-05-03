import { format, subDays } from 'date-fns';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, Plus, PieChart, Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Expense, ExpenseCategory, EXPENSE_CATEGORIES } from '../../lib/types';
import {
  getExpenses,
  recordExpense,
  updateExpense,
  deleteExpense,
  getExpenseSummary,
} from '../../lib/api/expenses';
import { formatCurrency } from '../../lib/utils/notifications';
import { useAuthStore } from '../../lib/store';
import { toast } from 'sonner';
import ExpenseSkeleton from '../../components/skeletons/ExpenseSkeleton';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import CustomSelect from '../../components/ui/CustomSelect';
import SearchInput from '../../components/ui/SearchInput';

// Expense-specific components
import ExpenseForm from '../../components/expenses/ExpenseForm';
import ExpenseList from '../../components/expenses/ExpenseList';
import ExpenseCategoryBreakdown from '../../components/expenses/ExpenseCategoryBreakdown';
import ExpenseDateFilter, { DateRange } from '../../components/expenses/ExpenseDateFilter';
import ExpenseCategoryForm from '../../components/expenses/ExpenseCategoryForm';
import ExportMenu from '../../components/ui/ExportMenu';
import { readScopedRaw, writeScopedJSON } from '../../lib/utils/storageScope';

// ============================================
// STAT CARD
// ============================================
function StatCard({
  icon: Icon,
  label,
  value,
  accent,
  delay = 0,
}: {
  icon: any;
  label: string;
  value: string;
  accent: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      className="group relative overflow-hidden rounded-2xl bg-card border border-border/60 p-4 sm:p-5 hover:shadow-md transition-all duration-300"
    >
      <div
        className={`absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl opacity-15 group-hover:opacity-25 transition-opacity ${accent}`}
      />
      <div className="relative flex items-center gap-3">
        <div className={`p-2.5 rounded-xl ${accent} bg-opacity-10 flex-shrink-0`}>
          <Icon className={`w-5 h-5 ${accent.replace('bg-', 'text-')}`} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground truncate">{label}</p>
          <h3 className="text-lg sm:text-xl font-bold text-foreground mt-0.5 tracking-tight tabular-nums truncate">
            {value}
          </h3>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// MAIN PAGE
// ============================================
export default function Expenses() {
  const { t } = useTranslation();
  const profile = useAuthStore(state => state.profile);

  // ── State ──────────────────────────────────────────────────────────────
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try {
      const cached = localStorage.getItem('expenses_cache');
      if (cached) {
        return JSON.parse(cached, (key, value) => {
          if (['created_at', 'updated_at', 'expense_date'].includes(key)) return new Date(value);
          return value;
        });
      }
    } catch {
      /* ignore */
    }
    return [];
  });

  const [summary, setSummary] = useState<{
    totalExpenses: number;
    expenseCount: number;
    categoryBreakdown: { category: string; amount: number }[];
  } | null>(null);

  const [isLoading, setIsLoading] = useState(() => readScopedRaw('expenses_cache', 'expenses_cache') == null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form visibility
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });

  // Delete confirm
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);

  // Category form
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
  const [activeCategories, setActiveCategories] = useState<ExpenseCategory[]>([]);

  // ── Data loading ───────────────────────────────────────────────────────
  useEffect(() => {
    loadData(!expenses.length);
  }, [dateRange]);

  const loadData = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const data = await getExpenses(dateRange.from, dateRange.to);
      setExpenses(data);
      writeScopedJSON('expenses_cache', data);

      const summaryData = await getExpenseSummary(dateRange.from, dateRange.to);
      setSummary(summaryData);
    } catch (error) {
      console.error('Error loading expenses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Add expense ────────────────────────────────────────────────────────
  const handleAddExpense = async (formData: {
    category: ExpenseCategory;
    description: string;
    amount: number;
    payment_method: 'cash' | 'bank_transfer' | 'digital';
    expense_date: Date;
    reference_number?: string;
    notes?: string;
  }) => {
    setIsSubmitting(true);
    try {
      // Get the real record back (with Firestore ID) before updating UI
      const saved = await recordExpense({ ...formData, created_by: profile?.id || 'unknown' });
      setExpenses(prev => [saved, ...prev]);
      setIsFormOpen(false);
      toast.success(t('expenses.addSuccess', 'Expense recorded successfully'));
      // Refresh summary in background
      loadData(false);
    } catch (error) {
      console.error('Error recording expense:', error);
      toast.error(t('expenses.addError', 'Failed to record expense. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Edit expense ───────────────────────────────────────────────────────
  const handleEditExpense = async (formData: {
    category: ExpenseCategory;
    description: string;
    amount: number;
    payment_method: 'cash' | 'bank_transfer' | 'digital';
    expense_date: Date;
    reference_number?: string;
    notes?: string;
  }) => {
    if (!editingExpense) return;

    // Guard: temp IDs haven't been persisted yet — shouldn't happen now but safety net
    if (editingExpense.id.startsWith('temp_')) {
      toast.error('This record is still saving. Please wait a moment and try again.');
      return;
    }

    setIsSubmitting(true);
    const previousExpenses = [...expenses];

    // Optimistic update in UI
    const updated: Expense = { ...editingExpense, ...formData };
    setExpenses(prev => prev.map(e => (e.id === editingExpense.id ? updated : e)));
    setEditingExpense(null);

    try {
      await updateExpense(editingExpense.id, formData);
      toast.success(t('expenses.updateSuccess', 'Expense updated successfully'));
      loadData(false);
    } catch (error) {
      console.error('Error updating expense:', error);
      // Revert UI and re-open form
      setExpenses(previousExpenses);
      setEditingExpense(editingExpense);
      toast.error(t('expenses.updateError', 'Failed to update expense. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEdit = (expense: Expense) => {
    setIsFormOpen(false);
    setEditingExpense(expense);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingExpense(null);
  };

  // ── Delete expense ─────────────────────────────────────────────────────
  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (id.startsWith('temp_')) {
      toast.error('This record is still saving. Please wait a moment and try again.');
      return;
    }
    setExpenseToDelete(id);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!expenseToDelete) return;
    const id = expenseToDelete;
    setIsDeleteConfirmOpen(false);
    setExpenseToDelete(null);

    try {
      await deleteExpense(id);
      setExpenses(prev => prev.filter(e => e.id !== id));
      toast.success(t('expenses.deleteSuccess', 'Expense deleted successfully'));
      loadData(false);
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error(t('expenses.deleteError', 'Failed to delete expense'));
    }
  };

  // ── Filtered list ──────────────────────────────────────────────────────
  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === 'all' || expense.category === categoryFilter;
    const matchesActiveCategories =
      activeCategories.length === 0 || activeCategories.includes(expense.category);
    return matchesSearch && matchesCategory && matchesActiveCategories;
  });

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 sm:space-y-6 pb-10">
      {isLoading ? (
        <ExpenseSkeleton />
      ) : (
        <>
          {/* ─── HEADER ─── */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="app-page-title">{t('expenses.title', 'Expenses')}</h1>
              <p className="app-page-subtitle">
                {t('expenses.subtitle', 'Manage and track your business spending')}
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                setEditingExpense(null);
                setIsFormOpen(v => !v);
              }}
              className="btn-primary flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold"
            >
              <Plus className="w-4 h-4" />
              {t('expenses.recordExpense', 'Record Expense')}
            </motion.button>
            <ExportMenu
              getData={() => filteredExpenses.map(e => ({
                Date: new Date(e.expense_date).toLocaleDateString(),
                Description: e.description,
                Category: e.category,
                Amount: e.amount,
                'Payment Method': e.payment_method,
                Reference: e.reference_number || '',
                Notes: e.notes || '',
              }))}
              filename="expenses"
              title="Expense Report"
            />
          </div>

          {/* ─── DATE FILTER ─── */}
          <ExpenseDateFilter value={dateRange} onChange={setDateRange} />

          {/* ─── STATS ─── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <StatCard
              icon={DollarSign}
              label={t('expenses.stats.total', 'Total Expenses')}
              value={summary ? formatCurrency(summary.totalExpenses) : formatCurrency(0)}
              accent="bg-error-500"
              delay={0.05}
            />
            <StatCard
              icon={PieChart}
              label={t('expenses.stats.count', 'Transaction Count')}
              value={summary?.expenseCount?.toString() ?? '0'}
              accent="bg-primary"
              delay={0.1}
            />
            <StatCard
              icon={Wallet}
              label={t('expenses.stats.topCategory', 'Top Category')}
              value={
                summary?.categoryBreakdown?.[0]
                  ? t(
                      `expenses.categories.${summary.categoryBreakdown[0].category}`,
                      EXPENSE_CATEGORIES.find(
                        c => c.value === summary.categoryBreakdown[0].category
                      )?.label ?? 'N/A'
                    )
                  : 'N/A'
              }
              accent="bg-purple-500"
              delay={0.15}
            />
          </div>

          {/* ─── ADD FORM ─── */}
          <AnimatePresence>
            {isFormOpen && (
              <ExpenseForm
                isSubmitting={isSubmitting}
                onSubmit={handleAddExpense}
                onCancel={closeForm}
              />
            )}
          </AnimatePresence>

          {/* ─── EDIT FORM ─── */}
          <AnimatePresence>
            {editingExpense && (
              <ExpenseForm
                key={editingExpense.id}
                initialData={editingExpense}
                isSubmitting={isSubmitting}
                onSubmit={handleEditExpense}
                onCancel={closeForm}
              />
            )}
          </AnimatePresence>

          {/* ─── MAIN CONTENT ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="lg:col-span-3 space-y-4">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <SearchInput
                  placeholder={t('common.search', 'Search expenses...')}
                  value={searchTerm}
                  onChange={setSearchTerm}
                  className="flex-1"
                />
                <div className="w-full sm:w-52">
                  <CustomSelect
                    value={categoryFilter}
                    onChange={setCategoryFilter}
                    options={[
                      { value: 'all', label: t('common.allCategories', 'All Categories') },
                      ...EXPENSE_CATEGORIES.map(cat => ({
                        value: cat.value,
                        label: t(`expenses.categories.${cat.value}`, cat.label),
                        icon: <span className="text-base">{cat.icon}</span>,
                      })),
                    ]}
                  />
                </div>
              </div>

              {/* List */}
              <div className="bg-card rounded-2xl border border-border/60 overflow-hidden shadow-sm">
                {filteredExpenses.length === 0 && expenses.length > 0 ? (
                  <div className="py-10 text-center text-sm text-muted-foreground">
                    {t('expenses.noMatch', 'No expenses match your search')}
                  </div>
                ) : (
                  <ExpenseList
                    expenses={filteredExpenses}
                    onEdit={openEdit}
                    onDelete={handleDeleteClick}
                  />
                )}
              </div>
            </div>

            {/* Sidebar breakdown */}
            <div>
              <ExpenseCategoryBreakdown
                breakdown={summary?.categoryBreakdown ?? []}
                total={summary?.totalExpenses ?? 0}
                activeCategoryFilter={categoryFilter}
                onCategoryClick={cat => setCategoryFilter(cat)}
              />
            </div>
          </div>

          {/* Delete confirm */}
          <ConfirmDialog
            isOpen={isDeleteConfirmOpen}
            title={t('expenses.deleteTitle', 'Delete Expense')}
            message={t('expenses.confirmDelete', 'Are you sure you want to delete this expense?')}
            confirmText={t('common.delete', 'Delete')}
            variant="danger"
            onConfirm={confirmDelete}
            onCancel={() => setIsDeleteConfirmOpen(false)}
          />

          {/* Category form */}
          <AnimatePresence>
            {isCategoryFormOpen && (
              <ExpenseCategoryForm
                activeCategories={activeCategories}
                onChange={cats => setActiveCategories(cats)}
                onClose={() => setIsCategoryFormOpen(false)}
              />
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
