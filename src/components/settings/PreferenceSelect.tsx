import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

interface PreferenceSelectProps {
  label: string;
  description?: string;
  icon?: ReactNode;
  value: string;
  options: Array<{ value: string; label: string; description?: string }>;
  onChange: (value: string) => void;
  disabled?: boolean;
  'aria-label'?: string;
}

export default function PreferenceSelect({
  label,
  description,
  icon,
  value,
  options,
  onChange,
  disabled = false,
  'aria-label': ariaLabel,
}: PreferenceSelectProps) {
  return (
    <div className="p-4 rounded-xl bg-dark-700/30 border border-dark-600/50">
      <div className="flex items-center space-x-4 mb-3">
        {icon && (
          <div className="p-2 rounded-lg bg-primary-500/20 text-primary-400 flex-shrink-0">
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h4 className="text-white font-medium">{label}</h4>
          {description && (
            <p className="text-gray-400 text-sm mt-1">{description}</p>
          )}
        </div>
      </div>
      
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          aria-label={ariaLabel || label}
          className={`w-full input-dark appearance-none pr-10 ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <ChevronDown className="w-5 h-5 text-gray-400" />
        </div>
      </div>
    </div>
  );
}