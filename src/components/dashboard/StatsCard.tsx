import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  delay?: number;
}

export default function StatsCard({ title, value, icon, trend, delay = 0 }: StatsCardProps) {
  const { formatCurrency } = useCurrency();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="card-dark p-4 sm:p-6 group cursor-pointer"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs sm:text-sm font-medium text-gray-400 mb-1 truncate">{title}</p>
          <motion.p 
            className="text-xl sm:text-2xl lg:text-3xl font-bold text-white"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: delay + 0.1, duration: 0.3, ease: "easeOut" }}
          >
            {value}
          </motion.p>
          {trend && (
            <motion.div 
              className={`flex items-center mt-1 sm:mt-2 text-xs sm:text-sm font-medium ${
                trend.value >= 0 ? 'text-success-400' : 'text-error-400'
              }`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: delay + 0.2, duration: 0.3 }}
            >
              {trend.value >= 0 ? (
                <TrendingUp className="w-4 h-4 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 mr-1" />
              )}
              <span className="truncate">{Math.abs(trend.value)}% {trend.label}</span>
            </motion.div>
          )}
        </div>
        
        <motion.div 
          className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 text-primary-400 group-hover:from-primary-500/30 group-hover:to-accent-500/30 transition-all duration-300 flex-shrink-0"
          whileHover={{ rotate: 360 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        >
          {icon}
        </motion.div>
      </div>
    </motion.div>
  );
}