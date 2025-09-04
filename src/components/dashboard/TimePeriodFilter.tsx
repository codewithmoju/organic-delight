import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronDown, Clock } from 'lucide-react';

export type TimePeriod = 'today' | 'this-week' | 'this-month' | 'previous-month' | 'last-3-months' | 'last-6-months' | 'this-year';

interface TimePeriodFilterProps {
  selectedPeriod: TimePeriod;
  onPeriodChange: (period: TimePeriod) => void;
}

const TIME_PERIODS: Array<{ value: TimePeriod; label: string; description: string }> = [
  { value: 'today', label: 'Today', description: 'Current day' },
  { value: 'this-week', label: 'Last 7 Days', description: 'Past week' },
  { value: 'this-month', label: 'Last 30 Days', description: 'Past month' },
  { value: 'last-3-months', label: 'Last 3 Months', description: 'Past quarter' },
  { value: 'last-6-months', label: 'Last 6 Months', description: 'Past 6 months' },
  { value: 'this-year', label: 'Last Year', description: 'Past 12 months' },
];

export default function TimePeriodFilter({ 
  selectedPeriod, 
  onPeriodChange
}: TimePeriodFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedPeriodData = TIME_PERIODS.find(p => p.value === selectedPeriod) || TIME_PERIODS[2];

  const handlePeriodSelect = (period: TimePeriod) => {
    onPeriodChange(period);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Dropdown Trigger */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full sm:w-auto min-w-[200px] flex items-center justify-between px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 hover:border-primary-500/50 transition-all duration-200"
        style={{
          transform: 'translate3d(0, 0, 0)',
          backfaceVisibility: 'hidden',
          touchAction: 'manipulation'
        }}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label="Select time period"
      >
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-primary-500/20 text-primary-400">
            <Calendar className="w-4 h-4" />
          </div>
          <div className="text-left">
            <div className="text-white font-semibold text-sm">
              {selectedPeriodData.label}
            </div>
            <div className="text-gray-400 text-xs">
              {selectedPeriodData.description}
            </div>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
          isOpen ? 'rotate-180' : ''
        }`} />
      </motion.button>

      {/* Dropdown Menu */}
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

            {/* Dropdown Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 bg-dark-800 border border-dark-600/50 rounded-xl shadow-dark-lg z-50 overflow-hidden"
              role="listbox"
              aria-label="Time period options"
            >
              <div className="p-3 border-b border-dark-700/50">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-primary-400" />
                  <span className="text-sm font-medium text-white">Select Time Period</span>
                </div>
              </div>

              <div className="max-h-64 overflow-y-auto">
                {TIME_PERIODS.map((period, index) => (
                  <motion.button
                    key={period.value}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ backgroundColor: 'rgba(51, 65, 85, 0.5)' }}
                    onClick={() => handlePeriodSelect(period.value)}
                    className={`w-full flex items-center justify-between p-4 text-left transition-all duration-200 ${
                      selectedPeriod === period.value
                        ? 'bg-primary-500/10 text-primary-400 border-l-4 border-primary-500'
                        : 'text-gray-300 hover:text-white'
                    }`}
                    role="option"
                    aria-selected={selectedPeriod === period.value}
                  >
                    <div>
                      <div className="font-medium">{period.label}</div>
                      <div className="text-sm opacity-75">{period.description}</div>
                    </div>
                    {selectedPeriod === period.value && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-2 h-2 bg-primary-500 rounded-full"
                      />
                    )}
                  </motion.button>
                ))}
              </div>

              {/* Custom Date Range Option */}
              <div className="p-3 border-t border-dark-700/50 bg-dark-800/50">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full p-3 rounded-lg bg-dark-700/50 text-gray-300 hover:bg-dark-600/50 hover:text-white transition-all duration-200 text-center"
                  onClick={() => {
                    setIsOpen(false);
                    // Future: Open custom date range picker
                    toast.info('Custom date range coming soon!');
                  }}
                >
                  <Calendar className="w-4 h-4 mx-auto mb-1" />
                  <span className="text-sm font-medium">Custom Date Range</span>
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}