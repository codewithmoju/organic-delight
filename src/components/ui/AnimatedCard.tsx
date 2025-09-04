import { motion, useReducedMotion } from 'framer-motion';
import { ReactNode } from 'react';
import { PERFORMANCE_CONFIG } from '../../lib/utils/performance';

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  hover?: boolean;
}

export default function AnimatedCard({ 
  children, 
  className = '', 
  delay = 0, 
  hover = true 
}: AnimatedCardProps) {
  const shouldReduceMotion = useReducedMotion();

  // Skip animations for reduced motion preference
  if (shouldReduceMotion) {
    return (
      <div className={`card-dark ${className}`}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: PERFORMANCE_CONFIG.ANIMATION_DURATION.NORMAL / 1000, 
        delay,
        ease: "easeOut"
      }}
      whileHover={hover ? { 
        y: -2, 
        scale: 1.005,
        transition: { duration: PERFORMANCE_CONFIG.ANIMATION_DURATION.FAST / 1000 }
      } : undefined}
      className={`card-dark ${className}`}
      style={{
        willChange: hover ? 'transform' : 'auto',
        backfaceVisibility: 'hidden',
        transform: 'translate3d(0, 0, 0)'
      }}
    >
      {children}
    </motion.div>
  );
}