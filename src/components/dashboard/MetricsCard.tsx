import { motion, useReducedMotion } from 'framer-motion';
import { DivideIcon as LucideIcon } from 'lucide-react';
import { PERFORMANCE_CONFIG } from '../../lib/utils/performance';

interface MetricsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: 'primary' | 'success' | 'warning' | 'error';
  delay?: number;
  isLoading?: boolean;
}

export default function MetricsCard({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  delay = 0,
  isLoading = false 
}: MetricsCardProps) {
  const shouldReduceMotion = useReducedMotion();
  
  const colorClasses = {
    primary: {
      bg: 'from-primary-500/20 to-primary-600/20',
      text: 'text-primary-400',
      border: 'border-primary-500/30'
    },
    success: {
      bg: 'from-success-500/20 to-success-600/20',
      text: 'text-success-400',
      border: 'border-success-500/30'
    },
    warning: {
      bg: 'from-warning-500/20 to-warning-600/20',
      text: 'text-warning-400',
      border: 'border-warning-500/30'
    },
    error: {
      bg: 'from-error-500/20 to-error-600/20',
      text: 'text-error-400',
      border: 'border-error-500/30'
    }
  };

  const animationProps = shouldReduceMotion ? {} : {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { 
      duration: PERFORMANCE_CONFIG.ANIMATION_DURATION.NORMAL / 1000, 
      delay, 
      ease: "easeOut" 
    },
    whileHover: { 
      y: -2, 
      scale: 1.005,
      transition: { duration: PERFORMANCE_CONFIG.ANIMATION_DURATION.FAST / 1000 }
    }
  };

  return (
    <motion.div
      {...animationProps}
      className={`card-dark p-4 sm:p-6 group cursor-pointer border ${colorClasses[color].border} hover:${colorClasses[color].border}`}
      style={{
        willChange: shouldReduceMotion ? 'auto' : 'transform',
        backfaceVisibility: 'hidden',
        transform: 'translate3d(0, 0, 0)'
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-400 mb-2 truncate">
            {title}
          </p>
          {isLoading ? (
            <div className="h-8 sm:h-10 bg-gray-700 rounded animate-pulse" />
          ) : (
            <motion.p 
              className="text-xl sm:text-2xl lg:text-3xl font-bold text-white"
              initial={shouldReduceMotion ? {} : { scale: 0.9 }}
              animate={shouldReduceMotion ? {} : { scale: 1 }}
              transition={shouldReduceMotion ? {} : { 
                delay: delay + 0.1, 
                duration: PERFORMANCE_CONFIG.ANIMATION_DURATION.FAST / 1000 
              }}
            >
              {value}
            </motion.p>
          )}
        </div>
        
        <motion.div 
          className={`flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl bg-gradient-to-br ${colorClasses[color].bg} ${colorClasses[color].text} group-hover:scale-105 transition-all duration-200 flex-shrink-0`}
          whileHover={shouldReduceMotion ? {} : { 
            rotate: 3,
            transition: { duration: PERFORMANCE_CONFIG.ANIMATION_DURATION.FAST / 1000 }
          }}
        >
          <Icon className="h-6 w-6 sm:h-7 sm:w-7" />
        </motion.div>
      </div>
    </motion.div>
  );
}