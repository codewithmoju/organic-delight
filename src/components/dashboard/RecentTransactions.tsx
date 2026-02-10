import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';
import { POSTransaction } from '../../lib/types';
import { formatCurrency } from '../../lib/utils/notifications';

interface RecentTransactionsProps {
  transactions: POSTransaction[];
}

export default function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <div className="card-theme p-4 sm:p-6 rounded-[2.5rem]">
      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-lg font-bold text-foreground mb-6"
      >
        Recent Orders
      </motion.h3>

      <div className="overflow-hidden">
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-3">
              <ShoppingBag className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-foreground font-medium">No recent orders</p>
            <p className="text-sm text-muted-foreground max-w-[200px]">New sales will appear here</p>
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 rounded-2xl">
              <tr>
                <th className="px-4 py-3 rounded-l-2xl">Order #</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 rounded-r-2xl">Customer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {transactions.map((transaction, index) => (
                <motion.tr
                  key={transaction.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group hover:bg-secondary/30 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-foreground">
                    #{transaction.transaction_number.slice(-6)}
                  </td>
                  <td className="px-4 py-3 text-foreground">
                    <div className="flex flex-col">
                      <span className="font-medium truncate max-w-[150px]">
                        {transaction.items[0]?.item_name || 'Unknown Item'}
                      </span>
                      {transaction.items.length > 1 && (
                        <span className="text-xs text-muted-foreground">
                          + {transaction.items.length - 1} more
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {format(new Date(transaction.created_at), 'MMM d, HH:mm')}
                  </td>
                  <td className="px-4 py-3 font-bold text-primary-500">
                    {formatCurrency(transaction.total_amount)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${transaction.status === 'completed'
                      ? 'bg-success-500/10 text-success-500'
                      : transaction.status === 'cancelled'
                        ? 'bg-error-500/10 text-error-500'
                        : 'bg-warning-500/10 text-warning-500'
                      }`}>
                      {transaction.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-foreground">
                    {transaction.customer_name || 'Walk-in Customer'}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}