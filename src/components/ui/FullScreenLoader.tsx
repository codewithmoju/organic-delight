import { motion, AnimatePresence } from 'framer-motion';
import { Package } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

interface FullScreenLoaderProps {
  isLoading: boolean;
  title?: string;
  subtitle?: string;
  progress?: number;
  messages?: string[];
  variant?: 'spinner' | 'dots' | 'pulse' | 'bars' | 'progress';
}

const DEFAULT_MESSAGES = [
  "Initializing application...",
  "Loading your data...",
  "Setting up workspace...",
  "Preparing dashboard...",
  "Almost ready...",
  "Loading complete!"
];

export default function FullScreenLoader({
  isLoading,
  title = "StockSuite",
  subtitle = "Professional Inventory Management",
  progress = 0,
  messages = DEFAULT_MESSAGES,
  variant = 'spinner'
}: FullScreenLoaderProps) {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950"
        >
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div 
              animate={{ 
                scale: [1, 1.1, 1],
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl"
            />
            <motion.div 
              animate={{ 
                scale: [1.1, 1, 1.1],
                opacity: [0.2, 0.4, 0.2]
              }}
              transition={{ 
                duration: 5, 
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2
              }}
              className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl"
            />
          </div>

          <div className="relative z-10 text-center max-w-md mx-auto px-6">
            {/* Logo */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="mb-8"
            >
              <div className="flex items-center justify-center mb-4">
                <div className="relative">
                  <Package className="w-16 h-16 text-primary-500" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-accent-500 rounded-full border-2 border-dark-900" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gradient mb-2">{title}</h1>
              <p className="text-gray-400 text-lg">{subtitle}</p>
            </motion.div>

            {/* Loading Component */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              <LoadingSpinner
                size="lg"
                color="primary"
                variant={variant}
                messages={messages}
                messageInterval={2500}
                showProgress={variant === 'progress'}
                progress={progress}
              />
            </motion.div>

            {/* Progress Bar for non-progress variants */}
            {variant !== 'progress' && progress > 0 && (
              <motion.div
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                className="mt-8 w-full max-w-xs mx-auto"
              >
                <div className="w-full bg-dark-700 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="bg-gradient-to-r from-primary-500 to-accent-500 h-2 rounded-full relative overflow-hidden"
                  >
                    {/* Shimmer effect */}
                    <motion.div
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    />
                  </motion.div>
                </div>
                <div className="text-center mt-2 text-sm text-gray-400">
                  {Math.round(progress)}% complete
                </div>
              </motion.div>
            )}

            {/* Loading tips */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.4 }}
              className="mt-8 p-4 bg-dark-800/50 rounded-lg border border-dark-700/50"
            >
              <p className="text-xs text-gray-500 leading-relaxed">
                💡 Tip: Use the search function to quickly find items in your inventory
              </p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}