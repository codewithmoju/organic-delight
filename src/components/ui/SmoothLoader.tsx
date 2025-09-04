import { motion, AnimatePresence } from 'framer-motion';
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

  // Animate loading text for better UX
  useEffect(() => {
    if (!isLoading) return;

    const texts = [text, `${text}.`, `${text}..`, `${text}...`];
    let index = 0;

    const interval = setInterval(() => {
      setLoadingText(texts[index % texts.length]);
      index++;
    }, 500);

    return () => clearInterval(interval);
  }, [isLoading, text]);

  if (variant === 'full-screen') {
    return (
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950"
            style={{
              transform: 'translate3d(0, 0, 0)',
              backfaceVisibility: 'hidden',
              contain: 'layout style paint'
            }}
          >
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <motion.div 
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl"
              />
              <motion.div 
                animate={{ 
                  scale: [1.2, 1, 1.2],
                  opacity: [0.2, 0.5, 0.2]
                }}
                transition={{ 
                  duration: 4, 
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
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ 
                    duration: 0.5,
                    type: "spring",
                    stiffness: 100
                  }}
                  className="mb-8"
                >
                  <Logo size="lg" animated />
                </motion.div>
              )}

              {/* Mobile-optimized spinner */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
                className="mb-6"
              >
                <div className="relative">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: window.innerWidth <= 768 ? 1.5 : 2,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                    className="w-16 h-16 border-4 border-primary-500/30 border-t-primary-500 rounded-full"
                    style={{
                      transform: 'translate3d(0, 0, 0)',
                      backfaceVisibility: 'hidden',
                      willChange: 'transform'
                    }}
                  />
                  
                  {/* Inner pulse animation */}
                  <motion.div
                    animate={{
                      scale: [0.8, 1.2, 0.8],
                      opacity: [0.5, 0.8, 0.5]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="absolute inset-2 bg-primary-500/20 rounded-full"
                    style={{
                      transform: 'translate3d(0, 0, 0)',
                      backfaceVisibility: 'hidden'
                    }}
                  />
                </div>
              </motion.div>

              {/* Progress bar */}
              {progress !== undefined && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="w-64 mx-auto mb-4"
                >
                  <div className="w-full bg-dark-700 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="bg-gradient-to-r from-primary-500 to-accent-500 h-2 rounded-full"
                      style={{
                        transform: 'translate3d(0, 0, 0)',
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
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-xl font-semibold text-white mb-2"
              >
                {loadingText}
              </motion.p>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
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
            transition={{ duration: 0.2 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-dark-900/80 backdrop-blur-sm"
            style={{
              transform: 'translate3d(0, 0, 0)',
              backfaceVisibility: 'hidden'
            }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="text-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="w-12 h-12 border-3 border-primary-500/30 border-t-primary-500 rounded-full mx-auto mb-4"
                style={{
                  transform: 'translate3d(0, 0, 0)',
                  backfaceVisibility: 'hidden',
                  willChange: 'transform'
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
-    <div className={`animate-pulse ${className}`}>
+    <motion.div 
+      initial={{ opacity: 0 }}
+      animate={{ opacity: 1 }}
+      className={`animate-pulse ${className}`}
+      style={{
+        transform: 'translate3d(0, 0, 0)',
+        backfaceVisibility: 'hidden'
+      }}
+    >
       {Array.from({ length: rows }).map((_, index) => (
-        <div key={index} className="h-4 bg-gray-200 rounded mb-2 last:mb-0"></div>
+        <div 
+          key={index} 
+          className="h-4 bg-gray-700 rounded mb-2 last:mb-0"
+          style={{
+            backgroundImage: animated ? 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)' : undefined,
+            backgroundSize: animated ? '200% 100%' : undefined,
+            animation: animated ? 'mobile-shimmer 1.5s infinite' : undefined,
+          }}
+        />
       ))}
-    </div>
+    </motion.div>
   );
 }