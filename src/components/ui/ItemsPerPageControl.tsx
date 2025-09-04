import { motion } from 'framer-motion';
import { List, ChevronDown } from 'lucide-react';

interface ItemsPerPageControlProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  options?: number[];
}

const DEFAULT_OPTIONS = [10, 25, 50, 100];

export default function ItemsPerPageControl({ 
  value, 
  onChange, 
  disabled = false,
  options = DEFAULT_OPTIONS
}: ItemsPerPageControlProps) {
  return (
    <div className="p-4 rounded-xl bg-dark-700/30 border border-dark-600/50">
      <div className="flex items-center space-x-4 mb-4">
        <div className="p-2 rounded-lg bg-primary-500/20 text-primary-400 flex-shrink-0">
          <List className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-white font-medium">Items Per Page</h4>
          <p className="text-gray-400 text-sm mt-1">
            Number of items to display in lists and tables
          </p>
        </div>
      </div>

      {/* Quick Selection Buttons */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {options.map((option) => (
          <motion.button
            key={option}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onChange(option)}
            disabled={disabled}
            className={`p-2 rounded-lg text-center font-medium transition-all duration-200 ${
              value === option
                ? 'bg-primary-500/20 text-primary-400 border border-primary-500/50'
                : 'bg-dark-600/30 text-gray-300 hover:bg-dark-600/50 border border-transparent'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {option}
          </motion.button>
        ))}
      </div>

      {/* Custom Input */}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled}
          className={`w-full input-dark appearance-none pr-10 ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          aria-label="Select items per page"
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option} items per page
            </option>
          ))}
          {!options.includes(value) && (
            <option value={value}>
              {value} items per page (custom)
            </option>
          )}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <ChevronDown className="w-5 h-5 text-gray-400" />
        </div>
      </div>

      {/* Performance Indicator */}
      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="text-gray-500">
          Performance: {value <= 25 ? 'Optimal' : value <= 50 ? 'Good' : 'May be slower'}
        </span>
        <span className={`font-medium ${
          value <= 25 ? 'text-success-400' : 
          value <= 50 ? 'text-warning-400' : 'text-error-400'
        }`}>
          {value} items
        </span>
      </div>
    </div>
  );
}