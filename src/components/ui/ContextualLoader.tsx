import { motion, AnimatePresence } from 'framer-motion';
import LoadingSpinner from './LoadingSpinner';

interface ContextualLoaderProps {
  isLoading: boolean;
  context: 'dashboard' | 'items' | 'categories' | 'transactions' | 'reports' | 'settings' | 'auth';
  variant?: 'overlay' | 'inline' | 'card';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const CONTEXTUAL_MESSAGES = {
  dashboard: [
    "Loading dashboard overview...",
    "Fetching inventory metrics...",
    "Calculating stock levels...",
    "Preparing analytics...",
    "Almost ready!"
  ],
  items: [
    "Loading inventory items...",
    "Fetching product catalog...",
    "Organizing by categories...",
    "Calculating stock values...",
    "Items loaded successfully!"
  ],
  categories: [
    "Loading categories...",
    "Organizing inventory groups...",
    "Counting items per category...",
    "Categories ready!"
  ],
  transactions: [
    "Loading transaction history...",
    "Fetching stock movements...",
    "Processing financial data...",
    "Calculating totals...",
    "Transactions loaded!"
  ],
  reports: [
    "Generating reports...",
    "Analyzing inventory trends...",
    "Processing chart data...",
    "Creating visualizations...",
    "Reports ready!"
  ],
  settings: [
    "Loading preferences...",
    "Fetching user profile...",
    "Preparing settings...",
    "Settings loaded!"
  ],
  auth: [
    "Authenticating user...",
    "Verifying credentials...",
    "Setting up session...",
    "Welcome back!"
  ]
};

export default function ContextualLoader({
  isLoading,
  context,
  variant = 'overlay',
  size = 'md',
  className = ''
}: ContextualLoaderProps) {
  const messages = CONTEXTUAL_MESSAGES[context];

  if (variant === 'overlay') {
    return (
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`absolute inset-0 z-50 flex items-center justify-center bg-dark-900/80 backdrop-blur-sm ${className}`}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="text-center p-6 rounded-xl glass-effect border border-dark-700/50"
            >
              <LoadingSpinner
                size={size}
                color="primary"
                variant="spinner"
                messages={messages}
                messageInterval={2000}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  if (variant === 'card') {
    return (
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`card-dark p-8 text-center ${className}`}
          >
            <LoadingSpinner
              size={size}
              color="primary"
              variant="dots"
              messages={messages}
              messageInterval={2500}
            />
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // Inline variant
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`flex items-center justify-center py-8 ${className}`}
        >
          <LoadingSpinner
            size={size}
            color="primary"
            variant="pulse"
            messages={messages}
            messageInterval={3000}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}