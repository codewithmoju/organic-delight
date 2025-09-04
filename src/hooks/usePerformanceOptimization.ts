import { useEffect, useState, useCallback, useMemo } from 'react';
import { debounce } from '../lib/utils/debounce';

interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  isLowEndDevice: boolean;
  connectionSpeed: 'slow' | 'fast' | 'unknown';
}

export function usePerformanceOptimization() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    memoryUsage: 0,
    isLowEndDevice: false,
    connectionSpeed: 'unknown'
  });

  const [shouldReduceAnimations, setShouldReduceAnimations] = useState(false);

  // Detect device capabilities
  useEffect(() => {
    const detectDeviceCapabilities = () => {
      // Check for low-end device indicators
      const isLowEnd = 
        navigator.hardwareConcurrency <= 2 || // 2 or fewer CPU cores
        (navigator as any).deviceMemory <= 2 || // 2GB or less RAM
        /Android.*Chrome\/[0-5]/.test(navigator.userAgent) || // Old Android Chrome
        /iPhone.*OS [0-9]_/.test(navigator.userAgent) || // Old iOS
        window.innerWidth <= 768; // Mobile devices

      // Check connection speed
      const connection = (navigator as any).connection;
      let connectionSpeed: 'slow' | 'fast' | 'unknown' = 'unknown';
      
      if (connection) {
        if (connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g') {
          connectionSpeed = 'slow';
        } else if (connection.effectiveType === '4g' || connection.effectiveType === '3g') {
          connectionSpeed = 'fast';
        }
      }

      // Check for reduced motion preference
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      setMetrics(prev => ({
        ...prev,
        isLowEndDevice: isLowEnd,
        connectionSpeed
      }));

      setShouldReduceAnimations(isLowEnd || prefersReducedMotion);
    };

    detectDeviceCapabilities();
  }, []);

  // FPS monitoring
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animationId: number;

    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime >= lastTime + 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        setMetrics(prev => ({ ...prev, fps }));
        
        // Reduce animations if FPS is consistently low
        if (fps < 30) {
          setShouldReduceAnimations(true);
        }
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      animationId = requestAnimationFrame(measureFPS);
    };

    animationId = requestAnimationFrame(measureFPS);
    return () => cancelAnimationFrame(animationId);
  }, []);

  // Memory monitoring
  useEffect(() => {
    const monitorMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const usedMB = memory.usedJSHeapSize / 1048576; // Convert to MB
        setMetrics(prev => ({ ...prev, memoryUsage: usedMB }));
      }
    };

    const interval = setInterval(monitorMemory, 5000);
    return () => clearInterval(interval);
  }, []);

  // Optimized animation variants
  const getAnimationVariants = useCallback((type: 'slide' | 'fade' | 'scale') => {
    if (shouldReduceAnimations) {
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.1 }
      };
    }

    switch (type) {
      case 'slide':
        return {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: -20 },
          transition: { 
            duration: window.innerWidth <= 768 ? 0.2 : 0.3, 
            ease: [0.25, 0.46, 0.45, 0.94] 
          }
        };
      case 'fade':
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
          transition: { duration: window.innerWidth <= 768 ? 0.15 : 0.2 }
        };
      case 'scale':
        return {
          initial: { opacity: 0, scale: 0.95 },
          animate: { opacity: 1, scale: 1 },
          exit: { opacity: 0, scale: 0.95 },
          transition: { 
            duration: window.innerWidth <= 768 ? 0.2 : 0.25, 
            ease: 'easeOut' 
          }
        };
      default:
        return {};
    }
  }, [shouldReduceAnimations]);

  // Debounced resize handler
  const debouncedResize = useMemo(
    () => debounce(() => {
      // Trigger re-calculation of layouts
      window.dispatchEvent(new Event('optimized-resize'));
    }, 250),
    []
  );

  useEffect(() => {
    window.addEventListener('resize', debouncedResize);
    return () => window.removeEventListener('resize', debouncedResize);
  }, [debouncedResize]);

  return {
    metrics,
    shouldReduceAnimations,
    getAnimationVariants,
    isLowEndDevice: metrics.isLowEndDevice,
    connectionSpeed: metrics.connectionSpeed
  };
}

// Hook for optimized event handlers
export function useOptimizedEventHandlers() {
  const throttledScroll = useMemo(
    () => {
      let ticking = false;
      return (callback: () => void) => {
        if (!ticking) {
          requestAnimationFrame(() => {
            callback();
            ticking = false;
          });
          ticking = true;
        }
      };
    },
    []
  );

  const debouncedInput = useMemo(
    () => debounce((callback: (value: string) => void, value: string) => {
      callback(value);
    }, window.innerWidth <= 768 ? 200 : 300), // Faster response on mobile
    []
  );

  // Mobile-optimized touch handlers
  const optimizedTouchHandler = useMemo(
    () => (callback: () => void) => {
      // Add small delay to prevent accidental touches
      const isMobile = window.innerWidth <= 768;
      if (isMobile) {
        setTimeout(callback, 50);
      } else {
        callback();
      }
    },
    []
  );

  return {
    throttledScroll,
    debouncedInput,
    optimizedTouchHandler
  };
}