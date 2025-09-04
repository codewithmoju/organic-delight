import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'white' | 'gray' | 'success' | 'warning' | 'error';
  text?: string;
  variant?: 'spinner' | 'dots' | 'pulse' | 'bars' | 'progress';
  showProgress?: boolean;
  progress?: number;
  messages?: string[];
  messageInterval?: number;
}

export default function LoadingSpinner({ 
  size = 'md', 
  color = 'primary',
  text,
  variant = 'spinner',
  showProgress = false,
  progress = 0,
  messages = [],
  messageInterval = 2000
}: LoadingSpinnerProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [displayedMessage, setDisplayedMessage] = useState(text || messages[0] || 'Loading...');

  // Rotate through messages if provided
  useEffect(() => {
    if (messages.length > 1) {
      const interval = setInterval(() => {
        setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
      }, messageInterval);
      return () => clearInterval(interval);
    }
  }, [messages, messageInterval]);

  // Update displayed message
  useEffect(() => {
    if (messages.length > 0) {
      setDisplayedMessage(messages[currentMessageIndex]);
    } else if (text) {
      setDisplayedMessage(text);
    }
  }, [currentMessageIndex, messages, text]);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const colorClasses = {
    primary: 'border-primary-500',
    white: 'border-white',
    gray: 'border-gray-400',
    success: 'border-success-500',
    warning: 'border-warning-500',
    error: 'border-error-500'
  };

  const textColorClasses = {
    primary: 'text-primary-400',
    white: 'text-white',
    gray: 'text-gray-400',
    success: 'text-success-400',
    warning: 'text-warning-400',
    error: 'text-error-400'
  };

  const renderSpinner = () => {
    switch (variant) {
      case 'dots':
        return (
          <div className="flex space-x-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className={`w-3 h-3 rounded-full bg-current ${textColorClasses[color]}`}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
        );

      case 'pulse':
        return (
          <motion.div
            className={`${sizeClasses[size]} rounded-full bg-current ${textColorClasses[color]}`}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        );

      case 'bars':
        return (
          <div className="flex space-x-1">
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className={`w-1 bg-current ${textColorClasses[color]}`}
                style={{ height: size === 'sm' ? '16px' : size === 'md' ? '24px' : '32px' }}
                animate={{
                  scaleY: [1, 2, 1]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.1,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
        );

      case 'progress':
        return (
          <div className="w-full">
            <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
              <motion.div
                className={`h-2 rounded-full bg-current ${textColorClasses[color]}`}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
            {showProgress && (
              <div className="text-center text-sm text-gray-400">
                {Math.round(progress)}%
              </div>
            )}
          </div>
        );

      default: // spinner
        return (
          <motion.div
            className={`${sizeClasses[size]} border-2 border-solid rounded-full ${colorClasses[color]} border-t-transparent`}
            animate={{ rotate: 360 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        );
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      {renderSpinner()}
      
      <AnimatePresence mode="wait">
        <motion.div
          key={displayedMessage}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="text-center"
        >
          <p className={`text-sm font-medium ${textColorClasses[color]}`}>
            {displayedMessage}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}