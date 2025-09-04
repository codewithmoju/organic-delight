import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Clock, Zap } from 'lucide-react';

interface ProgressStep {
  id: string;
  label: string;
  duration: number;
  icon?: React.ReactNode;
}

interface ProgressLoaderProps {
  isLoading: boolean;
  steps: ProgressStep[];
  onComplete?: () => void;
  showSteps?: boolean;
  autoProgress?: boolean;
  className?: string;
}

export default function ProgressLoader({
  isLoading,
  steps,
  onComplete,
  showSteps = true,
  autoProgress = true,
  className = ''
}: ProgressLoaderProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!isLoading) {
      setCurrentStep(0);
      setProgress(0);
      setCompletedSteps(new Set());
      return;
    }

    if (!autoProgress) return;

    let totalDuration = 0;
    let currentDuration = 0;

    // Calculate total duration
    steps.forEach(step => {
      totalDuration += step.duration;
    });

    // Progress through steps
    const progressStep = (stepIndex: number) => {
      if (stepIndex >= steps.length) {
        setProgress(100);
        setCompletedSteps(new Set(Array.from({ length: steps.length }, (_, i) => i)));
        onComplete?.();
        return;
      }

      setCurrentStep(stepIndex);
      const step = steps[stepIndex];
      
      // Animate progress for current step
      const stepProgress = (currentDuration / totalDuration) * 100;
      const nextStepProgress = ((currentDuration + step.duration) / totalDuration) * 100;
      
      setProgress(stepProgress);
      
      setTimeout(() => {
        setProgress(nextStepProgress);
        setCompletedSteps(prev => new Set([...prev, stepIndex]));
        currentDuration += step.duration;
        progressStep(stepIndex + 1);
      }, step.duration);
    };

    progressStep(0);
  }, [isLoading, steps, autoProgress, onComplete]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 ${className}`}
        >
          <div className="max-w-md w-full mx-auto px-6">
            {/* Header */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-center mb-8"
            >
              <div className="flex items-center justify-center mb-4">
                <Package className="w-12 h-12 text-primary-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Loading StockSuite</h2>
              <p className="text-gray-400">Setting up your inventory management system</p>
            </motion.div>

            {/* Progress Bar */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="mb-6"
            >
              <div className="w-full bg-dark-700 rounded-full h-3 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="bg-gradient-to-r from-primary-500 via-accent-500 to-primary-600 h-3 rounded-full relative"
                >
                  {/* Shimmer effect */}
                  <motion.div
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  />
                </motion.div>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-gray-400">
                  {currentStep < steps.length ? steps[currentStep].label : 'Complete'}
                </span>
                <span className="text-sm font-semibold text-primary-400">
                  {Math.round(progress)}%
                </span>
              </div>
            </motion.div>

            {/* Steps List */}
            {showSteps && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="space-y-3"
              >
                {steps.map((step, index) => (
                  <motion.div
                    key={step.id}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className={`flex items-center p-3 rounded-lg transition-all duration-300 ${
                      completedSteps.has(index)
                        ? 'bg-success-500/10 border border-success-500/20'
                        : index === currentStep
                        ? 'bg-primary-500/10 border border-primary-500/20'
                        : 'bg-dark-800/30 border border-dark-700/30'
                    }`}
                  >
                    <div className="flex-shrink-0 mr-3">
                      {completedSteps.has(index) ? (
                        <CheckCircle className="w-5 h-5 text-success-400" />
                      ) : index === currentStep ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        >
                          <Clock className="w-5 h-5 text-primary-400" />
                        </motion.div>
                      ) : (
                        step.icon || <div className="w-5 h-5 rounded-full bg-gray-600" />
                      )}
                    </div>
                    <span className={`text-sm font-medium ${
                      completedSteps.has(index)
                        ? 'text-success-400'
                        : index === currentStep
                        ? 'text-primary-400'
                        : 'text-gray-400'
                    }`}>
                      {step.label}
                    </span>
                    {index === currentStep && (
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="ml-auto"
                      >
                        <Zap className="w-4 h-4 text-primary-400" />
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Loading tip */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-6 text-center"
            >
              <p className="text-xs text-gray-500">
                💡 Pro tip: Use keyboard shortcuts to navigate faster once loaded
              </p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}