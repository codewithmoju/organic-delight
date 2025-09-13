import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface PreferenceToggleProps {
  label: string;
  description: string;
  icon: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export default function PreferenceToggle({
  label,
  description,
  icon,
  checked,
  onChange,
  disabled = false
}: PreferenceToggleProps) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-dark-700/30 border border-dark-600/50 hover:border-primary-500/30 transition-all duration-200">
      <div className="flex items-center space-x-4 flex-1">
        <div className="p-2 rounded-lg bg-primary-500/20 text-primary-400 flex-shrink-0">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-white font-medium">{label}</h4>
          <p className="text-gray-400 text-sm mt-1">{description}</p>
        </div>
      </div>
      
      <motion.label
        className="relative inline-flex items-center cursor-pointer"
        whileTap={{ scale: 0.95 }}
      >
        <input
          type="checkbox"
          className="sr-only peer"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
        />
        <div
          className={`w-11 h-6 rounded-full peer transition-all duration-200 ${
            disabled
              ? 'bg-gray-600 cursor-not-allowed'
              : checked
              ? 'bg-primary-600 peer-focus:ring-4 peer-focus:ring-primary-300/20'
              : 'bg-dark-600 peer-focus:ring-4 peer-focus:ring-gray-300/20'
          } peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all`}
        />
      </motion.label>
    </div>
  );
}