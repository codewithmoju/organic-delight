import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';

export type TimePeriod = 'today' | 'this-week' | 'this-month' | 'previous-month' | 'last-3-months' | 'last-6-months' | 'this-year';

interface TimePeriodFilterProps {
  selectedPeriod: TimePeriod;
  onPeriodChange: (period: TimePeriod) => void;
  isLoading?: boolean;
}

const TIME_PERIODS: Array<{ value: TimePeriod; label: string }> = [
  { value: 'today', label: 'Today' },
  { value: 'this-week', label: 'This Week' },
  { value: 'this-month', label: 'This Month' },
  { value: 'previous-month', label: 'Previous Month' },
  { value: 'last-3-months', label: 'Last 3 Months' },
  { value: 'last-6-months', label: 'Last 6 Months' },
  { value: 'this-year', label: 'This Year' },
];

export default function TimePeriodFilter({ 
  selectedPeriod, 
  onPeriodChange, 
  isLoading = false 
}: TimePeriodFilterProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-dark p-4 sm:p-6"
    >
      <div className="flex items-center mb-4">
        <Calendar className="w-5 h-5 text-primary-400 mr-3" />
        <h3 className="text-lg font-semibold text-white">Time Period</h3>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2 sm:gap-3">
        {TIME_PERIODS.map((period, index) => (
          <motion.button
            key={period.value}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onPeriodChange(period.value)}
            disabled={isLoading}
            className={`px-3 py-2 sm:px-4 sm:py-3 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
              selectedPeriod === period.value
                ? 'bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-glow'
                : 'bg-dark-700/50 text-gray-300 hover:bg-dark-600/50 hover:text-white border border-dark-600/50'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {period.label}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}