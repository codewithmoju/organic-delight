import { motion } from 'framer-motion';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface MetricsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: 'primary' | 'success' | 'warning' | 'error';
  delay?: number;

export default function MetricsCard({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  delay = 0
  delay = 0
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, delay, ease: "easeOut" }}
      whileHover={{ y: -4, scale: 1.02 }}
      className={`card-dark p-4 sm:p-6 group cursor-pointer border ${colorClasses[color].border} hover:${colorClasses[color].border}`}
      style={{
        transform: 'translate3d(0, 0, 0)',
        backfaceVisibility: 'hidden',
        willChange: 'transform, opacity'
      }}
      style={{
        transform: 'translate3d(0, 0, 0)',
        backfaceVisibility: 'hidden',
        willChange: 'transform, opacity'
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-400 mb-2 truncate">
            {title}
          </p>
          <motion.p 
            className="text-xl sm:text-2xl lg:text-3xl font-bold text-white"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: delay + 0.05, duration: 0.15, ease: "easeOut" }}
          >
            {value}
          </motion.p>
          whileHover={{ rotate: 360 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <Icon className="h-6 w-6 sm:h-7 sm:w-7" />
        </motion.div>
      </div>
    </motion.div>
  );
}