import { motion } from 'framer-motion';
import { Users, ChevronRight, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Customer } from '../../lib/types';
import { formatCurrency } from '../../lib/utils/notifications';

interface CustomerCreditWidgetProps {
  customers: Customer[];
  isLoading?: boolean;
}

export default function CustomerCreditWidget({ customers, isLoading }: CustomerCreditWidgetProps) {
  const navigate = useNavigate();

  const withBalance = customers
    .filter(c => c.outstanding_balance > 0)
    .sort((a, b) => b.outstanding_balance - a.outstanding_balance)
    .slice(0, 5);

  const totalOwed = customers.reduce((s, c) => s + (c.outstanding_balance > 0 ? c.outstanding_balance : 0), 0);
  const count = customers.filter(c => c.outstanding_balance > 0).length;

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl border border-border/60 p-5 animate-pulse">
        <div className="h-4 w-40 bg-secondary rounded mb-4" />
        <div className="space-y-2">
          {[0,1,2].map(i => <div key={i} className="h-12 bg-secondary rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-error-500" />
          Customer Credit (Udhaar)
        </h3>
        {count > 0 && (
          <span className="text-xs font-bold text-error-500 tabular-nums">
            {formatCurrency(totalOwed)}
          </span>
        )}
      </div>

      {/* Summary pill */}
      {count > 0 && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl bg-error-500/10 border border-error-500/20">
          <Users className="w-3.5 h-3.5 text-error-500 flex-shrink-0" />
          <span className="text-xs text-error-600 dark:text-error-400 font-medium">
            {count} customer{count !== 1 ? 's' : ''} owe{count === 1 ? 's' : ''} {formatCurrency(totalOwed)}
          </span>
        </div>
      )}

      {withBalance.length === 0 ? (
        <div className="text-center py-4">
          <div className="w-10 h-10 rounded-full bg-success-500/10 flex items-center justify-center mx-auto mb-2">
            <Users className="w-5 h-5 text-success-500" />
          </div>
          <p className="text-xs text-muted-foreground">No outstanding customer balances</p>
        </div>
      ) : (
        <div className="space-y-2">
          {withBalance.map((customer, i) => (
            <motion.button
              key={customer.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              onClick={() => navigate(`/customers/${customer.id}/ledger`)}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-error-500/5 border border-error-500/20 hover:bg-error-500/10 transition-colors text-left group"
            >
              <div className="w-8 h-8 rounded-lg bg-error-500/10 flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 text-error-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{customer.name}</p>
                <p className="text-xs text-muted-foreground truncate">{customer.phone}</p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="text-sm font-bold text-error-500 tabular-nums">
                  {formatCurrency(customer.outstanding_balance)}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
              </div>
            </motion.button>
          ))}

          {count > 5 && (
            <button
              onClick={() => navigate('/customers')}
              className="w-full text-xs text-center text-primary hover:underline py-1"
            >
              +{count - 5} more customers
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}
