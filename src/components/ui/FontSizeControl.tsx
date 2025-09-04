import { motion } from 'framer-motion';
import { Type, Minus, Plus } from 'lucide-react';
import { FontSize } from '../../lib/hooks/useAccessibility';

interface FontSizeControlProps {
  currentSize: FontSize;
  onSizeChange: (size: FontSize) => void;
  disabled?: boolean;
}

const FONT_SIZES: Array<{ value: FontSize; label: string; description: string }> = [
  { value: 'small', label: 'Small', description: 'Compact text for more content' },
  { value: 'medium', label: 'Medium', description: 'Standard text size' },
  { value: 'large', label: 'Large', description: 'Larger text for better readability' },
  { value: 'extra-large', label: 'Extra Large', description: 'Maximum text size' },
];

export default function FontSizeControl({ 
  currentSize, 
  onSizeChange, 
  disabled = false 
}: FontSizeControlProps) {
  const currentIndex = FONT_SIZES.findIndex(size => size.value === currentSize);
  
  const decreaseSize = () => {
    if (currentIndex > 0) {
      onSizeChange(FONT_SIZES[currentIndex - 1].value);
    }
  };

  const increaseSize = () => {
    if (currentIndex < FONT_SIZES.length - 1) {
      onSizeChange(FONT_SIZES[currentIndex + 1].value);
    }
  };

  return (
    <div className="p-4 rounded-xl bg-dark-700/30 border border-dark-600/50">
      <div className="flex items-center space-x-4 mb-4">
        <div className="p-2 rounded-lg bg-primary-500/20 text-primary-400 flex-shrink-0">
          <Type className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-white font-medium">Font Size</h4>
          <p className="text-gray-400 text-sm mt-1">
            Adjust text size for better readability
          </p>
        </div>
      </div>

      {/* Size Options */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {FONT_SIZES.map((size) => (
          <motion.button
            key={size.value}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSizeChange(size.value)}
            disabled={disabled}
            className={`p-3 rounded-lg text-left transition-all duration-200 ${
              currentSize === size.value
                ? 'bg-primary-500/20 text-primary-400 border border-primary-500/50'
                : 'bg-dark-600/30 text-gray-300 hover:bg-dark-600/50 border border-transparent'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="font-medium text-sm">{size.label}</div>
            <div className="text-xs opacity-75 mt-1">{size.description}</div>
          </motion.button>
        ))}
      </div>

      {/* Quick Controls */}
      <div className="flex items-center justify-between">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={decreaseSize}
          disabled={disabled || currentIndex === 0}
          className={`p-2 rounded-lg transition-all duration-200 ${
            disabled || currentIndex === 0
              ? 'bg-gray-600/30 text-gray-500 cursor-not-allowed'
              : 'bg-dark-600/50 text-gray-300 hover:bg-dark-600/70 hover:text-white'
          }`}
          aria-label="Decrease font size"
        >
          <Minus className="w-4 h-4" />
        </motion.button>

        <div className="text-center">
          <div className="text-primary-400 font-semibold">
            {FONT_SIZES[currentIndex]?.label}
          </div>
          <div className="text-xs text-gray-500">
            {currentIndex + 1} of {FONT_SIZES.length}
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={increaseSize}
          disabled={disabled || currentIndex === FONT_SIZES.length - 1}
          className={`p-2 rounded-lg transition-all duration-200 ${
            disabled || currentIndex === FONT_SIZES.length - 1
              ? 'bg-gray-600/30 text-gray-500 cursor-not-allowed'
              : 'bg-dark-600/50 text-gray-300 hover:bg-dark-600/70 hover:text-white'
          }`}
          aria-label="Increase font size"
        >
          <Plus className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  );
}