import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle, X, AlertCircle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
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
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => e.target === e.currentTarget && onCancel()}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-dark-800 rounded-2xl border border-dark-700/50 shadow-dark-lg p-6 max-w-md w-full"
          >
            <div className="flex items-start space-x-4">
              <div className={`p-3 rounded-full ${styles.iconBg} ${styles.iconColor} flex-shrink-0`}>
                <Icon className="w-6 h-6" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
                <p className="text-gray-300 leading-relaxed">{message}</p>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onCancel}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-dark-700/50 transition-colors flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>
            
            <div className="flex gap-3 mt-6 pt-4 border-t border-dark-700/50">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onCancel}
                className="btn-secondary flex-1"
              >
                {cancelText}
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onConfirm}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${styles.confirmButton}`}
              >
                {confirmText}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}