import { memo, forwardRef } from 'react';
import { motion } from 'framer-motion';

interface PerformanceOptimizedCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  hover?: boolean;
  reducedMotion?: boolean;
}

// Memoized card component to prevent unnecessary re-renders
const PerformanceOptimizedCard = memo(forwardRef<HTMLDivElement, PerformanceOptimizedCardProps>(
  ({ children, className = '', delay = 0, hover = true, reducedMotion = false }, ref) => {
    // Use transform3d for hardware acceleration
    const animationProps = reducedMotion ? {} : {
      initial: { opacity: 0, y: 20, transform: 'translate3d(0, 20px, 0)' },
      animate: { opacity: 1, y: 0, transform: 'translate3d(0, 0, 0)' },
      transition: { 
        duration: 0.3, 
        delay,
        ease: [0.25, 0.46, 0.45, 0.94] // Custom easing for smoother animation
      },
      whileHover: hover ? { 
        y: -4, 
        scale: 1.02,
        transform: 'translate3d(0, -4px, 0) scale(1.02)',
        transition: { duration: 0.2 }
      } : undefined,
      style: {
        willChange: 'transform, opacity', // Hint to browser for optimization
        backfaceVisibility: 'hidden', // Prevent flickering
        perspective: 1000, // Enable 3D transforms
      }
    };

    return (
      <motion.div
        ref={ref}
        {...animationProps}
        className={`card-dark ${className}`}
      >
        {children}
      </motion.div>
    );
  }
));

PerformanceOptimizedCard.displayName = 'PerformanceOptimizedCard';

export default PerformanceOptimizedCard;