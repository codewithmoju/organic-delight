import { motion } from 'framer-motion';
import { AlertTriangle, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Vendor } from '../../lib/types';
import { formatCurrency } from '../../lib/utils/notifications';

interface VendorPaymentAlertsProps {
  vendors: Vendor[];
  isLoading?: boolean;
}

function VendorInitials({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();
  return (
    <div className="w-8 h-8 rounded-lg bg-warning-500/15 flex items-center justify-center flex-shrink-0">
      <span className="text-xs font-bold text-warning-600 dark:text-warning-400">{initials}</span>
    </div>
  );
}

export default function VendorPaymentAlerts({ vendors, isLoading }: VendorPaymentAlertsProps) {
  const navigate = useNavigate();

  // Only show vendors with outstanding balance, sorted by amount desc
  const due = vendors
    .filter(v => v.outstanding_balance > 0)
    .sort((a, b) => b.outstanding_balance - a.outstanding_balance)
    .slice(0, 5);

  const totalDue = due.reduce((s, v) => s + v.outstanding_balance, 0);

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
      transition={{ duration: 0.4, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2 }}
      className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm hover:shadow-md transition-shadow duration-300 relative overflow-hidden"
    >
      {/* Gradient accent */}
      <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-warning-500/50 via-warning-500/20 to-transparent" />

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-warning-500" />
          Vendor Payments Due
        </h3>
        {due.length > 0 && (
          <span className="text-xs font-bold text-error-500 tabular-nums">
            {formatCurrency(totalDue)} total
          </span>
        )}
      </div>

      {due.length === 0 ? (
        <div className="text-center py-4">
          <div className="w-10 h-10 rounded-full bg-success-500/10 flex items-center justify-center mx-auto mb-2">
            <AlertTriangle className="w-5 h-5 text-success-500" />
          </div>
          <p className="text-xs text-muted-foreground">All vendor payments are clear</p>
        </div>
      ) : (
        <div className="space-y-2">
          {due.map((vendor, i) => (
            <motion.button
              key={vendor.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.06 }}
              onClick={() => navigate(`/vendors/${vendor.id}/ledger`)}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-warning-500/5 border border-warning-500/20 hover:bg-warning-500/10 hover:border-warning-500/30 transition-all text-left group"
            >
              <VendorInitials name={vendor.name} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{vendor.name}</p>
                <p className="text-xs text-muted-foreground truncate">{vendor.company}</p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="text-sm font-bold text-error-500 tabular-nums">
                  {formatCurrency(vendor.outstanding_balance)}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-muted-foreground group-hover:translate-x-0.5 transition-all" />
              </div>
            </motion.button>
          ))}

          {vendors.filter(v => v.outstanding_balance > 0).length > 5 && (
            <button
              onClick={() => navigate('/vendors')}
              className="w-full text-xs text-center text-primary hover:text-primary-dark font-medium hover:underline py-1.5 transition-colors"
            >
              +{vendors.filter(v => v.outstanding_balance > 0).length - 5} more vendors
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}
