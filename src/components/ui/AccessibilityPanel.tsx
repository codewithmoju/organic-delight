import { motion } from 'framer-motion';
import { useAccessibility } from '../../lib/hooks/useAccessibility';
import FontSizeControl from './FontSizeControl';
import ContrastToggle from './ContrastToggle';
import CompactViewToggle from './CompactViewToggle';
import AnimationToggle from './AnimationToggle';
import ItemsPerPageControl from './ItemsPerPageControl';

export default function AccessibilityPanel() {
  const { settings, updateSetting } = useAccessibility();

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <div className="p-3 rounded-lg bg-primary-500/20 text-primary-400 mr-4">
          <span className="text-2xl">♿</span>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-white">Accessibility Settings</h3>
          <p className="text-gray-400 text-sm mt-1">
            Customize the interface for better usability and comfort
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FontSizeControl
          currentSize={settings.fontSize}
          onSizeChange={(size) => updateSetting('fontSize', size)}
        />
        
        <ContrastToggle
          mode={settings.contrastMode}
          onChange={(mode) => updateSetting('contrastMode', mode)}
        />
        
        <CompactViewToggle
          mode={settings.viewMode}
          onChange={(mode) => updateSetting('viewMode', mode)}
        />
        
        <AnimationToggle
          enabled={settings.animationsEnabled}
          onChange={(enabled) => updateSetting('animationsEnabled', enabled)}
        />
        
        <div className="lg:col-span-2">
          <ItemsPerPageControl
            value={settings.itemsPerPage}
            onChange={(value) => updateSetting('itemsPerPage', value)}
          />
        </div>
      </div>
    </div>
  );
}