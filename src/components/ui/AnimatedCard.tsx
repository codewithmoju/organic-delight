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
        duration: 0.3, 
        delay,
        ease: "easeOut"
      }}
      whileHover={hover ? { 
        y: -2, 
        scale: 1.005,
        transition: { duration: 0.2 }
      } : undefined}
      className={`card-dark ${className}`}
    >
      {children}
    </motion.div>
  );
}