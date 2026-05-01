import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Lightbulb } from 'lucide-react';

// Tips are hardcoded here so the loader works before i18n is ready.
// They're kept short so they fit on one line on mobile.
const TIPS = [
  'Use the POS barcode scanner to ring up items in seconds.',
  'Hold a cart mid-sale and resume it later with Hold Cart.',
  'Set reorder points to get low-stock alerts automatically.',
  'The dashboard refreshes metrics after every POS transaction.',
  'Switch bill types right from the POS toolbar.',
  'Credit sales are tracked per customer — check their ledger anytime.',
  'Quick Access lets you pin best-sellers for one-tap checkout.',
  'Offline mode queues transactions and syncs when you reconnect.',
  'Use F5 for new sale, F9 to pay, F8 to switch bill type.',
  'Export sales reports to review performance trends over time.',
];

interface AppLoaderProps {
  /** Optional label shown below the spinner, e.g. "Loading dashboard" */
  label?: string;
  /** Show the full-screen variant (used by ProtectedRoute) */
  fullScreen?: boolean;
}

export default function AppLoader({ label, fullScreen = false }: AppLoaderProps) {
  const [tipIndex, setTipIndex] = useState(() => Math.floor(Math.random() * TIPS.length));
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Rotate tips every 3 s
  useEffect(() => {
    const id = setInterval(() => {
      setTipIndex((i) => (i + 1) % TIPS.length);
    }, 3000);
    return () => clearInterval(id);
  }, []);

  // Fake progress bar — advances quickly to ~85 % then slows
  useEffect(() => {
    setProgress(0);
    let current = 0;
    intervalRef.current = setInterval(() => {
      current += current < 70 ? Math.random() * 8 + 4 : Math.random() * 1.5 + 0.5;
      if (current >= 95) {
        current = 95;
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
      setProgress(Math.min(current, 95));
    }, 180);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const content = (
    <div className="flex flex-col items-center justify-center w-full h-full px-6 py-12 select-none">

      {/* ── Logo ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        className="mb-8 flex flex-col items-center gap-3"
      >
        {/* Animated icon ring */}
        <div className="relative">
          {/* Outer pulse ring */}
          <motion.div
            animate={{ scale: [1, 1.18, 1], opacity: [0.25, 0.08, 0.25] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-0 rounded-full bg-primary-500"
            style={{ margin: '-12px' }}
          />
          {/* Spinning arc */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
            className="absolute rounded-full border-2 border-transparent border-t-primary-500"
            style={{ inset: '-8px' }}
          />
          {/* Icon container */}
          <div className="relative z-10 w-16 h-16 rounded-2xl bg-primary-500 flex items-center justify-center shadow-lg shadow-primary-500/30">
            <Package className="w-8 h-8 text-white" strokeWidth={2} />
          </div>
        </div>

        {/* Brand name */}
        <div className="text-center">
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Stock<span className="text-primary-500">Suite</span>
          </h1>
          <p className="text-xs text-foreground-muted mt-0.5 font-medium tracking-widest uppercase">
            by NAM Studios
          </p>
        </div>
      </motion.div>

      {/* ── Progress bar ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        className="w-full max-w-xs mb-3"
      >
        <div className="h-1 w-full rounded-full bg-foreground-muted/15 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary-400 to-primary-600"
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>
      </motion.div>

      {/* ── Status label ── */}
      <motion.p
        key={label}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="text-sm font-medium text-foreground-muted mb-8 text-center"
      >
        {label ?? 'Initializing…'}
      </motion.p>

      {/* ── Tip card ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="w-full max-w-sm"
      >
        <div className="rounded-2xl border border-primary-500/20 bg-primary-500/5 px-5 py-4">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 rounded-full bg-primary-500/15 flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-3 h-3 text-primary-500" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-primary-500">
              Did you know?
            </span>
          </div>

          {/* Tip text — animates on change */}
          <AnimatePresence mode="wait">
            <motion.p
              key={tipIndex}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.35 }}
              className="text-sm leading-relaxed text-foreground-muted"
            >
              {TIPS[tipIndex]}
            </motion.p>
          </AnimatePresence>

          {/* Dot indicators */}
          <div className="flex items-center gap-1.5 mt-3 justify-center">
            {TIPS.map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  width: i === tipIndex ? 16 : 4,
                  opacity: i === tipIndex ? 1 : 0.3,
                }}
                transition={{ duration: 0.3 }}
                className="h-1 rounded-full bg-primary-500"
              />
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background">
        <div className="w-full max-w-sm">{content}</div>
      </div>
    );
  }

  // Inline variant — fills its container (used by Suspense fallbacks)
  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-background">
      <div className="w-full max-w-sm">{content}</div>
    </div>
  );
}
