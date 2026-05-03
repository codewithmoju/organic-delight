import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react';
import { formatCurrency } from '../../lib/utils/notifications';

interface CashFlowWidgetProps {
  cashIn: number;   // cash sales + customer collections
  cashOut: number;  // cash expenses + vendor payments
  isLoading?: boolean;
}

export default function CashFlowWidget({ cashIn, cashOut, isLoading }: CashFlowWidgetProps) {
  const net = cashIn - cashOut;
  const isPositive = net >= 0;
  const total = cashIn + cashOut || 1;
  const inPct = Math.round((cashIn / total) * 100);
  const outPct = 100 - inPct;

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl border border-border/60 p-5 animate-pulse">
        <div className="h-4 w-28 bg-secondary rounded mb-4" />
        <div className="h-8 w-36 bg-secondary rounded mb-3" />
        <div className="h-2 bg-secondary rounded-full mb-3" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-14 bg-secondary rounded-xl" />
          <div className="h-14 bg-secondary rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
      className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-foreground">Cash Flow</h3>
        <div className="p-2 rounded-xl bg-primary/10">
          <Wallet className="w-4 h-4 text-primary" />
        </div>
      </div>

      {/* Net cash */}
      <div className={`text-2xl font-bold tabular-nums mb-4 ${isPositive ? 'text-success-500' : 'text-error-500'}`}>
        {isPositive ? '+' : ''}{formatCurrency(net)}
        <span className="text-xs font-medium text-muted-foreground ml-1">net cash</span>
      </div>

      {/* Flow bar */}
      <div className="h-2 rounded-full overflow-hidden bg-secondary mb-4 flex">
        <motion.div
          className="h-full bg-success-500 rounded-l-full"
          initial={{ width: 0 }}
          animate={{ width: `${inPct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
        <motion.div
          className="h-full bg-error-500 rounded-r-full"
          initial={{ width: 0 }}
          animate={{ width: `${outPct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
        />
      </div>

      {/* In / Out cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-success-500/10 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <ArrowUpRight className="w-3.5 h-3.5 text-success-500" />
            <span className="text-xs font-semibold text-success-600 dark:text-success-400">Cash In</span>
          </div>
          <p className="text-sm font-bold text-foreground tabular-nums">{formatCurrency(cashIn)}</p>
        </div>
        <div className="bg-error-500/10 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <ArrowDownRight className="w-3.5 h-3.5 text-error-500" />
            <span className="text-xs font-semibold text-error-600 dark:text-error-400">Cash Out</span>
          </div>
          <p className="text-sm font-bold text-foreground tabular-nums">{formatCurrency(cashOut)}</p>
        </div>
      </div>
    </motion.div>
  );
}
