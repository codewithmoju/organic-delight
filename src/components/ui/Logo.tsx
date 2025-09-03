import { Package } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export default function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  return (
    <div className={`flex items-center ${className}`}>
      <div className="relative">
        <Package className={`${sizeClasses[size]} text-blue-600`} />
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
      </div>
      {showText && (
        <span className={`ml-2 ${textSizeClasses[size]} font-bold text-gray-900`}>
          StockSuite
        </span>
      )}
    </div>
  );
}