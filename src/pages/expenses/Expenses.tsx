import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    DollarSign,
    Plus,
    Trash2,
    ArrowUpRight,
    PieChart
} from 'lucide-react';
import { Expense, ExpenseCategory, EXPENSE_CATEGORIES } from '../../lib/types';
import { getExpenses, recordExpense, deleteExpense, getExpenseSummary } from '../../lib/api/expenses';
import { formatCurrency } from '../../lib/utils/notifications';
import { useAuthStore } from '../../lib/store';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function Expenses() {
    const profile = useAuthStore(state => state.profile);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [summary, setSummary] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddFormOpen, setIsAddFormOpen] = useState(false);

    const [newExpense, setNewExpense] = useState({
        category: 'miscellaneous' as ExpenseCategory,
        description: '',
        amount: '',
        payment_method: 'cash' as 'cash' | 'bank_transfer' | 'digital',
        expense_date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const data = await getExpenses();
            setExpenses(data);

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
        if (!newExpense.description || !newExpense.amount) return;

        try {
            await recordExpense({
                ...newExpense,
                amount: parseFloat(newExpense.amount),
                expense_date: new Date(newExpense.expense_date),
                created_by: profile?.id || 'unknown'
            });
            setIsAddFormOpen(false);
            setNewExpense({
                category: 'miscellaneous',
                description: '',
                amount: '',
                payment_method: 'cash',
                expense_date: new Date().toISOString().split('T')[0]
            });
            loadData();
        } catch (error) {
            console.error('Error recording expense:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this expense?')) return;
        try {
            await deleteExpense(id);
            loadData();
        } catch (error) {
            console.error('Error deleting expense:', error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gradient">Business Expenses</h1>
                    <p className="text-gray-400 mt-1">Track rent, utilities, salaries, and other costs</p>
                </div>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsAddFormOpen(!isAddFormOpen)}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Record Expense
                </motion.button>
            </div>

            <AnimatePresence>
                {isAddFormOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="glass-card overflow-hidden"
                    >
                        <div className="p-6 space-y-4">
                            <h3 className="text-lg font-semibold text-white">Record New Expense</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm text-gray-400">Description</label>
                                    <input
                                        type="text"
                                        className="input-dark w-full"
                                        placeholder="e.g., Store Electricity Bill, Equipment Maintenance"
                                        value={newExpense.description}
                                        onChange={e => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm text-gray-400">Amount</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="number"
                                            className="input-dark w-full pl-10"
                                            placeholder="0.00"
                                            value={newExpense.amount}
                                            onChange={e => setNewExpense(prev => ({ ...prev, amount: e.target.value }))}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm text-gray-400">Category</label>
                                    <select
                                        className="input-dark w-full"
                                        value={newExpense.category}
                                        onChange={e => setNewExpense(prev => ({ ...prev, category: e.target.value as ExpenseCategory }))}
                                    >
                                        {EXPENSE_CATEGORIES.map(cat => (
                                            <option key={cat.value} value={cat.value}>{cat.icon} {cat.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm text-gray-400">Payment Method</label>
                                    <select
                                        className="input-dark w-full"
                                        value={newExpense.payment_method}
                                        onChange={e => setNewExpense(prev => ({ ...prev, payment_method: e.target.value as any }))}
                                    >
                                        <option value="cash">Cash</option>
                                        <option value="bank_transfer">Bank Transfer</option>
                                        <option value="digital">Digital Payment</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm text-gray-400">Date</label>
                                    <input
                                        type="date"
                                        className="input-dark w-full"
                                        value={newExpense.expense_date}
                                        onChange={e => setNewExpense(prev => ({ ...prev, expense_date: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-4">
                                <button onClick={() => setIsAddFormOpen(false)} className="btn-secondary">Cancel</button>
                                <button onClick={handleAddExpense} className="btn-primary">Save Expense</button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 space-y-4">
                    <div className="glass-card overflow-hidden">
                        {isLoading ? (
                            <div className="flex items-center justify-center p-12">
                                <LoadingSpinner size="lg" text="Loading expenses..." />
                            </div>
                        ) : expenses.length === 0 ? (
                            <div className="p-12 text-center text-gray-400">
                                <DollarSign className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                <p>No expenses recorded yet</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-dark-900/50 border-b border-dark-700/50">
                                            <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Expense</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Category</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Method</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Amount</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-dark-700/30">
                                        {expenses.map((expense) => (
                                            <tr key={expense.id} className="hover:bg-dark-700/20 transition-colors">
                                                <td className="px-6 py-4">
                                                    <p className="text-white font-medium">{expense.description}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="flex items-center gap-2 text-gray-300">
                                                        {EXPENSE_CATEGORIES.find(c => c.value === expense.category)?.icon}
                                                        {EXPENSE_CATEGORIES.find(c => c.value === expense.category)?.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-gray-400 text-sm">
                                                    {expense.expense_date.toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-xs text-gray-400 uppercase">{expense.payment_method.replace('_', ' ')}</span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="text-error-400 font-bold">{formatCurrency(expense.amount)}</span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => handleDelete(expense.id)}
                                                        className="p-2 text-gray-500 hover:text-error-400 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    {summary && (
                        <div className="glass-card p-6">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <PieChart className="w-5 h-5 text-accent-400" />
                                Category Breakdown
                            </h3>
                            <div className="space-y-4">
                                {summary.categoryBreakdown.map((cat: any) => (
                                    <div key={cat.category} className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-400">
                                                {EXPENSE_CATEGORIES.find(c => c.value === cat.category)?.label}
                                            </span>
                                            <span className="text-white font-medium">{formatCurrency(cat.amount)}</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-dark-900 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-accent-500 rounded-full"
                                                style={{ width: `${(cat.amount / summary.totalExpenses) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="glass-card p-6">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <ArrowUpRight className="w-5 h-5 text-primary-400" />
                            Summary (30 Days)
                        </h3>
                        <div className="space-y-4">
                            <div className="p-4 rounded-xl bg-error-500/10 border border-error-500/30">
                                <p className="text-gray-400 text-xs uppercase tracking-wider">Total Monthly Expenses</p>
                                <p className="text-2xl font-bold text-error-400 mt-1">
                                    {summary ? formatCurrency(summary.totalExpenses) : formatCurrency(0)}
                                </p>
                            </div>
                            <div className="p-4 rounded-xl bg-primary-500/10 border border-primary-500/30">
                                <p className="text-gray-400 text-xs uppercase tracking-wider">Expense Count</p>
                                <p className="text-2xl font-bold text-primary-400 mt-1">{summary?.expenseCount || 0}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
