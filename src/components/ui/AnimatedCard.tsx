import { motion, useReducedMotion } from 'framer-motion';
import { ReactNode } from 'react';

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

  // Skip animations for reduced motion preference or low-end devices
  if (shouldReduceMotion) {
    return (
      <div className={`card-dark ${className}`}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: window.innerWidth <= 768 ? 0.2 : 0.3, 
        delay,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      whileHover={hover ? { 
        y: -4, 
        scale: window.innerWidth <= 768 ? 1 : 1.02,
        transition: { duration: 0.15 }
      } : undefined}
      className={`card-dark ${className}`}
      style={{
        willChange: hover && window.innerWidth > 768 ? 'transform, opacity' : 'auto',
        backfaceVisibility: 'hidden',
        transform: 'translate3d(0, 0, 0)',
        contain: 'layout style paint'
      }}
    >
      {children}
    </motion.div>
  );
}