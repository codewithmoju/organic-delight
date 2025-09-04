import { memo } from 'react';
import { motion } from 'framer-motion';
import { usePerformanceOptimization } from '../../hooks/usePerformanceOptimization';

interface OptimizedAnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  hover?: boolean;
}

// Performance-optimized version of AnimatedCard
const OptimizedAnimatedCard = memo(({ 
  children, 
  className = '', 
  delay = 0, 
  hover = true 
}: OptimizedAnimatedCardProps) => {
  const { getAnimationVariants, shouldReduceAnimations } = usePerformanceOptimization();
  
  const animationProps = getAnimationVariants('slide');

  // Skip animations entirely on very low-end devices
  if (shouldReduceAnimations) {
    return (
      <div className={`card-dark ${className}`}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      {...animationProps}
      transition={{ ...animationProps.transition, delay }}
      whileHover={hover ? animationProps.whileHover : undefined}
      className={`card-dark ${className}`}
      style={{
        willChange: 'transform, opacity',
        backfaceVisibility: 'hidden',
        transform: 'translate3d(0, 0, 0)', // Force hardware acceleration
      }}
    >
      {children}
    </motion.div>
  );
});

OptimizedAnimatedCard.displayName = 'OptimizedAnimatedCard';

export default OptimizedAnimatedCard;