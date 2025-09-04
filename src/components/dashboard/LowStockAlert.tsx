import { AlertTriangle, Package } from 'lucide-react';
import { motion } from 'framer-motion';

interface LowStockAlertProps {
  items: Array<{
    name: string;
    quantity: number;
    reorder_point: number;
  }>;
}

export default function LowStockAlert({ items }: LowStockAlertProps) {
  if (items.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-xl bg-gradient-to-r from-warning-500/10 to-error-500/10 border border-warning-500/20 p-4 sm:p-6 w-full"
    >
      <div className="flex items-start">
        <motion.div 
          className="flex-shrink-0"
          animate={{ rotate: [0, -10, 10, -10, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
        >
          <AlertTriangle className="h-6 w-6 text-warning-400" />
        </motion.div>
        <div className="ml-3 sm:ml-4 flex-1 min-w-0">
          <h3 className="text-base sm:text-lg font-semibold text-warning-300 mb-3">
            Low Stock Alert
          </h3>
          <div className="space-y-2 sm:space-y-3">
            {items.map((item, index) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 rounded-lg bg-dark-800/50 border border-dark-700/50 w-full"
              >
                <div className="flex items-center flex-1 min-w-0">
                  <Package className="w-4 h-4 text-gray-400 mr-3" />
                  <span className="text-gray-200 font-medium text-sm sm:text-base truncate">{item.name}</span>
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