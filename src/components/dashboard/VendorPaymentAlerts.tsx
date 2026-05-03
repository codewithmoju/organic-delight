import { motion } from 'framer-motion';
import { AlertTriangle, Building2, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Vendor } from '../../lib/types';
import { formatCurrency } from '../../lib/utils/notifications';

interface VendorPaymentAlertsProps {
  vendors: Vendor[];
  isLoading?: boolean;
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
      className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm"
    >
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
            <Building2 className="w-5 h-5 text-success-500" />
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
              transition={{ delay: i * 0.06 }}
              onClick={() => navigate(`/vendors/${vendor.id}/ledger`)}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-warning-500/5 border border-warning-500/20 hover:bg-warning-500/10 transition-colors text-left group"
            >
              <div className="w-8 h-8 rounded-lg bg-warning-500/10 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-4 h-4 text-warning-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{vendor.name}</p>
                <p className="text-xs text-muted-foreground truncate">{vendor.company}</p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="text-sm font-bold text-error-500 tabular-nums">
                  {formatCurrency(vendor.outstanding_balance)}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
              </div>
            </motion.button>
          ))}

          {vendors.filter(v => v.outstanding_balance > 0).length > 5 && (
            <button
              onClick={() => navigate('/vendors')}
              className="w-full text-xs text-center text-primary hover:underline py-1"
            >
              +{vendors.filter(v => v.outstanding_balance > 0).length - 5} more vendors
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}
