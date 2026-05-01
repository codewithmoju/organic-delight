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
      className="rounded-2xl bg-warning-500/8 border border-warning-500/25 p-4 sm:p-5"
    >
      <div className="flex items-start gap-3">
        {/* Animated icon */}
        <motion.div
          className="flex-shrink-0 mt-0.5"
          animate={{ rotate: [0, -10, 10, -10, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
        >
          <div className="w-8 h-8 rounded-lg bg-warning-500/15 flex items-center justify-center">
            <AlertTriangle className="h-4 w-4 text-warning-500" />
          </div>
        </motion.div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-warning-600 dark:text-warning-400 mb-2.5">
            Low Stock Alert — {items.length} item{items.length !== 1 ? 's' : ''} need attention
          </h3>

          <div className="space-y-2">
            {items.map((item, index) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.07 }}
                className="flex items-center justify-between gap-3 p-2.5 rounded-xl
                  bg-card border border-border/50"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Package className="w-3.5 h-3.5 text-foreground-muted flex-shrink-0" />
                  <span className="text-foreground font-medium text-sm truncate">{item.name}</span>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-warning-500 font-bold text-sm">{item.quantity}</span>
                  <p className="text-xs text-foreground-muted leading-none mt-0.5">
                    min {item.reorder_point}
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
