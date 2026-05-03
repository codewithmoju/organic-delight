import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, RotateCcw, AlertTriangle } from 'lucide-react';
import { Purchase } from '../../lib/types';
import { getPurchase } from '../../lib/api/purchases';
import { AnimatePresence } from 'framer-motion';
import PurchaseReturnModal from '../../components/purchases/PurchaseReturnModal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function PurchaseReturnPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) { setError('No purchase ID provided'); setIsLoading(false); return; }
    getPurchase(id)
      .then(p => {
        if (!p) setError('Purchase not found');
        else setPurchase(p);
      })
      .catch(() => setError('Failed to load purchase'))
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Loading purchase..." />
      </div>
    );
  }

  if (error || !purchase) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertTriangle className="w-12 h-12 text-error-500" />
        <p className="text-muted-foreground">{error ?? 'Purchase not found'}</p>
        <button onClick={() => navigate('/purchases')} className="btn-primary px-5 py-2 rounded-xl text-sm font-semibold">
          Back to Purchases
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-10">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/purchases')}
          className="p-2 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="app-page-title flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-warning-500" />
            Process Return
          </h1>
          <p className="app-page-subtitle">
            {purchase.purchase_number} · {purchase.vendor_name}
          </p>
        </div>
      </div>

      {/* Return modal rendered inline as a page */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg"
        >
          <PurchaseReturnModal
            purchase={purchase}
            onClose={() => navigate('/purchases')}
            onSuccess={() => navigate('/purchases')}
            inline
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
