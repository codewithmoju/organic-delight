import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react';

interface Transaction {
  id: string;
  quantity_changed: number;
  type: 'in' | 'out';
  created_at: any;
  item: {
    name: string;
  };
}

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export default function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <div className="p-6">
      <motion.h3 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-xl font-semibold text-white mb-6 flex items-center"
      >
        <Clock className="w-5 h-5 mr-3 text-primary-400" />
        Recent Transactions
      </motion.h3>
      
      <div className="space-y-3">
        {transactions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8 text-gray-400"
          >
            No recent transactions
          </motion.div>
        ) : (
          transactions.map((transaction, index) => (
            <motion.div
              key={transaction.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02, x: 4 }}
              className="flex items-center justify-between p-4 rounded-lg bg-dark-800/30 border border-dark-700/30 hover:border-primary-500/30 transition-all duration-200"
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${
                  transaction.type === 'in' 
                    ? 'bg-success-500/20 text-success-400' 
                    : 'bg-error-500/20 text-error-400'
                }`}>
                  {transaction.type === 'in' ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowDownLeft className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <p className="text-gray-200 font-medium">
                    {transaction.item?.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {format(
                      new Date(transaction.created_at.toDate ? transaction.created_at.toDate() : transaction.created_at), 
                      'MMM d, HH:mm'
                    )}
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <span className={`font-semibold ${
                  transaction.type === 'in' ? 'text-success-400' : 'text-error-400'
                }`}>
                  {transaction.type === 'in' ? '+' : '-'}{Math.abs(transaction.quantity_changed)}
                </span>
                <p className="text-xs text-gray-500">
                  {transaction.type === 'in' ? 'Stock In' : 'Stock Out'}
                </p>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}