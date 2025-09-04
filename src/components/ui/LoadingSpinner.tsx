import { motion, useReducedMotion } from 'framer-motion';
import { PERFORMANCE_CONFIG } from '../../lib/utils/performance';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'white' | 'gray';
  text?: string;
  variant?: 'spinner' | 'dots' | 'pulse';
}

export default function LoadingSpinner({ 
  size = 'md', 
  color = 'primary',
  text,
  variant = 'spinner'
}: LoadingSpinnerProps) {
  const shouldReduceMotion = useReducedMotion();
  
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const colorClasses = {
    primary: 'border-primary-500 border-t-transparent',
    white: 'border-white border-t-transparent',
    gray: 'border-gray-400 border-t-transparent'
  };

  // Skip animations for reduced motion
  if (shouldReduceMotion) {
    return (
      <div className="flex flex-col items-center justify-center space-y-2">
        <div className={`${sizeClasses[size]} border-2 border-solid rounded-full ${colorClasses[color]}`} />
        {text && (
          <p className="text-sm text-gray-400 font-medium">
            {text}
          </p>
        )}
      </div>
    );
  }

  // Optimized spinner
  if (variant === 'spinner') {
    return (
      <div className="flex flex-col items-center justify-center space-y-2">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ 
            duration: 1, 
            repeat: Infinity, 
            ease: "linear"
          }}
          className={`${sizeClasses[size]} border-2 border-solid rounded-full ${colorClasses[color]}`}
          style={{
            willChange: 'transform',
            backfaceVisibility: 'hidden',
            transform: 'translate3d(0, 0, 0)'
          }}
        />
        {text && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.2 }}
            className="text-sm text-gray-400 font-medium"
          >
            {text}
          </motion.p>
        )}
      </div>
    );
  }

  // Simplified dots loader
  if (variant === 'dots') {
    return (
      <div className="flex flex-col items-center justify-center space-y-2">
        <div className="flex space-x-1">
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: index * 0.15,
                ease: "easeInOut"
              }}
              className={`w-2 h-2 rounded-full ${
                color === 'primary' ? 'bg-primary-500' :
                color === 'white' ? 'bg-white' : 'bg-gray-400'
              }`}
              style={{
                willChange: 'transform, opacity',
                backfaceVisibility: 'hidden'
              }}
            />
          ))}
        </div>
        {text && (
          <p className="text-sm text-gray-400 font-medium">
            {text}
          </p>
        )}
      </div>
    );
  }

  // Pulse loader
  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.7, 1, 0.7]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className={`${sizeClasses[size]} rounded-full ${
          color === 'primary' ? 'bg-primary-500' :
          color === 'white' ? 'bg-white' : 'bg-gray-400'
        }`}
        style={{
          willChange: 'transform, opacity',
          backfaceVisibility: 'hidden'
        }}
      />
      {text && (
        <p className="text-sm text-gray-400 font-medium">
          {text}
        </p>
      )}
    </div>
  );
}