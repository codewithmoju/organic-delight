import { motion, AnimatePresence } from 'framer-motion';
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
  minLoadTime = 300,
  className = ''
}: FlickerFreeLoaderProps) {
  const [showContent, setShowContent] = useState(false);
  const [loadStartTime] = useState(Date.now());

  useEffect(() => {
    if (!isLoading) {
      const elapsed = Date.now() - loadStartTime;
      const remainingTime = Math.max(0, minLoadTime - elapsed);
      
      // Ensure minimum loading time to prevent flickering
      setTimeout(() => {
        setShowContent(true);
      }, remainingTime);
    } else {
      setShowContent(false);
    }
  }, [isLoading, loadStartTime, minLoadTime]);

  return (
    <div 
      className={`relative ${className}`}
      style={{
        transform: 'translate3d(0, 0, 0)',
        backfaceVisibility: 'hidden',
        contain: 'layout style paint'
      }}
    >
      <AnimatePresence mode="wait">
        {isLoading || !showContent ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: window.innerWidth <= 768 ? 0.15 : 0.2,
              ease: "easeOut"
            }}
            className="absolute inset-0 flex items-center justify-center"
            style={{
              transform: 'translate3d(0, 0, 0)',
              backfaceVisibility: 'hidden'
            }}
          >
            {fallback || (
              <div className="text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: window.innerWidth <= 768 ? 1 : 1.5,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full mx-auto mb-3"
                  style={{
                    transform: 'translate3d(0, 0, 0)',
                    backfaceVisibility: 'hidden',
                    willChange: 'transform'
                  }}
                />
                <p className="text-gray-400 text-sm font-medium">Loading...</p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: window.innerWidth <= 768 ? 0.2 : 0.3,
              ease: [0.25, 0.46, 0.45, 0.94]
            }}
            style={{
              transform: 'translate3d(0, 0, 0)',
              backfaceVisibility: 'hidden'
            }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Hook for managing loading states without flickering
export function useFlickerFreeLoading(initialLoading = true, minLoadTime = 300) {
  const [isLoading, setIsLoading] = useState(initialLoading);
  const [isContentReady, setIsContentReady] = useState(false);
  const [loadStartTime] = useState(Date.now());

  const setLoading = (loading: boolean) => {
    if (!loading) {
      const elapsed = Date.now() - loadStartTime;
      const remainingTime = Math.max(0, minLoadTime - elapsed);
      
      setTimeout(() => {
        setIsLoading(false);
        setIsContentReady(true);
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