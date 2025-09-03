import { Package } from 'lucide-react';
import { motion } from 'framer-motion';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
  animated?: boolean;
}

export default function Logo({ 
  size = 'md', 
  showText = true, 
  className = '',
  animated = false 
}: LogoProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  const MotionDiv = animated ? motion.div : 'div';
  const motionProps = animated ? {
    initial: { scale: 0, rotate: -180 },
    animate: { scale: 1, rotate: 0 },
    transition: { duration: 0.6, type: "spring", stiffness: 100 }
  } : {};

  return (
    <div className={`flex items-center ${className}`}>
      <MotionDiv className="relative" {...motionProps}>
        <Package className={`${sizeClasses[size]} text-primary-500`} />
        <motion.div 
          className="absolute -top-1 -right-1 w-3 h-3 bg-accent-500 rounded-full border-2 border-dark-900"
          animate={animated ? { scale: [1, 1.2, 1] } : {}}
          transition={animated ? { duration: 2, repeat: Infinity } : {}}
        />
      </MotionDiv>
      {showText && (
        <motion.span 
          className={`ml-3 ${textSizeClasses[size]} font-bold text-gradient`}
          initial={animated ? { opacity: 0, x: -20 } : {}}
          animate={animated ? { opacity: 1, x: 0 } : {}}
          transition={animated ? { delay: 0.3, duration: 0.5 } : {}}
        >
          StockSuite
        </motion.span>
      )}
    </div>
  );
}