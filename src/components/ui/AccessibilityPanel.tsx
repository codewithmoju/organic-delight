import { motion } from 'framer-motion';
import { Accessibility, RotateCcw, Save, CheckCircle } from 'lucide-react';
import { useAccessibility } from '../../lib/hooks/useAccessibility';
import FontSizeControl from './FontSizeControl';
import AnimationToggle from './AnimationToggle';
import ContrastToggle from './ContrastToggle';
import CompactViewToggle from './CompactViewToggle';
import ItemsPerPageControl from './ItemsPerPageControl';
import LoadingSpinner from './LoadingSpinner';

interface AccessibilityPanelProps {
  className?: string;
}

export default function AccessibilityPanel({ className = '' }: AccessibilityPanelProps) {
  const {
    settings,
    updateSetting,
    resetToDefaults,
    isLoading,
  } = useAccessibility();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-primary-500/20 text-primary-400">
            <Accessibility className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Accessibility Settings</h3>
            <p className="text-gray-400 text-sm">
              Customize the interface for your needs
            </p>
          </div>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={resetToDefaults}
          disabled={isLoading}
          className="btn-secondary flex items-center gap-2 text-sm"
        >
          {isLoading ? (
            <LoadingSpinner size="sm" color="gray" />
          ) : (
            <RotateCcw className="w-4 h-4" />
          )}
          Reset
        </motion.button>
      </div>

      {/* Controls */}
      <div className="space-y-4">
        <FontSizeControl
          currentSize={settings.fontSize}
          onSizeChange={(size) => updateSetting('fontSize', size)}
          disabled={isLoading}
        />

        <AnimationToggle
          enabled={settings.animationsEnabled}
          onChange={(enabled) => updateSetting('animationsEnabled', enabled)}
          disabled={isLoading}
        />

        <ContrastToggle
          mode={settings.contrastMode}
          onChange={(mode) => updateSetting('contrastMode', mode)}
          disabled={isLoading}
        />

        <CompactViewToggle
          mode={settings.viewMode}
          onChange={(mode) => updateSetting('viewMode', mode)}
          disabled={isLoading}
        />

        <ItemsPerPageControl
          value={settings.itemsPerPage}
          onChange={(value) => updateSetting('itemsPerPage', value)}
          disabled={isLoading}
        />
      </div>

      {/* Status Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center p-3 bg-success-500/10 border border-success-500/20 rounded-lg"
      >
        <CheckCircle className="w-4 h-4 text-success-400 mr-2" />
        <span className="text-success-400 text-sm font-medium">
          Settings auto-saved
        </span>
      </motion.div>
    </div>
  );
}