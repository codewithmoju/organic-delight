import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    DollarSign,
    Plus,
    Trash2,
    ArrowUpRight,
    PieChart,
    Wallet,
    Calendar,

    Filter,
    CreditCard,
    MoreHorizontal
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Expense, ExpenseCategory, EXPENSE_CATEGORIES } from '../../lib/types';
import { getExpenses, recordExpense, deleteExpense, getExpenseSummary } from '../../lib/api/expenses';
import { formatCurrency } from '../../lib/utils/notifications';
import { useAuthStore } from '../../lib/store';
import { toast } from 'sonner';
import ExpenseSkeleton from '../../components/skeletons/ExpenseSkeleton';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import CustomSelect from '../../components/ui/CustomSelect';
import CustomDatePicker from '../../components/ui/CustomDatePicker';
import SearchInput from '../../components/ui/SearchInput';

// ============================================
// STAT CARD COMPONENT
// ============================================
function StatCard({ icon: Icon, label, value, accent, delay = 0 }: {
    icon: any; label: string; value: string; accent: string; delay?: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
            className="group relative overflow-hidden rounded-2xl bg-card border border-border/60 p-4 sm:p-5 hover:shadow-md transition-all duration-300"
        >
            <div className={`absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl opacity-15 group-hover:opacity-25 transition-opacity ${accent}`} />
            <div className="relative flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${accent} bg-opacity-10 flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${accent.replace('bg-', 'text-')}`} />
                </div>
                <div className="min-w-0">
                    <p className="text-xs font-medium text-muted-foreground truncate">{label}</p>
                    <h3 className="text-lg sm:text-xl font-bold text-foreground mt-0.5 tracking-tight tabular-nums truncate">{value}</h3>
                </div>
            </div>
        </motion.div>
    );
}

export default function Expenses() {
    const { t } = useTranslation();
    const profile = useAuthStore(state => state.profile);
    const [expenses, setExpenses] = useState<Expense[]>(() => {
        try {
            const cached = localStorage.getItem('expenses_cache');
            if (cached) {
                return JSON.parse(cached, (key, value) => {
                    if (['created_at', 'updated_at', 'expense_date'].includes(key)) return new Date(value);
                    return value;
                });
            }
        } catch (e) {
            console.error('Failed to parse expenses cache', e);
        }
        return [];
    });
    const [summary, setSummary] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(() => !localStorage.getItem('expenses_cache'));
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAddFormOpen, setIsAddFormOpen] = useState(false);

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');

    const [newExpense, setNewExpense] = useState({
        category: 'miscellaneous' as ExpenseCategory,
        description: '',
        amount: '',
        payment_method: 'cash' as 'cash' | 'bank_transfer' | 'digital',
        expense_date: format(new Date(), 'yyyy-MM-dd')
    });
    // ... 


    useEffect(() => {
        const hasCache = expenses.length > 0;
        loadData(!hasCache);
    }, []);

    const loadData = async (showLoading = true) => {
        if (showLoading) setIsLoading(true);
        try {
            const data = await getExpenses();
            setExpenses(data);
            localStorage.setItem('expenses_cache', JSON.stringify(data));


            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
            const summaryData = await getExpenseSummary(oneMonthAgo, new Date());
            setSummary(summaryData);
        } catch (error) {
            console.error('Error loading expenses:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddExpense = async () => {
        if (!newExpense.description || !newExpense.amount) {
            toast.error(t('expenses.form.error', 'Please fill in all required fields'));
            return;
        }

        setIsSubmitting(true);

        // Optimistic UI Data
        const optimisticId = 'temp_' + Date.now();
        const expenseData: Expense = {
            id: optimisticId,
            ...newExpense,
            amount: parseFloat(newExpense.amount),
            expense_date: new Date(newExpense.expense_date),
            created_by: profile?.id || 'unknown',
            created_at: new Date()
        };

        // 1. Optimistic Update
        const previousExpenses = [...expenses];
        setExpenses(prev => [expenseData, ...prev]);
        setIsAddFormOpen(false);
        setNewExpense({
            category: 'miscellaneous',
            description: '',
            amount: '',
            payment_method: 'cash',
            expense_date: format(new Date(), 'yyyy-MM-dd')
        });
        toast.success(t('expenses.addSuccess', 'Expense recorded successfully'));

        // Cache immediately
        localStorage.setItem('expenses_cache', JSON.stringify([expenseData, ...previousExpenses]));

        try {
            // 2. Real API Call
            await recordExpense(expenseData);

            // 3. Re-fetch to confirm ID and data (background)
            loadData(false);

        } catch (error) {
            console.error('Error recording expense:', error);
            // Revert on real failure
            setExpenses(previousExpenses);
            localStorage.setItem('expenses_cache', JSON.stringify(previousExpenses));
            toast.error(t('expenses.addError', 'Failed to record expense. Please try again.'));
            setIsAddFormOpen(true); // Re-open form so user doesn't lose data
        } finally {
            setIsSubmitting(false);
        }
    };

    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);

    const handleDeleteClick = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
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
            loadData();
            toast.success(t('expenses.deleteSuccess', 'Expense deleted successfully'));
        } catch (error) {
            console.error('Error deleting expense:', error);
            toast.error(t('expenses.deleteError', 'Failed to delete expense'));
        }
    };

    // Filter Logic
    const filteredExpenses = expenses.filter(expense => {
        const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="space-y-4 sm:space-y-6 pb-10">
            {isLoading ? <ExpenseSkeleton /> : (
                <>
                    {/* ─── HEADER ─── */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <h1 className="app-page-title">{t('expenses.title')}</h1>
                            <p className="app-page-subtitle">{t('expenses.subtitle', 'Manage and track your business spending')}</p>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => setIsAddFormOpen(!isAddFormOpen)}
                            className="btn-primary flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold"
                        >
                            <Plus className="w-4 h-4" />
                            {t('expenses.recordExpense')}
                        </motion.button>
                    </div>

                    {/* ─── STATS — 3 cols on sm+ ─── */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                        <StatCard
                            icon={DollarSign}
                            label="Total Expenses (Monthly)"
                            value={summary ? formatCurrency(summary.totalExpenses) : formatCurrency(0)}
                            accent="bg-error-500"
                            delay={0.05}
                        />
                        <StatCard
                            icon={PieChart}
                            label="Transaction Count"
                            value={summary?.expenseCount?.toString() || '0'}
                            accent="bg-primary"
                            delay={0.1}
                        />
                        <StatCard
                            icon={Wallet}
                            label="Top Category"
                            value={summary?.categoryBreakdown?.[0] ? t(`expenses.categories.${summary.categoryBreakdown[0].category}`) : 'N/A'}
                            accent="bg-purple-500"
                            delay={0.15}
                        />
                    </div>

                    {/* ─── ADD EXPENSE FORM ─── */}
                    <AnimatePresence>
                        {isAddFormOpen && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="bg-card rounded-2xl border border-border/60 p-4 sm:p-5 shadow-sm relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-primary/5 to-transparent rounded-bl-full pointer-events-none" />

                                    <div className="flex justify-between items-center mb-4 relative">
                                        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                                            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                                                <Plus className="w-3.5 h-3.5" />
                                            </div>
                                            {t('expenses.recordNew')}
                                        </h3>
                                        <button
                                            onClick={() => setIsAddFormOpen(false)}
                                            className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            <MoreHorizontal className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 relative">
                                        <div className="sm:col-span-2">
                                            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">{t('expenses.form.description')}</label>
                                            <input
                                                type="text"
                                                className="w-full h-11 bg-secondary/50 border border-transparent rounded-xl px-4 text-sm text-foreground focus:bg-background focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all outline-none placeholder:text-muted-foreground/50"
                                                placeholder={t('expenses.form.descPlaceholder', 'e.g. Office Supplies')}
                                                value={newExpense.description}
                                                onChange={e => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
                                                autoFocus
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">{t('expenses.form.amount')}</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none z-10">PKR</span>
                                                <input
                                                    type="number"
                                                    className="w-full h-11 bg-secondary/50 border border-transparent rounded-xl pl-12 pr-4 text-sm text-foreground font-semibold focus:bg-background focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                                                    placeholder="0.00"
                                                    value={newExpense.amount}
                                                    onChange={e => setNewExpense(prev => ({ ...prev, amount: e.target.value }))}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <CustomDatePicker
                                                label={t('expenses.form.date')}
                                                value={newExpense.expense_date}
                                                onChange={(date) => setNewExpense(prev => ({ ...prev, expense_date: format(date, 'yyyy-MM-dd') }))}
                                            />
                                        </div>
                                        <div>
                                            <CustomSelect
                                                label={t('expenses.form.category')}
                                                value={newExpense.category}
                                                onChange={(val) => setNewExpense(prev => ({ ...prev, category: val as ExpenseCategory }))}
                                                options={EXPENSE_CATEGORIES.map(cat => ({
                                                    value: cat.value,
                                                    label: t(`expenses.categories.${cat.value}`) || cat.label,
                                                    icon: <span className="text-base">{cat.icon}</span>
                                                }))}
                                            />
                                        </div>
                                        <div>
                                            <CustomSelect
                                                label={t('expenses.form.paymentMethod')}
                                                value={newExpense.payment_method}
                                                onChange={(val) => setNewExpense(prev => ({ ...prev, payment_method: val as any }))}
                                                options={[
                                                    { value: 'cash', label: t('expenses.form.methods.cash', 'Cash'), icon: <Wallet className="w-4 h-4" /> },
                                                    { value: 'bank_transfer', label: t('expenses.form.methods.bank_transfer', 'Bank Transfer'), icon: <ArrowUpRight className="w-4 h-4" /> },
                                                    { value: 'digital', label: t('expenses.form.methods.digital', 'Digital'), icon: <CreditCard className="w-4 h-4" /> }
                                                ]}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-2 mt-4 relative">
                                        <button
                                            onClick={() => setIsAddFormOpen(false)}
                                            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
                                            disabled={isSubmitting}
                                        >
                                            {t('expenses.form.cancel')}
                                        </button>
                                        <button
                                            onClick={handleAddExpense}
                                            disabled={isSubmitting}
                                            className="btn-primary px-5 py-2 rounded-lg text-sm disabled:opacity-50 flex items-center gap-2"
                                        >
                                            {isSubmitting && (
                                                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            )}
                                            {isSubmitting ? t('expenses.form.saving', 'Saving...') : t('expenses.form.save')}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
                        <div className="lg:col-span-3 space-y-4">
                            {/* ─── FILTERS ─── */}
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
                                                label: t(`expenses.categories.${cat.value}`) || cat.label,
                                                icon: <span className="text-base">{cat.icon}</span>
                                            }))
                                        ]}
                                        icon={<Filter className="w-4 h-4" />}
                                    />
                                </div>
                            </div>

                            {/* ─── EXPENSE LIST ─── */}
                            <div className="bg-card rounded-2xl border border-border/60 overflow-hidden shadow-sm">
                                {expenses.length === 0 ? (
                                    <div className="py-12 sm:py-16 text-center px-6">
                                        <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <DollarSign className="w-8 h-8 text-muted-foreground/40" />
                                        </div>
                                        <h3 className="text-base font-semibold text-foreground">{t('expenses.noExpenses')}</h3>
                                        <p className="text-muted-foreground text-sm mt-1">Record your first expense to get started</p>
                                    </div>
                                ) : filteredExpenses.length === 0 ? (
                                    <div className="py-10 text-center text-sm text-muted-foreground">
                                        No expenses match your search
                                    </div>
                                ) : (
                                    <>
                                        {/* ── Mobile card list (< sm) ── */}
                                        <div className="sm:hidden divide-y divide-border/30">
                                            <AnimatePresence>
                                                {filteredExpenses.map((expense, index) => (
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
                                                        <div className="flex items-center gap-2 flex-shrink-0">
                                                            <span className="text-sm font-bold text-error-500 tabular-nums">
                                                                {formatCurrency(expense.amount)}
                                                            </span>
                                                            <button
                                                                onClick={(e) => handleDeleteClick(expense.id, e)}
                                                                className="p-1.5 text-muted-foreground/50 hover:text-error-500 hover:bg-error-500/10 rounded-lg transition-all"
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
                                                        <th className="px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('expenses.table.expense')}</th>
                                                        <th className="px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('expenses.table.category')}</th>
                                                        <th className="px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('expenses.table.date')}</th>
                                                        <th className="px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">{t('expenses.table.method')}</th>
                                                        <th className="px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">{t('expenses.table.amount')}</th>
                                                        <th className="px-5 py-3.5 w-10" />
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border/30">
                                                    <AnimatePresence>
                                                        {filteredExpenses.map((expense, index) => (
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
                                                                </td>
                                                                <td className="px-5 py-3.5">
                                                                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-secondary/60 text-xs font-medium text-foreground border border-border/40">
                                                                        {EXPENSE_CATEGORIES.find(c => c.value === expense.category)?.icon}
                                                                        {t(`expenses.categories.${expense.category}`) || EXPENSE_CATEGORIES.find(c => c.value === expense.category)?.label}
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
                                                                        {expense.payment_method === 'cash' ? <Wallet className="w-3.5 h-3.5" /> :
                                                                            expense.payment_method === 'digital' ? <CreditCard className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                                                                        {t(`expenses.form.methods.${expense.payment_method}`) || expense.payment_method.replace('_', ' ')}
                                                                    </div>
                                                                </td>
                                                                <td className="px-5 py-3.5 text-right">
                                                                    <span className="text-error-500 font-bold font-mono tracking-tight tabular-nums">{formatCurrency(expense.amount)}</span>
                                                                </td>
                                                                <td className="px-5 py-3.5 text-right">
                                                                    <button
                                                                        onClick={(e) => handleDeleteClick(expense.id, e)}
                                                                        className="p-1.5 text-muted-foreground hover:text-error-500 hover:bg-error-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </td>
                                                            </motion.tr>
                                                        ))}
                                                    </AnimatePresence>
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* ─── SIDE BREAKDOWN ─── */}
                        <div>
                            {summary && (
                                <div className="bg-card rounded-2xl border border-border/60 p-4 sm:p-5 shadow-sm lg:sticky lg:top-6">
                                    <h3 className="text-sm sm:text-base font-bold text-foreground mb-4 flex items-center gap-2">
                                        <PieChart className="w-4 h-4 text-purple-500" />
                                        {t('expenses.breakdown')}
                                    </h3>
                                    <div className="space-y-3.5">
                                        {summary.categoryBreakdown.map((cat: any, i: number) => (
                                            <motion.div
                                                key={cat.category}
                                                className="space-y-1.5"
                                                initial={{ opacity: 0, x: 12 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.2 + (i * 0.08) }}
                                            >
                                                <div className="flex justify-between text-xs font-medium">
                                                    <span className="text-muted-foreground flex items-center gap-1.5 truncate">
                                                        {EXPENSE_CATEGORIES.find(c => c.value === cat.category)?.icon}
                                                        <span className="truncate">{t(`expenses.categories.${cat.category}`) || EXPENSE_CATEGORIES.find(c => c.value === cat.category)?.label}</span>
                                                    </span>
                                                    <span className="text-foreground font-semibold tabular-nums ml-2 flex-shrink-0">{formatCurrency(cat.amount)}</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                                                    <motion.div
                                                        className="h-full bg-gradient-to-r from-purple-500 to-primary rounded-full"
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${(cat.amount / summary.totalExpenses) * 100}%` }}
                                                        transition={{ duration: 0.8, ease: 'easeOut' }}
                                                    />
                                                </div>
                                            </motion.div>
                                        ))}
                                        {summary.categoryBreakdown.length === 0 && (
                                            <p className="text-xs text-muted-foreground text-center py-3">No data to display</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <ConfirmDialog
                        isOpen={isDeleteConfirmOpen}
                        title={t('expenses.deleteTitle', 'Delete Expense')}
                        message={t('expenses.confirmDelete', 'Are you sure you want to delete this expense?')}
                        confirmText={t('common.delete', 'Delete')}
                        variant="danger"
                        onConfirm={confirmDelete}
                        onCancel={() => setIsDeleteConfirmOpen(false)}
                    />
                </>
            )}
        </div>
    );
}
