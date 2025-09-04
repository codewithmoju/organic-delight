import { motion } from 'framer-motion';
import { ReactNode, useState, useEffect } from 'react';

interface PreferenceSliderProps {
  label: string;
  description?: string;
  icon?: ReactNode;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  formatValue?: (value: number) => string;
  'aria-label'?: string;
}

export default function PreferenceSlider({
  label,
  description,
  icon,
  value,
  min,
  max,
  step = 1,
  onChange,
  disabled = false,
  formatValue = (val) => val.toString(),
  'aria-label': ariaLabel,
}: PreferenceSliderProps) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (newValue: number) => {
    setLocalValue(newValue);
    onChange(newValue);
  };

  const percentage = ((localValue - min) / (max - min)) * 100;

  return (
    <div className="p-4 rounded-xl bg-dark-700/30 border border-dark-600/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
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
        <div className="text-primary-400 font-semibold text-lg">
          {formatValue(localValue)}
        </div>
      </div>
      
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={localValue}
          onChange={(e) => handleChange(Number(e.target.value))}
          disabled={disabled}
          aria-label={ariaLabel || label}
          className={`w-full h-2 bg-dark-600 rounded-lg appearance-none cursor-pointer slider ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          style={{
            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${percentage}%, #475569 ${percentage}%, #475569 100%)`,
          }}
        />
        <style jsx>{`
          .slider::-webkit-slider-thumb {
            appearance: none;
            height: 20px;
            width: 20px;
            border-radius: 50%;
            background: #3b82f6;
            cursor: pointer;
            border: 2px solid #1e293b;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          }
          
          .slider::-moz-range-thumb {
            height: 20px;
            width: 20px;
            border-radius: 50%;
            background: #3b82f6;
            cursor: pointer;
            border: 2px solid #1e293b;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          }
        `}</style>
      </div>
    </div>
  );
}