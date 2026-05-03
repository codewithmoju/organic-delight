import { useState } from 'react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Plus, Wallet, ArrowUpRight, CreditCard, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Expense, ExpenseCategory, EXPENSE_CATEGORIES } from '../../lib/types';
import CustomSelect from '../ui/CustomSelect';
import CustomDatePicker from '../ui/CustomDatePicker';

interface ExpenseFormProps {
  initialData?: Expense;
  isSubmitting?: boolean;
  onSubmit: (data: {
    category: ExpenseCategory;
    description: string;
    amount: number;
    payment_method: 'cash' | 'bank_transfer' | 'digital';
    expense_date: Date;
    reference_number?: string;
    notes?: string;
  }) => Promise<void>;
  onCancel: () => void;
}

export default function ExpenseForm({ initialData, isSubmitting = false, onSubmit, onCancel }: ExpenseFormProps) {
  const { t } = useTranslation();

  const [form, setForm] = useState({
    category: (initialData?.category ?? 'miscellaneous') as ExpenseCategory,
    description: initialData?.description ?? '',
    amount: initialData?.amount?.toString() ?? '',
    payment_method: (initialData?.payment_method ?? 'cash') as 'cash' | 'bank_transfer' | 'digital',
    expense_date: initialData?.expense_date
      ? format(new Date(initialData.expense_date), 'yyyy-MM-dd')
      : format(new Date(), 'yyyy-MM-dd'),
    reference_number: initialData?.reference_number ?? '',
    notes: initialData?.notes ?? '',
  });

  const [errors, setErrors] = useState<{ description?: string; amount?: string }>({});

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!form.description.trim()) newErrors.description = t('expenses.form.errors.descRequired', 'Description is required');
    if (!form.amount || isNaN(parseFloat(form.amount)) || parseFloat(form.amount) <= 0)
      newErrors.amount = t('expenses.form.errors.amountRequired', 'Enter a valid amount');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit({
      category: form.category,
      description: form.description.trim(),
      amount: parseFloat(form.amount),
      payment_method: form.payment_method,
      expense_date: new Date(form.expense_date),
      reference_number: form.reference_number.trim() || undefined,
      notes: form.notes.trim() || undefined,
    });
  };

  const set = (key: keyof typeof form) => (val: string) =>
    setForm(prev => ({ ...prev, [key]: val }));

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="overflow-hidden"
    >
      <form
        onSubmit={handleSubmit}
        className="bg-card rounded-2xl border border-border/60 p-4 sm:p-5 shadow-sm relative overflow-hidden"
      >
        {/* decorative gradient */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-primary/5 to-transparent rounded-bl-full pointer-events-none" />

        {/* Header */}
        <div className="flex justify-between items-center mb-4 relative">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Plus className="w-3.5 h-3.5" />
            </div>
            {initialData
              ? t('expenses.editExpense', 'Edit Expense')
              : t('expenses.recordNew', 'Record New Expense')}
          </h3>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 relative">
          {/* Description — spans 2 cols */}
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">
              {t('expenses.form.description')} *
            </label>
            <input
              type="text"
              className={`w-full h-11 bg-secondary/50 border rounded-xl px-4 text-sm text-foreground focus:bg-background focus:ring-2 focus:ring-primary/10 transition-all outline-none placeholder:text-muted-foreground/50 ${
                errors.description ? 'border-error-500' : 'border-transparent focus:border-primary/50'
              }`}
              placeholder={t('expenses.form.descPlaceholder', 'e.g. Office Supplies')}
              value={form.description}
              onChange={e => set('description')(e.target.value)}
              autoFocus
            />
            {errors.description && (
              <p className="mt-1 text-xs text-error-500">{errors.description}</p>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">
              {t('expenses.form.amount')} *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none z-10">
                PKR
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                className={`w-full h-11 bg-secondary/50 border rounded-xl pl-12 pr-4 text-sm text-foreground font-semibold focus:bg-background focus:ring-2 focus:ring-primary/10 transition-all outline-none ${
                  errors.amount ? 'border-error-500' : 'border-transparent focus:border-primary/50'
                }`}
                placeholder="0.00"
                value={form.amount}
                onChange={e => set('amount')(e.target.value)}
              />
            </div>
            {errors.amount && (
              <p className="mt-1 text-xs text-error-500">{errors.amount}</p>
            )}
          </div>

          {/* Date */}
          <div>
            <CustomDatePicker
              label={t('expenses.form.date')}
              value={form.expense_date}
              onChange={date => set('expense_date')(format(date, 'yyyy-MM-dd'))}
            />
          </div>

          {/* Category */}
          <div>
            <CustomSelect
              label={t('expenses.form.category')}
              value={form.category}
              onChange={val => set('category')(val)}
              options={EXPENSE_CATEGORIES.map(cat => ({
                value: cat.value,
                label: t(`expenses.categories.${cat.value}`, cat.label),
                icon: <span className="text-base">{cat.icon}</span>,
              }))}
            />
          </div>

          {/* Payment Method */}
          <div>
            <CustomSelect
              label={t('expenses.form.paymentMethod')}
              value={form.payment_method}
              onChange={val => set('payment_method')(val)}
              options={[
                { value: 'cash', label: t('expenses.form.methods.cash', 'Cash'), icon: <Wallet className="w-4 h-4" /> },
                { value: 'bank_transfer', label: t('expenses.form.methods.bank_transfer', 'Bank Transfer'), icon: <ArrowUpRight className="w-4 h-4" /> },
                { value: 'digital', label: t('expenses.form.methods.digital', 'Digital'), icon: <CreditCard className="w-4 h-4" /> },
              ]}
            />
          </div>

          {/* Reference Number */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">
              {t('expenses.form.reference', 'Reference No.')}
            </label>
            <input
              type="text"
              className="w-full h-11 bg-secondary/50 border border-transparent rounded-xl px-4 text-sm text-foreground focus:bg-background focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all outline-none placeholder:text-muted-foreground/50"
              placeholder={t('expenses.form.referencePlaceholder', 'Optional')}
              value={form.reference_number}
              onChange={e => set('reference_number')(e.target.value)}
            />
          </div>

          {/* Notes — spans full row */}
          <div className="sm:col-span-2 lg:col-span-4">
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">
              {t('expenses.form.notes', 'Notes')}
            </label>
            <textarea
              rows={2}
              className="w-full bg-secondary/50 border border-transparent rounded-xl px-4 py-2.5 text-sm text-foreground focus:bg-background focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all outline-none placeholder:text-muted-foreground/50 resize-none"
              placeholder={t('expenses.form.notesPlaceholder', 'Any additional notes...')}
              value={form.notes}
              onChange={e => set('notes')(e.target.value)}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-4 relative">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
          >
            {t('expenses.form.cancel', 'Cancel')}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary px-5 py-2 rounded-lg text-sm disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting && (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {isSubmitting
              ? t('expenses.form.saving', 'Saving...')
              : initialData
              ? t('expenses.form.update', 'Update Expense')
              : t('expenses.form.save', 'Save Expense')}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
