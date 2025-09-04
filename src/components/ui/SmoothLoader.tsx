import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';
import Logo from './Logo';

interface SmoothLoaderProps {
  isLoading: boolean;
  text?: string;
  variant?: 'full-screen' | 'inline' | 'overlay';
  showLogo?: boolean;
  progress?: number;
}

export default function SmoothLoader({
  isLoading,
  text = "Loading...",
  variant = 'full-screen',
  showLogo = true,
  progress
}: SmoothLoaderProps) {
  const [loadingText, setLoadingText] = useState(text);
  const shouldReduceMotion = useReducedMotion();

  // Animate loading text for better UX
  useEffect(() => {
    if (!isLoading || shouldReduceMotion) return;

    const texts = [text, `${text}.`, `${text}..`, `${text}...`];
    let index = 0;

    const interval = setInterval(() => {
      setLoadingText(texts[index % texts.length]);
      index++;
    }, 800); // Slower text animation

    return () => clearInterval(interval);
  }, [isLoading, text, shouldReduceMotion]);

  if (variant === 'full-screen') {
    return (
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950"
            style={{
              willChange: 'opacity',
              backfaceVisibility: 'hidden',
              contain: 'layout style paint'
            }}
          >
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <motion.div 
                animate={shouldReduceMotion ? {} : { 
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={shouldReduceMotion ? {} : { 
                  duration: 4, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl"
              />
              <motion.div 
                animate={shouldReduceMotion ? {} : { 
                  scale: [1.2, 1, 1.2],
                  opacity: [0.2, 0.5, 0.2]
                }}
                transition={shouldReduceMotion ? {} : { 
                  duration: 5, 
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1
                }}
                className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl"
              />
            </div>

            <div className="relative z-10 text-center">
              {showLogo && (
                <motion.div
                  initial={shouldReduceMotion ? {} : { scale: 0.8, opacity: 0 }}
                  animate={shouldReduceMotion ? {} : { scale: 1, opacity: 1 }}
                  transition={shouldReduceMotion ? {} : { 
                    duration: 0.6,
                    type: "spring",
                    stiffness: 100
                  }}
                  className="mb-8"
                >
                  <Logo size="lg" animated={!shouldReduceMotion} />
                </motion.div>
              )}

              {/* Optimized spinner */}
              <motion.div
                initial={shouldReduceMotion ? {} : { scale: 0.8, opacity: 0 }}
                animate={shouldReduceMotion ? {} : { scale: 1, opacity: 1 }}
                transition={shouldReduceMotion ? {} : { delay: 0.2, duration: 0.4 }}
                className="mb-6"
              >
                <div className="relative">
                  <motion.div
                    animate={shouldReduceMotion ? {} : { rotate: 360 }}
                    transition={shouldReduceMotion ? {} : {
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                    className="w-16 h-16 border-4 border-primary-500/30 border-t-primary-500 rounded-full"
                    style={{
                      willChange: shouldReduceMotion ? 'auto' : 'transform',
                      backfaceVisibility: 'hidden',
                      transform: 'translate3d(0, 0, 0)'
                    }}
                  />
                  
                  {/* Inner pulse animation */}
                  <motion.div
                    animate={shouldReduceMotion ? {} : {
                      scale: [0.8, 1.2, 0.8],
                      opacity: [0.5, 0.8, 0.5]
                    }}
                    transition={shouldReduceMotion ? {} : {
                      duration: 2.5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="absolute inset-2 bg-primary-500/20 rounded-full"
                    style={{
                      willChange: shouldReduceMotion ? 'auto' : 'transform, opacity',
                      backfaceVisibility: 'hidden'
                    }}
                  />
                </div>
              </motion.div>

              {/* Progress bar */}
              {progress !== undefined && (
                <motion.div
                  initial={shouldReduceMotion ? {} : { opacity: 0, y: 10 }}
                  animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
                  transition={shouldReduceMotion ? {} : { delay: 0.3, duration: 0.3 }}
                  className="w-64 mx-auto mb-4"
                >
                  <div className="w-full bg-dark-700 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className="bg-gradient-to-r from-primary-500 to-accent-500 h-2 rounded-full"
                      style={{
                        willChange: 'width',
                        backfaceVisibility: 'hidden'
                      }}
                    />
                  </div>
                  <div className="text-center mt-2 text-sm text-gray-400">
                    {Math.round(progress)}%
                  </div>
                </motion.div>
              )}

              {/* Loading text */}
              <motion.p
                initial={shouldReduceMotion ? {} : { opacity: 0, y: 10 }}
                animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
                transition={shouldReduceMotion ? {} : { delay: 0.4, duration: 0.3 }}
                className="text-xl font-semibold text-white mb-2"
              >
                {loadingText}
              </motion.p>
              
              <motion.p
                initial={shouldReduceMotion ? {} : { opacity: 0 }}
                animate={shouldReduceMotion ? {} : { opacity: 1 }}
                transition={shouldReduceMotion ? {} : { delay: 0.5, duration: 0.3 }}
                className="text-gray-400"
              >
                Please wait while we prepare your experience
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  if (variant === 'overlay') {
    return (
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-dark-900/80 backdrop-blur-sm"
            style={{
              willChange: 'opacity',
              backfaceVisibility: 'hidden'
            }}
          >
            <motion.div
              initial={shouldReduceMotion ? {} : { scale: 0.8, opacity: 0 }}
              animate={shouldReduceMotion ? {} : { scale: 1, opacity: 1 }}
              exit={shouldReduceMotion ? {} : { scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="text-center"
            >
              <motion.div
                animate={shouldReduceMotion ? {} : { rotate: 360 }}
                transition={shouldReduceMotion ? {} : {
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="w-12 h-12 border-3 border-primary-500/30 border-t-primary-500 rounded-full mx-auto mb-4"
                style={{
                  willChange: shouldReduceMotion ? 'auto' : 'transform',
                  backfaceVisibility: 'hidden',
                  transform: 'translate3d(0, 0, 0)'
                }}
              />
              <p className="text-white font-medium">{loadingText}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // Inline variant
  return (
    <div className="inline-flex items-center space-x-2">
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={shouldReduceMotion ? {} : { opacity: 0 }}
            animate={shouldReduceMotion ? {} : { opacity: 1 }}
            exit={shouldReduceMotion ? {} : { opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center space-x-2"
            style={{
              willChange: shouldReduceMotion ? 'auto' : 'opacity',
              backfaceVisibility: 'hidden'
            }}
          >
            <motion.div
              animate={shouldReduceMotion ? {} : { rotate: 360 }}
              transition={shouldReduceMotion ? {} : {
                duration: 1.5,
                repeat: Infinity,
                ease: "linear"
              }}
              className="w-6 h-6 border-2 border-primary-500/30 border-t-primary-500 rounded-full"
              style={{
                willChange: shouldReduceMotion ? 'auto' : 'transform',
                backfaceVisibility: 'hidden',
                transform: 'translate3d(0, 0, 0)'
              }}
            />
            <span className="text-sm text-gray-400">{loadingText}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}