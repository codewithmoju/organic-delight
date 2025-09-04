import { motion } from 'framer-motion';
import { Eye, Contrast } from 'lucide-react';
import { ContrastMode } from '../../lib/hooks/useAccessibility';

interface ContrastToggleProps {
  mode: ContrastMode;
  onChange: (mode: ContrastMode) => void;
  disabled?: boolean;
}

export default function ContrastToggle({ 
  mode, 
  onChange, 
  disabled = false 
}: ContrastToggleProps) {
  const isHighContrast = mode === 'high';

  return (
    <div className="p-4 rounded-xl bg-dark-700/30 border border-dark-600/50 hover:border-primary-500/30 transition-all duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          <div className="p-2 rounded-lg bg-primary-500/20 text-primary-400 flex-shrink-0">
            <Eye className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-white font-medium">High Contrast Mode</h4>
            <p className="text-gray-400 text-sm mt-1">
              {isHighContrast 
                ? 'Enhanced contrast for better visibility' 
                : 'Standard contrast mode'
              }
            </p>
          </div>
        </div>
        
        <motion.label
          className="relative inline-flex items-center cursor-pointer"
          whileTap={{ scale: 0.95 }}
        >
          <input
            type="checkbox"
            className="sr-only peer"
            checked={isHighContrast}
            onChange={(e) => onChange(e.target.checked ? 'high' : 'normal')}
            disabled={disabled}
            aria-label="Toggle high contrast mode"
          />
          <div
            className={`w-11 h-6 rounded-full peer transition-all duration-200 ${
              disabled
                ? 'bg-gray-600 cursor-not-allowed'
                : isHighContrast
                ? 'bg-primary-600 peer-focus:ring-4 peer-focus:ring-primary-300/20'
                : 'bg-dark-600 peer-focus:ring-4 peer-focus:ring-gray-300/20'
            } peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all`}
          />
        </motion.label>
      </div>

      {/* Contrast Preview */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg bg-dark-800/50 border border-dark-700/50">
          <div className="text-xs text-gray-400 mb-2">Normal Contrast</div>
          <div className="space-y-1">
            <div className="h-2 bg-gray-600 rounded"></div>
            <div className="h-2 bg-gray-500 rounded w-3/4"></div>
            <div className="h-2 bg-gray-400 rounded w-1/2"></div>
          </div>
        </div>
        
        <div className={`p-3 rounded-lg border ${
          isHighContrast 
            ? 'bg-black border-white/30' 
            : 'bg-dark-800/50 border-dark-700/50'
        }`}>
          <div className={`text-xs mb-2 ${
            isHighContrast ? 'text-white' : 'text-gray-400'
          }`}>
            High Contrast
          </div>
          <div className="space-y-1">
            <div className={`h-2 rounded ${
              isHighContrast ? 'bg-white' : 'bg-gray-600'
            }`}></div>
            <div className={`h-2 rounded w-3/4 ${
              isHighContrast ? 'bg-gray-300' : 'bg-gray-500'
            }`}></div>
            <div className={`h-2 rounded w-1/2 ${
              isHighContrast ? 'bg-gray-400' : 'bg-gray-400'
            }`}></div>
          </div>
        </div>
      </div>
    </div>
  );
}