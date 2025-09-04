import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Package, TrendingUp } from 'lucide-react';

interface TopProgressLoaderProps {
  isLoading: boolean;
  progress?: number;
  title?: string;
  subtitle?: string;
  showLogo?: boolean;
  className?: string;
}

export default function TopProgressLoader({
  isLoading,
  progress = 0,
  title = "Loading",
  subtitle = "Please wait while we fetch your data...",
  showLogo = true,
  className = ''
}: TopProgressLoaderProps) {
  const [displayProgress, setDisplayProgress] = useState(0);

  // Smooth progress animation
  useEffect(() => {
    if (progress > displayProgress) {
      const increment = Math.max(1, (progress - displayProgress) / 10);
      const timer = setTimeout(() => {
        setDisplayProgress(prev => Math.min(progress, prev + increment));
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [progress, displayProgress]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={`fixed top-0 left-0 right-0 z-50 bg-dark-900/95 backdrop-blur-sm border-b border-primary-500/30 ${className}`}
          style={{
            transform: 'translate3d(0, 0, 0)',
            backfaceVisibility: 'hidden'
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {/* Animated spinner */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ 
                    duration: 1.2, 
                    repeat: Infinity, 
                    ease: "linear" 
                  }}
                  className="w-6 h-6 border-2 border-primary-500/30 border-t-primary-500 rounded-full"
                  style={{
                    transform: 'translate3d(0, 0, 0)',
                    backfaceVisibility: 'hidden',
                    willChange: 'transform'
                  }}
                />
                
                {/* Logo and text */}
                <div className="flex items-center space-x-3">
                  {showLogo && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.1, duration: 0.3 }}
                      className="flex items-center space-x-2"
                    >
                      <Package className="w-5 h-5 text-primary-400" />
                      <span className="text-primary-400 font-bold text-sm">StockSuite</span>
                    </motion.div>
                  )}
                  
                  <div>
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="text-white font-medium text-sm sm:text-base"
                    >
                      {title}
                    </motion.p>
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="text-gray-400 text-xs sm:text-sm"
                    >
                      {subtitle}
                    </motion.p>
                  </div>
                </div>
              </div>
              
              {/* Progress percentage */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
                className="text-right"
              >
                <div className="text-primary-400 font-bold text-lg">
                  {Math.round(displayProgress)}%
                </div>
                <div className="text-gray-500 text-xs">
                  Loading...
                </div>
              </motion.div>
            </div>
            
            {/* Progress bar */}
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="mt-4 w-full bg-dark-700 rounded-full h-2 overflow-hidden"
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${displayProgress}%` }}
                transition={{ 
                  duration: 0.5, 
                  ease: "easeOut",
                  type: "tween"
                }}
                className="bg-gradient-to-r from-primary-500 via-accent-500 to-primary-600 h-2 rounded-full relative overflow-hidden"
                style={{
                  transform: 'translate3d(0, 0, 0)',
                  backfaceVisibility: 'hidden'
                }}
              >
                {/* Animated shimmer effect */}
                <motion.div
                  animate={{
                    x: ['-100%', '100%']
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  style={{
                    transform: 'translate3d(-100%, 0, 0)',
                    backfaceVisibility: 'hidden'
                  }}
                />
              </motion.div>
            </motion.div>
            
            {/* Loading stages indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-2 flex justify-between text-xs text-gray-500"
            >
              <span className={displayProgress >= 30 ? 'text-primary-400' : ''}>
                Fetching data
              </span>
              <span className={displayProgress >= 60 ? 'text-primary-400' : ''}>
                Processing
              </span>
              <span className={displayProgress >= 80 ? 'text-primary-400' : ''}>
                Calculating metrics
              </span>
              <span className={displayProgress >= 100 ? 'text-success-400' : ''}>
                Complete
              </span>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook for managing loading progress
export function useLoadingProgress(steps: string[] = []) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
      setProgress(((currentStep + 1) / steps.length) * 100);
    }
  };

  const setStep = (stepIndex: number) => {
    setCurrentStep(stepIndex);
    setProgress((stepIndex / steps.length) * 100);
  };

  const complete = () => {
    setCurrentStep(steps.length);
    setProgress(100);
  };

  const reset = () => {
    setCurrentStep(0);
    setProgress(0);
  };

  return {
    currentStep,
    progress,
    currentStepName: steps[currentStep] || '',
    nextStep,
    setStep,
    complete,
    reset,
    isComplete: currentStep >= steps.length
  };
}