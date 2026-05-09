import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  variant?: 'primary' | 'standard';
  trend?: { value: number; isUp: boolean };
  isLoading?: boolean;
  onClick?: () => void;
  delay?: number;
}

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon: Icon,
  variant = 'standard',
  trend,
  isLoading = false,
  onClick,
  delay = 0,
}) => {
  const isPrimary = variant === 'primary';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={onClick ? { scale: 1.03, y: -2 } : { scale: 1.02, y: -1 }}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      className={`relative overflow-hidden p-4 sm:p-6 rounded-3xl border transition-shadow duration-300
        ${isPrimary
          ? 'bg-gradient-to-br from-primary via-primary to-primary-dark border-primary-light/30 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30'
          : 'bg-card/80 backdrop-blur-sm border-border/50 shadow-sm hover:shadow-lg hover:shadow-primary/8 hover:border-border/80'
        }
        ${onClick ? 'cursor-pointer' : ''}`}
    >
      {/* Decorative gradient orb */}
      <div className={`absolute -right-6 -bottom-6 w-28 h-28 rounded-full blur-3xl pointer-events-none transition-opacity duration-500 ${
        isPrimary ? 'bg-white/15 opacity-60' : 'bg-primary/8 opacity-0 group-hover:opacity-100'
      }`} />

      {/* Top-left accent line */}
      {isPrimary && (
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-white/40 via-white/20 to-transparent" />
      )}

      <div className="relative z-10 flex items-center justify-between mb-3 sm:mb-4">
        <motion.div
          className={`p-2.5 sm:p-3 rounded-2xl ${
            isPrimary ? 'bg-white/20 text-white backdrop-blur-sm' : 'bg-primary/10 text-primary'
          }`}
          whileHover={{ rotate: 12, scale: 1.05 }}
          transition={{ type: 'spring', stiffness: 300, damping: 15 }}
        >
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        </motion.div>

        {trend && !isLoading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: delay + 0.2, duration: 0.3 }}
            className={`flex items-center text-xs font-bold px-2.5 py-1 rounded-full ${
              isPrimary
                ? 'bg-white/20 text-white backdrop-blur-sm'
                : trend.isUp
                  ? 'bg-success-500/10 text-success-600 dark:text-success-400'
                  : 'bg-error-500/10 text-error-600 dark:text-error-400'
            }`}
          >
            {trend.isUp ? '↑' : '↓'} {trend.value}%
          </motion.div>
        )}
      </div>

      <div className="relative z-10">
        <p className={`text-xs sm:text-sm font-medium mb-1 ${
          isPrimary ? 'text-white/80' : 'text-muted-foreground'
        }`}>
          {label}
        </p>

        {isLoading ? (
          <div className={`h-7 sm:h-8 w-24 animate-pulse rounded-lg ${
            isPrimary ? 'bg-white/20' : 'bg-primary/8'
          }`} />
        ) : (
          <motion.h3
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: delay + 0.1, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className={`text-xl sm:text-2xl font-bold tracking-tight ${
              isPrimary ? 'text-white' : 'text-foreground'
            }`}
          >
            {value}
          </motion.h3>
        )}
      </div>
    </motion.div>
  );
};

export default StatCard;
