import { ReactNode } from 'react';

interface PreferenceSliderProps {
  label: string;
  description: string;
  icon: ReactNode;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  formatValue?: (value: number) => string;
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
  formatValue = (val) => val.toString()
}: PreferenceSliderProps) {
  return (
    <div className="p-4 rounded-xl bg-dark-700/30 border border-dark-600/50">
      <div className="flex items-center space-x-4 mb-4">
        <div className="p-2 rounded-lg bg-primary-500/20 text-primary-400 flex-shrink-0">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-white font-medium">{label}</h4>
          <p className="text-gray-400 text-sm mt-1">{description}</p>
        </div>
        <div className="text-primary-400 font-semibold">
          {formatValue(value)}
        </div>
      </div>
      
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        disabled={disabled}
        className={`w-full h-2 bg-dark-600 rounded-lg appearance-none cursor-pointer slider ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      />
      
      <div className="flex justify-between text-xs text-gray-500 mt-2">
        <span>{formatValue(min)}</span>
        <span>{formatValue(max)}</span>
      </div>
    </div>
  );
}