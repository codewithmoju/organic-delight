import { AlertTriangle, Package } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

interface LowStockAlertProps {
  items: Array<{
    name: string;
    quantity: number;
    reorder_point: number;
  }>;
}

export default function LowStockAlert({ items }: LowStockAlertProps) {
  const shouldReduceMotion = useReducedMotion();
  
  if (items.length === 0) return null;

  const alertAnimationProps = shouldReduceMotion ? {} : {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.4, ease: "easeOut" }
  };

  const iconAnimationProps = shouldReduceMotion ? {} : {
    animate: { rotate: [0, -10, 10, -10, 0] },
    transition: { duration: 2, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }
  };

  return (
    <motion.div
      {...alertAnimationProps}
      className="rounded-xl bg-gradient-to-r from-warning-500/10 to-error-500/10 border border-warning-500/20 p-4 sm:p-6"
      style={{
        willChange: shouldReduceMotion ? 'auto' : 'transform, opacity',
        backfaceVisibility: 'hidden'
      }}
    >
      <div className="flex items-start">
        <motion.div 
          className="flex-shrink-0"
          {...iconAnimationProps}
        >
          <AlertTriangle className="h-6 w-6 text-warning-400" />
        </motion.div>
        <div className="ml-3 sm:ml-4 flex-1">
          <h3 className="text-base sm:text-lg font-semibold text-warning-300 mb-3">
            Low Stock Alert
          </h3>
          <div className="space-y-2 sm:space-y-3">
            {items.map((item, index) => (
              <motion.div
                key={item.name}
                initial={shouldReduceMotion ? {} : { opacity: 0, x: -20 }}
                animate={shouldReduceMotion ? {} : { opacity: 1, x: 0 }}
                transition={shouldReduceMotion ? {} : { delay: index * 0.1, duration: 0.3, ease: "easeOut" }}
                className="flex items-center justify-between p-3 rounded-lg bg-dark-800/50 border border-dark-700/50"
              >
                <div className="flex items-center flex-1">
                  <Package className="w-4 h-4 text-gray-400 mr-3" />
                  <span className="text-gray-200 font-medium text-sm sm:text-base">{item.name}</span>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-warning-400 font-semibold text-sm sm:text-base">
                    {item.quantity} units
                  </span>
                  <p className="text-xs text-gray-500">
                    Reorder at {item.reorder_point}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}