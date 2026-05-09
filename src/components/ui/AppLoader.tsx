import { useEffect, useState } from 'react';
import { Package, Lightbulb } from 'lucide-react';

// Tips are hardcoded here so the loader works before i18n is ready.
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

  // Rotate tips every 3 s
  useEffect(() => {
    const id = setInterval(() => {
      setTipIndex((i) => (i + 1) % TIPS.length);
    }, 3000);
    return () => clearInterval(id);
  }, []);

  const content = (
    <div className="flex flex-col items-center justify-center w-full h-full px-6 py-12 select-none">

      {/* ── Logo ── */}
      <div className="mb-8 flex flex-col items-center gap-3 animate-[fadeIn_0.3s_ease-out]">
        <div className="relative">
          {/* Spinning arc — pure CSS */}
          <div
            className="absolute rounded-full border-2 border-transparent border-t-primary-500 animate-spin"
            style={{ inset: '-8px', animationDuration: '1.4s' }}
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
      </div>

      {/* ── Spinner ── */}
      <div className="mb-3">
        <div className="w-6 h-6 border-2 border-primary-500 border-solid rounded-full animate-spin border-t-transparent" />
      </div>

      {/* ── Status label ── */}
      <p className="text-sm font-medium text-foreground-muted mb-8 text-center">
        {label ?? 'Initializing…'}
      </p>

      {/* ── Tip card ── */}
      <div className="w-full max-w-sm animate-[fadeIn_0.3s_ease-out_0.15s_both]">
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

          {/* Tip text */}
          <p className="text-sm leading-relaxed text-foreground-muted">
            {TIPS[tipIndex]}
          </p>

          {/* Dot indicators — pure CSS */}
          <div className="flex items-center gap-1.5 mt-3 justify-center">
            {TIPS.map((_, i) => (
              <div
                key={i}
                className="h-1 rounded-full bg-primary-500 transition-all duration-300"
                style={{
                  width: i === tipIndex ? 16 : 4,
                  opacity: i === tipIndex ? 1 : 0.3,
                }}
              />
            ))}
          </div>
        </div>
      </div>
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
