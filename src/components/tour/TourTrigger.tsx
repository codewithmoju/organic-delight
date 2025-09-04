import React from 'react';
import { Play, RotateCcw } from 'lucide-react';
import { useTour } from './TourProvider';

interface TourTriggerProps {
  variant?: 'button' | 'card';
  className?: string;
}

export default function TourTrigger({ variant = 'button', className = '' }: TourTriggerProps) {
  const { startTour } = useTour();

  if (variant === 'card') {
    return (
      <div
        className={`btn-secondary p-4 sm:p-6 rounded-xl text-center flex flex-col items-center gap-2 sm:gap-3 min-h-[120px] sm:min-h-[140px] cursor-pointer ${className}`}
        onClick={startTour}
      >
        <Play className="w-6 h-6 sm:w-8 sm:h-8" />
        <span className="text-base sm:text-lg font-semibold">Take the App Tour</span>
        <span className="text-xs sm:text-sm text-gray-400">Learn how to use StockSuite in just 2 minutes</span>
      </div>
    );
  }

  return (
    <button
      onClick={startTour}
      className={`btn-primary flex items-center gap-2 ${className}`}
    >
      <Play className="w-4 h-4" />
      Start Tour
    </button>
  );
}

export function RestartTourButton({ className = '' }: { className?: string }) {
  const { startTour } = useTour();

  return (
    <button
      onClick={startTour}
      className={`btn-secondary flex items-center gap-2 ${className}`}
    >
      <RotateCcw className="w-4 h-4" />
      Restart Tour
    </button>
  );
}