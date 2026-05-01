import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronDown, Clock, Check } from 'lucide-react';

export type TimePeriod = 'today' | 'this-week' | 'this-month' | 'previous-month' | 'last-3-months' | 'last-6-months' | 'this-year';

interface TimePeriodFilterProps {
  selectedPeriod: TimePeriod;
  onPeriodChange: (period: TimePeriod) => void;
  isLoading?: boolean;
}

const TIME_PERIODS: Array<{ value: TimePeriod; label: string; description: string }> = [
  { value: 'today',          label: 'Today',          description: 'Current day' },
  { value: 'this-week',      label: 'Last 7 Days',    description: 'Past week' },
  { value: 'this-month',     label: 'Last 30 Days',   description: 'Past month' },
  { value: 'last-3-months',  label: 'Last 3 Months',  description: 'Past quarter' },
  { value: 'last-6-months',  label: 'Last 6 Months',  description: 'Past 6 months' },
  { value: 'this-year',      label: 'Last Year',      description: 'Past 12 months' },
];

export default function TimePeriodFilter({
  selectedPeriod,
  onPeriodChange,
  isLoading = false,
}: TimePeriodFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selected = TIME_PERIODS.find(p => p.value === selectedPeriod) ?? TIME_PERIODS[2];

  return (
    <div className="relative">
      {/* Trigger */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(v => !v)}
        disabled={isLoading}
        className={`w-full sm:w-auto min-w-[180px] flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl
          bg-card border border-border/60 hover:border-primary-500/50
          transition-all duration-200 text-foreground
          ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label="Select time period"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-primary-500/15 text-primary-500 flex-shrink-0">
            {isLoading
              ? <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              : <Calendar className="w-4 h-4" />
            }
          </div>
          <div className="text-left leading-tight">
            <div className="text-sm font-semibold text-foreground">{selected.label}</div>
            <div className="text-xs text-foreground-muted">{selected.description}</div>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-foreground-muted flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -8 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 right-0 mt-2 z-50
                bg-card border border-border/60 rounded-2xl shadow-xl overflow-hidden
                min-w-[200px]"
              role="listbox"
              aria-label="Time period options"
            >
              {/* Header */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
                <Clock className="w-4 h-4 text-primary-500" />
                <span className="text-sm font-semibold text-foreground">Select Period</span>
              </div>

              {/* Options */}
              <div className="py-1">
                {TIME_PERIODS.map((period, i) => {
                  const isActive = selectedPeriod === period.value;
                  return (
                    <motion.button
                      key={period.value}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => { onPeriodChange(period.value); setIsOpen(false); }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors
                        ${isActive
                          ? 'bg-primary-500/10 text-primary-500'
                          : 'text-foreground hover:bg-muted/50'
                        }`}
                      role="option"
                      aria-selected={isActive}
                    >
                      <div>
                        <div className="text-sm font-medium">{period.label}</div>
                        <div className="text-xs text-foreground-muted">{period.description}</div>
                      </div>
                      {isActive && <Check className="w-4 h-4 text-primary-500 flex-shrink-0" />}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
