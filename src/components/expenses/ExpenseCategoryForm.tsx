import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Tag } from 'lucide-react';
import { EXPENSE_CATEGORIES, ExpenseCategory } from '../../lib/types';

/**
 * ExpenseCategoryForm — lets users pick from the fixed enum of expense categories.
 * Since categories are a typed enum (not user-created in Firestore), this component
 * acts as a visual category manager: shows all categories, lets you toggle which
 * ones are "active" for filtering, and provides a clear UI for the category list.
 */

interface ExpenseCategoryFormProps {
  activeCategories: ExpenseCategory[];
  onChange: (categories: ExpenseCategory[]) => void;
  onClose: () => void;
}

export default function ExpenseCategoryForm({
  activeCategories,
  onChange,
  onClose,
}: ExpenseCategoryFormProps) {
  const [selected, setSelected] = useState<Set<ExpenseCategory>>(
    new Set(activeCategories.length ? activeCategories : EXPENSE_CATEGORIES.map(c => c.value))
  );

  const toggle = (cat: ExpenseCategory) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(cat)) {
        if (next.size === 1) return prev; // keep at least one
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  };

  const handleApply = () => {
    onChange(Array.from(selected));
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-sm bg-card rounded-2xl border border-border/60 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Tag className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-foreground">Expense Categories</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Category list */}
        <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
          {EXPENSE_CATEGORIES.map(cat => {
            const isActive = selected.has(cat.value);
            return (
              <button
                key={cat.value}
                onClick={() => toggle(cat.value)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-left ${
                  isActive
                    ? 'bg-primary/10 border-primary/30 text-foreground'
                    : 'bg-secondary/30 border-border/40 text-muted-foreground hover:border-border'
                }`}
              >
                <span className="text-lg flex-shrink-0">{cat.icon}</span>
                <span className="text-sm font-medium flex-1">{cat.label}</span>
                <div
                  className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all ${
                    isActive
                      ? 'bg-primary border-primary'
                      : 'border-border/60'
                  }`}
                >
                  {isActive && (
                    <svg viewBox="0 0 16 16" className="w-full h-full text-white fill-current">
                      <path d="M13.5 4.5l-7 7L3 8" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-4 pb-4">
          <button
            onClick={() => {
              setSelected(new Set(EXPENSE_CATEGORIES.map(c => c.value)));
            }}
            className="flex-1 py-2 rounded-xl border border-border/60 text-xs font-medium text-muted-foreground hover:bg-secondary transition-colors"
          >
            Select All
          </button>
          <button
            onClick={handleApply}
            className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity"
          >
            Apply Filter
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
