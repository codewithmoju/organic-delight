import { format } from 'date-fns';
import { ShoppingBag } from 'lucide-react';
import { POSTransaction } from '../../lib/types';
import { formatCurrency } from '../../lib/utils/notifications';

interface RecentTransactionsProps {
  transactions: POSTransaction[];
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === 'completed' ? 'bg-success-500/10 text-success-600 dark:text-success-400' :
    status === 'cancelled' ? 'bg-error-500/10 text-error-600 dark:text-error-400' :
    'bg-warning-500/10 text-warning-600 dark:text-warning-400';
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${cls}`}>
      {status}
    </span>
  );
}

export default function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const empty = transactions.length === 0;

  return (
    <div className="card-theme p-4 sm:p-6 rounded-[2.5rem]">
      <h3 className="text-base sm:text-lg font-bold text-foreground mb-4 sm:mb-5">
        Recent Orders
      </h3>

      {empty ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-3">
            <ShoppingBag className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-foreground font-medium text-sm">No recent orders</p>
          <p className="text-xs text-muted-foreground mt-1">New sales will appear here</p>
        </div>
      ) : (
        <>
          {/* ── Mobile card list (< sm) ── */}
          <div className="sm:hidden space-y-2">
            {transactions.map(tx => (
              <div
                key={tx.id}
                className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted/30 border border-border/40"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-mono text-foreground-muted">
                      #{tx.transaction_number.slice(-6)}
                    </span>
                    <StatusBadge status={tx.status} />
                  </div>
                  <p className="text-sm font-semibold text-foreground truncate">
                    {tx.items[0]?.item_name || 'Unknown Item'}
                    {tx.items.length > 1 && (
                      <span className="text-xs text-foreground-muted font-normal ml-1">
                        +{tx.items.length - 1}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-foreground-muted mt-0.5">
                    {tx.customer_name || 'Walk-in'} · {format(new Date(tx.created_at), 'MMM d, HH:mm')}
                  </p>
                </div>
                <span className="text-sm font-bold text-primary-500 flex-shrink-0">
                  {formatCurrency(tx.total_amount)}
                </span>
              </div>
            ))}
          </div>

          {/* ── Desktop table (≥ sm) ── */}
          <div className="hidden sm:block overflow-x-auto -mx-4 sm:-mx-6 px-4 sm:px-6">
            <table className="w-full text-sm text-left min-w-[520px]">
              <thead>
                <tr className="text-xs text-muted-foreground uppercase bg-secondary/40">
                  <th className="px-4 py-2.5 rounded-l-xl font-semibold">Order #</th>
                  <th className="px-4 py-2.5 font-semibold">Items</th>
                  <th className="px-4 py-2.5 font-semibold">Date</th>
                  <th className="px-4 py-2.5 font-semibold">Amount</th>
                  <th className="px-4 py-2.5 font-semibold">Status</th>
                  <th className="px-4 py-2.5 rounded-r-xl font-semibold">Customer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {transactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-foreground-muted">
                      #{tx.transaction_number.slice(-6)}
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      <span className="font-medium truncate block max-w-[140px]">
                        {tx.items[0]?.item_name || 'Unknown Item'}
                      </span>
                      {tx.items.length > 1 && (
                        <span className="text-xs text-muted-foreground">
                          +{tx.items.length - 1} more
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {format(new Date(tx.created_at), 'MMM d, HH:mm')}
                    </td>
                    <td className="px-4 py-3 font-bold text-primary-500 whitespace-nowrap">
                      {formatCurrency(tx.total_amount)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={tx.status} />
                    </td>
                    <td className="px-4 py-3 text-foreground truncate max-w-[120px]">
                      {tx.customer_name || 'Walk-in Customer'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
