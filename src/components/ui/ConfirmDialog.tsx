import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle, X, AlertCircle, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  const { t } = useTranslation();

  // Use translations if props are not provided
  const effectiveConfirmText = confirmText === 'Confirm' ? t('common.confirm', 'Confirm') : confirmText;
  const effectiveCancelText = cancelText === 'Cancel' ? t('common.cancel', 'Cancel') : cancelText;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: AlertTriangle,
          iconColor: 'text-error-400',
          iconBg: 'bg-error-500/20',
          confirmButton: 'bg-error-600 hover:bg-error-700 text-white'
        };
      case 'warning':
        return {
          icon: AlertCircle,
          iconColor: 'text-warning-400',
          iconBg: 'bg-warning-500/20',
          confirmButton: 'bg-warning-600 hover:bg-warning-700 text-white'
        };
      case 'info':
        return {
          icon: CheckCircle,
          iconColor: 'text-primary-400',
          iconBg: 'bg-primary-500/20',
          confirmButton: 'bg-primary-600 hover:bg-primary-700 text-white'
        };
    }
  };

  const styles = getVariantStyles();
  const Icon = styles.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={(e) => !isLoading && e.target === e.currentTarget && onCancel()}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
            className="relative bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-white/10 shadow-2xl p-6 max-w-md w-full overflow-hidden"
          >
            {/* Decorative background element */}
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

            <div className="relative flex items-start gap-5">
              <div className={`p-3.5 rounded-2xl ${styles.iconBg} ${styles.iconColor} shadow-lg ring-1 ring-inset ring-black/5 flex-shrink-0`}>
                <Icon className="w-7 h-7" />
              </div>

              <div className="flex-1 min-w-0 pt-1">
                <h3 className="text-xl font-bold text-foreground mb-2 tracking-tight">{title}</h3>
                <p className="text-muted-foreground leading-relaxed text-[15px]">{message}</p>
              </div>
            </div>

            <div className="flex gap-3 mt-8 pt-0">
              <motion.button
                whileHover={!isLoading ? { scale: 1.02 } : {}}
                whileTap={!isLoading ? { scale: 0.98 } : {}}
                onClick={onCancel}
                disabled={isLoading}
                className="btn-secondary flex-1 py-3 text-[15px] font-medium rounded-xl border-border/50 hover:bg-secondary/80 hover:border-border transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {effectiveCancelText}
              </motion.button>

              <motion.button
                whileHover={!isLoading ? { scale: 1.02, boxShadow: "0 4px 12px rgba(var(--primary), 0.25)" } : {}}
                whileTap={!isLoading ? { scale: 0.98 } : {}}
                onClick={onConfirm}
                disabled={isLoading}
                className={`flex-1 px-4 py-3 rounded-xl font-bold text-[15px] shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed ${styles.confirmButton}`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  effectiveConfirmText
                )}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}