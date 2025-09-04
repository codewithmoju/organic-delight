import { motion } from 'framer-motion';

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

  // Mobile-optimized spinner with hardware acceleration
  if (variant === 'spinner') {
    return (
      <div className="flex flex-col items-center justify-center space-y-3">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ 
            duration: 1, 
            repeat: Infinity, 
            ease: "linear",
            // Mobile optimization: reduce complexity
            ...(window.innerWidth <= 768 && { duration: 0.8 })
          }}
          className={`${sizeClasses[size]} border-2 border-solid rounded-full ${colorClasses[color]} mobile-optimized-spinner`}
          style={{
            transform: 'translate3d(0, 0, 0)',
            backfaceVisibility: 'hidden',
            willChange: 'transform'
          }}
        />
        {text && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-sm text-gray-400 font-medium"
          >
            {text}
          </motion.p>
        )}
      </div>
    );
  }

  // Dots loader for mobile-friendly alternative
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
                duration: 0.6,
                repeat: Infinity,
                delay: index * 0.2,
                ease: "easeInOut"
              }}
              className={`w-3 h-3 rounded-full ${
                color === 'primary' ? 'bg-primary-500' :
                color === 'white' ? 'bg-white' : 'bg-gray-400'
              }`}
              style={{
                transform: 'translate3d(0, 0, 0)',
                backfaceVisibility: 'hidden'
              }}
            />
          ))}
        </div>
        {text && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
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
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className={`${sizeClasses[size]} rounded-full ${
            color === 'primary' ? 'bg-primary-500' :
            color === 'white' ? 'bg-white' : 'bg-gray-400'
          }`}
          style={{
            transform: 'translate3d(0, 0, 0)',
            backfaceVisibility: 'hidden'
          }}
        />
        {text && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
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
      <div className="animate-pulse space-y-3">
        <div className="h-4 bg-gray-700 rounded w-3/4"></div>
        <div className="h-4 bg-gray-700 rounded w-1/2"></div>
        <div className="h-4 bg-gray-700 rounded w-5/6"></div>
      </div>
    );
  }

  // Fallback to original spinner
  return (
    <div className="flex flex-col items-center justify-center space-y-3">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ 
          duration: 1, 
          repeat: Infinity, 
          ease: "linear",
          // Mobile optimization
          ...(window.innerWidth <= 768 && { duration: 0.8 })
        }}
        className={`${sizeClasses[size]} border-2 border-solid rounded-full ${colorClasses[color]}`}
        style={{
          transform: 'translate3d(0, 0, 0)',
          backfaceVisibility: 'hidden',
          willChange: 'transform'
        }}
      />
      {text && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-sm text-gray-400 font-medium"
        >
          {text}
        </motion.p>
      )}
    </div>
  );
}