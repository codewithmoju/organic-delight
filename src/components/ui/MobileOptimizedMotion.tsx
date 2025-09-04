import { motion, useReducedMotion } from 'framer-motion';
import { ReactNode, useMemo } from 'react';
import { usePerformanceOptimization } from '../../hooks/usePerformanceOptimization';

interface MobileOptimizedMotionProps {
  children: ReactNode;
  className?: string;
  initial?: any;
  animate?: any;
  exit?: any;
  whileHover?: any;
  whileTap?: any;
  transition?: any;
  layout?: boolean;
  layoutId?: string;
}

// Mobile-optimized motion component that automatically adjusts animations
export default function MobileOptimizedMotion({
  children,
  className = '',
  initial,
  animate,
  exit,
  whileHover,
  whileTap,
  transition,
  layout,
  layoutId,
  ...props
}: MobileOptimizedMotionProps) {
  const shouldReduceMotion = useReducedMotion();
  const { shouldReduceAnimations, isLowEndDevice } = usePerformanceOptimization();

  // Optimize animations based on device capabilities
  const optimizedProps = useMemo(() => {
    // Skip animations entirely on very low-end devices or if user prefers reduced motion
    if (shouldReduceMotion || shouldReduceAnimations) {
      return {
        initial: false,
        animate: false,
        exit: false,
        whileHover: false,
        whileTap: false,
        transition: { duration: 0 },
        layout: false
      };
    }

    // Mobile-optimized animations
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile || isLowEndDevice) {
      return {
        initial: initial ? { ...initial, transform: 'translate3d(0, 0, 0)' } : false,
        animate: animate ? { ...animate, transform: 'translate3d(0, 0, 0)' } : false,
        exit: exit ? { ...exit, transform: 'translate3d(0, 0, 0)' } : false,
        whileHover: false, // Disable hover animations on mobile
        whileTap: whileTap ? {
          scale: 0.98,
          transform: 'translate3d(0, 0, 0) scale(0.98)',
          transition: { duration: 0.1 }
        } : false,
        transition: {
          duration: 0.2,
          ease: [0.25, 0.46, 0.45, 0.94],
          ...transition
        },
        layout: false // Disable layout animations on mobile for better performance
      };
    }

    // Desktop animations (full featured)
    return {
      initial,
      animate,
      exit,
      whileHover,
      whileTap,
      transition: {
        duration: 0.3,
        ease: [0.25, 0.46, 0.45, 0.94],
        ...transition
      },
      layout
    };
  }, [shouldReduceMotion, shouldReduceAnimations, isLowEndDevice, initial, animate, exit, whileHover, whileTap, transition, layout]);

  return (
    <motion.div
      className={className}
      layoutId={layoutId}
      style={{
        willChange: shouldReduceAnimations ? 'auto' : 'transform, opacity',
        backfaceVisibility: 'hidden',
        transform: 'translate3d(0, 0, 0)',
        contain: 'layout style paint'
      }}
      {...optimizedProps}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Mobile-optimized button component
export function MobileOptimizedButton({
  children,
  onClick,
  className = '',
  disabled = false,
  ...props
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  [key: string]: any;
}) {
  const { shouldReduceAnimations } = usePerformanceOptimization();

  if (shouldReduceAnimations) {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`${className} transform translate3d(0, 0, 0)`}
        style={{
          touchAction: 'manipulation',
          backfaceVisibility: 'hidden'
        }}
        {...props}
      >
        {children}
      </button>
    );
  }

  return (
    <motion.button
      whileTap={{ 
        scale: 0.98,
        transform: 'translate3d(0, 0, 0) scale(0.98)',
        transition: { duration: 0.1 }
      }}
      onClick={onClick}
      disabled={disabled}
      className={className}
      style={{
        touchAction: 'manipulation',
        backfaceVisibility: 'hidden',
        transform: 'translate3d(0, 0, 0)',
        willChange: 'transform'
      }}
      {...props}
    >
      {children}
    </motion.button>
  );
}