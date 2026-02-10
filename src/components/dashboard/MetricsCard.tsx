import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface MetricsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: 'primary' | 'success' | 'warning' | 'error';
  delay?: number;
  isLoading?: boolean;
  variant?: 'default' | 'filled';
  size?: 'default' | 'lg';
  onClick?: () => void;
}

export default function MetricsCard({
  title,
  value,
  icon: Icon,
  color,
  delay = 0,
  isLoading = false,
  variant = 'default',
  size = 'default',
  onClick
}: MetricsCardProps) {
  const colorClasses = {
    primary: {
      bg: 'from-primary/20 to-primary/30',
      text: 'text-primary',
      border: 'border-primary/30'
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

  const filledStyles = variant === 'filled' ? {
    bg: 'bg-[#F97316] text-white border-none shadow-lg shadow-orange-500/20',
    iconBg: 'bg-white/20 text-white backdrop-blur-sm',
    text: 'text-white/90'
  } : {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      whileHover={{ y: -4, scale: 1.02 }}
      className={`${variant === 'filled' ? filledStyles.bg : `card-theme border ${colorClasses[color].border} hover:${colorClasses[color].border}`} p-4 sm:p-6 group cursor-pointer relative overflow-hidden rounded-[2.5rem]`}
      onClick={onClick}
    >
      <div className="flex flex-col justify-between h-full">
        <div className="flex items-start justify-between mb-4">
          {size === 'lg' ? (
            <div className={`p-3 rounded-2xl ${variant === 'filled' ? filledStyles.iconBg : `bg-gradient-to-br ${colorClasses[color].bg} ${colorClasses[color].text}`} flex-shrink-0`}>
              <Icon className="h-8 w-8" />
            </div>
          ) : (
            <div className={`p-2 rounded-xl ${variant === 'filled' ? filledStyles.iconBg : `bg-gradient-to-br ${colorClasses[color].bg} ${colorClasses[color].text}`} flex-shrink-0`}>
              <Icon className="h-5 w-5" />
            </div>
          )}
          {size === 'lg' && (
            <motion.div
              className="absolute -right-6 -top-6 opacity-10"
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <Icon className="w-32 h-32" />
            </motion.div>
          )}
        </div>

        <div>
          {isLoading ? (
            <div className={`h-8 sm:h-10 rounded animate-pulse ${variant === 'filled' ? 'bg-white/20' : 'bg-secondary'}`} />
          ) : (
            <motion.p
              className={`font-bold ${variant === 'filled' ? 'text-white' : 'text-foreground'} ${size === 'lg' ? 'text-4xl sm:text-5xl mb-1' : 'text-2xl sm:text-3xl'
                }`}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: delay + 0.1, duration: 0.3, ease: "easeOut" }}
            >
              {value}
            </motion.p>
          )}
          <p className={`font-medium truncate ${variant === 'filled' ? filledStyles.text : 'text-muted-foreground'
            } ${size === 'lg' ? 'text-base sm:text-lg opacity-90' : 'text-xs sm:text-sm'}`}>
            {title}
          </p>
        </div>
      </div>
    </motion.div>
  );
}