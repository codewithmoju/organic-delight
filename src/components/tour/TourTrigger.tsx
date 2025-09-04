import React from 'react';
import { motion } from 'framer-motion';
import { Play, RotateCcw } from 'lucide-react';
import { useTour } from './TourProvider';

interface TourTriggerProps {
  variant?: 'button' | 'card' | 'menu-item';
  className?: string;
  children?: React.ReactNode;
}

export default function TourTrigger({ 
  variant = 'button', 
  className = '',
  children 
}: TourTriggerProps) {
  const { startTour, isActive } = useTour();

  if (isActive) return null;

  const handleStartTour = () => {
    startTour();
  };

  if (variant === 'card') {
    return (
      <motion.div
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleStartTour}
        className={`card-dark p-6 cursor-pointer group ${className}`}
      >
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 group-hover:from-primary-500/30 group-hover:to-accent-500/30 transition-all duration-300">
            <Play className="w-6 h-6 text-primary-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white group-hover:text-primary-300 transition-colors">
              Take the App Tour
            </h3>
            <p className="text-gray-400 text-sm mt-1">
              Learn how to use StockSuite in just 2 minutes
            </p>
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
          </div>
        </div>
      </motion.div>
    );
  }

  if (variant === 'menu-item') {
    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleStartTour}
        className={`w-full flex items-center px-4 py-3 text-left text-gray-300 hover:bg-dark-700/50 hover:text-white transition-all duration-200 rounded-lg ${className}`}
      >
        <Play className="w-4 h-4 mr-3 text-primary-400" />
        <div>
          <div className="font-medium">App Tour</div>
          <div className="text-xs text-gray-500">Learn the basics</div>
        </div>
      </motion.button>
    );
  }

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleStartTour}
      className={`btn-primary flex items-center gap-2 ${className}`}
    >
      {children || (
        <>
          <Play className="w-4 h-4" />
          Start Tour
        </>
      )}
    </motion.button>
  );
}

// Restart Tour Button Component
export function RestartTourButton({ className = '' }: { className?: string }) {
  const { t } = useTranslation();
  const { startTour, isActive } = useTour();

  if (isActive) return null;

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={startTour}
      className={`btn-secondary flex items-center gap-2 ${className}`}
    >
      <RotateCcw className="w-4 h-4" />
      {t('tour.controls.restartTour')}
    </motion.button>
  );
}