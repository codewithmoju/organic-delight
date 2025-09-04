import { motion } from 'framer-motion';
import { Zap, ZapOff } from 'lucide-react';

interface AnimationToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
}

export default function AnimationToggle({ 
  enabled, 
  onChange, 
  disabled = false 
}: AnimationToggleProps) {
  return (
    <div className="p-4 rounded-xl bg-dark-700/30 border border-dark-600/50 hover:border-primary-500/30 transition-all duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          <div className="p-2 rounded-lg bg-primary-500/20 text-primary-400 flex-shrink-0">
            {enabled ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-white font-medium">Show Animations</h4>
            <p className="text-gray-400 text-sm mt-1">
              {enabled 
                ? 'Smooth transitions and animations are enabled' 
                : 'Animations are disabled for better performance'
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
            checked={enabled}
            onChange={(e) => onChange(e.target.checked)}
            disabled={disabled}
            aria-label="Toggle animations"
          />
          <div
            className={`w-11 h-6 rounded-full peer transition-all duration-200 ${
              disabled
                ? 'bg-gray-600 cursor-not-allowed'
                : enabled
                ? 'bg-primary-600 peer-focus:ring-4 peer-focus:ring-primary-300/20'
                : 'bg-dark-600 peer-focus:ring-4 peer-focus:ring-gray-300/20'
            } peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all`}
          />
        </motion.label>
      </div>

      {/* Preview Animation */}
      {enabled && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-4 p-3 bg-dark-800/50 rounded-lg border border-primary-500/20"
        >
          <div className="flex items-center space-x-2">
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 180, 360] 
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: "easeInOut" 
              }}
              className="w-4 h-4 bg-primary-500 rounded-full"
            />
            <span className="text-xs text-gray-400">
              Animation preview - this will be hidden when disabled
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
}