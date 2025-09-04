import { motion } from 'framer-motion';
import { Maximize2, Minimize2 } from 'lucide-react';
import { ViewMode } from '../../lib/hooks/useAccessibility';

interface CompactViewToggleProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
  disabled?: boolean;
}

export default function CompactViewToggle({ 
  mode, 
  onChange, 
  disabled = false 
}: CompactViewToggleProps) {
  const isCompact = mode === 'compact';

  return (
    <div className="p-4 rounded-xl bg-dark-700/30 border border-dark-600/50 hover:border-primary-500/30 transition-all duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          <div className="p-2 rounded-lg bg-primary-500/20 text-primary-400 flex-shrink-0">
            {isCompact ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-white font-medium">Compact View</h4>
            <p className="text-gray-400 text-sm mt-1">
              {isCompact 
                ? 'Reduced spacing for more content density' 
                : 'Standard spacing for comfortable viewing'
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
            checked={isCompact}
            onChange={(e) => onChange(e.target.checked ? 'compact' : 'normal')}
            disabled={disabled}
            aria-label="Toggle compact view mode"
          />
          <div
            className={`w-11 h-6 rounded-full peer transition-all duration-200 ${
              disabled
                ? 'bg-gray-600 cursor-not-allowed'
                : isCompact
                ? 'bg-primary-600 peer-focus:ring-4 peer-focus:ring-primary-300/20'
                : 'bg-dark-600 peer-focus:ring-4 peer-focus:ring-gray-300/20'
            } peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all`}
          />
        </motion.label>
      </div>

      {/* View Mode Preview */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg bg-dark-800/50 border border-dark-700/50">
          <div className="text-xs text-gray-400 mb-2">Normal View</div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-600 rounded"></div>
            <div className="h-3 bg-gray-500 rounded w-3/4"></div>
            <div className="h-3 bg-gray-400 rounded w-1/2"></div>
          </div>
        </div>
        
        <div className={`p-2 rounded-lg border ${
          isCompact 
            ? 'bg-primary-500/10 border-primary-500/30' 
            : 'bg-dark-800/50 border-dark-700/50'
        }`}>
          <div className={`text-xs mb-1 ${
            isCompact ? 'text-primary-400' : 'text-gray-400'
          }`}>
            Compact View
          </div>
          <div className="space-y-1">
            <div className={`h-2 rounded ${
              isCompact ? 'bg-primary-400' : 'bg-gray-600'
            }`}></div>
            <div className={`h-2 rounded w-3/4 ${
              isCompact ? 'bg-primary-300' : 'bg-gray-500'
            }`}></div>
            <div className={`h-2 rounded w-1/2 ${
              isCompact ? 'bg-primary-200' : 'bg-gray-400'
            }`}></div>
          </div>
        </div>
      </div>
    </div>
  );
}