import { motion, useReducedMotion } from 'framer-motion';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'white' | 'gray';
  text?: string;
  variant?: 'spinner' | 'dots' | 'pulse' | 'skeleton';
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
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const colorClasses = {
    primary: 'border-primary-500 border-t-transparent',
    white: 'border-white border-t-transparent',
    gray: 'border-gray-400 border-t-transparent'
  };

  // Skip animations for reduced motion
  if (shouldReduceMotion) {
    return (
      <div className="flex flex-col items-center justify-center space-y-3">
        <div className={`${sizeClasses[size]} border-2 border-solid rounded-full ${colorClasses[color]}`} />
        {text && (
          <p className="text-sm text-gray-400 font-medium">
            {text}
          </p>
        )}
      </div>
    );
  }

  // Optimized spinner with proper timing
  if (variant === 'spinner') {
    return (
      <div className="flex flex-col items-center justify-center space-y-3">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ 
            duration: 1.5, 
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
            transition={{ delay: 0.2, duration: 0.3 }}
            className="text-sm text-gray-400 font-medium"
          >
            {text}
          </motion.p>
        )}
      </div>
    );
  }

  // Dots loader for better UX
  if (variant === 'dots') {
    return (
      <div className="flex flex-col items-center justify-center space-y-3">
        <div className="flex space-x-2">
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: index * 0.2,
                ease: "easeInOut"
              }}
              className={`w-3 h-3 rounded-full ${
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
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="text-sm text-gray-400 font-medium"
          >
            {text}
          </motion.p>
        )}
      </div>
    );
  }

  // Pulse loader for minimal performance impact
  if (variant === 'pulse') {
    return (
      <div className="flex flex-col items-center justify-center space-y-3">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.7, 1, 0.7]
          }}
          transition={{
            duration: 2,
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
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="text-sm text-gray-400 font-medium"
          >
            {text}
          </motion.p>
        )}
      </div>
    );
  }

  // Skeleton loader for content placeholders
  if (variant === 'skeleton') {
    return (
      <div className="space-y-3">
        <motion.div 
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="h-4 bg-gray-700 rounded w-3/4"
        />
        <motion.div 
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
          className="h-4 bg-gray-700 rounded w-1/2"
        />
        <motion.div 
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
          className="h-4 bg-gray-700 rounded w-5/6"
        />
      </div>
    );
  }

  // Fallback to original spinner
  return (
    <div className="flex flex-col items-center justify-center space-y-3">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ 
          duration: 1.5, 
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
          transition={{ delay: 0.2, duration: 0.3 }}
          className="text-sm text-gray-400 font-medium"
        >
          {text}
        </motion.p>
      )}
    </div>
  );
}