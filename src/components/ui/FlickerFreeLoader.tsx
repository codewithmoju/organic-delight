import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface FlickerFreeLoaderProps {
  isLoading: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  minLoadTime?: number;
  className?: string;
}

export default function FlickerFreeLoader({
  isLoading,
  children,
  fallback,
  minLoadTime = 500,
  className = ''
}: FlickerFreeLoaderProps) {
  const [showContent, setShowContent] = useState(false);
  const [loadStartTime] = useState(Date.now());
  const [isReady, setIsReady] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (!isLoading) {
      const elapsed = Date.now() - loadStartTime;
      const remainingTime = Math.max(0, minLoadTime - elapsed);
      
      // Ensure minimum loading time to prevent flickering
      setTimeout(() => {
        setShowContent(true);
        // Add small delay before marking as ready to ensure smooth transition
        setTimeout(() => setIsReady(true), 50);
      }, remainingTime);
    } else {
      setShowContent(false);
      setIsReady(false);
    }
  }, [isLoading, loadStartTime, minLoadTime]);

  const contentAnimationProps = shouldReduceMotion ? {} : {
    initial: { opacity: 0 },
    animate: { opacity: showContent && isReady ? 1 : 0 },
    transition: { duration: 0.4, ease: "easeOut" }
  };

  const loadingAnimationProps = shouldReduceMotion ? {} : {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.3, ease: "easeOut" }
  };

  return (
    <div 
      className={`relative ${className}`}
      style={{
        transform: 'translate3d(0, 0, 0)',
        backfaceVisibility: 'hidden',
        contain: 'layout style paint'
      }}
    >
      {/* Always render children but control visibility */}
      <motion.div 
        {...contentAnimationProps}
        style={{
          transform: 'translate3d(0, 0, 0)',
          backfaceVisibility: 'hidden'
        }}
      >
        {children}
      </motion.div>

      {/* Loading overlay with smooth transitions */}
      <AnimatePresence mode="wait">
        {(isLoading || !showContent) && (
          <motion.div
            key="loading"
            {...loadingAnimationProps}
            className="absolute inset-0 flex items-center justify-center bg-dark-900/95 backdrop-blur-sm z-10"
            style={{
              transform: 'translate3d(0, 0, 0)',
              backfaceVisibility: 'hidden'
            }}
          >
            {fallback || (
              <div className="text-center">
                <motion.div
                  animate={shouldReduceMotion ? {} : { rotate: 360 }}
                  transition={shouldReduceMotion ? {} : {
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full mx-auto mb-3"
                  style={{
                    willChange: shouldReduceMotion ? 'auto' : 'transform',
                    backfaceVisibility: 'hidden',
                    transform: 'translate3d(0, 0, 0)'
                  }}
                />
                <p className="text-gray-400 text-sm font-medium">Loading...</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Hook for managing loading states without flickering
export function useFlickerFreeLoading(initialLoading = true, minLoadTime = 500) {
  const [isLoading, setIsLoading] = useState(initialLoading);
  const [isContentReady, setIsContentReady] = useState(false);
  const [loadStartTime] = useState(Date.now());

  const setLoading = (loading: boolean) => {
    if (!loading) {
      const elapsed = Date.now() - loadStartTime;
      const remainingTime = Math.max(0, minLoadTime - elapsed);
      
      setTimeout(() => {
        setIsLoading(false);
        setTimeout(() => setIsContentReady(true), 50);
      }, remainingTime);
    } else {
      setIsLoading(true);
      setIsContentReady(false);
    }
  };

  return {
    isLoading,
    isContentReady,
    setLoading
  };
}