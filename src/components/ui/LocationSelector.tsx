import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ChevronDown, Check } from 'lucide-react';
import { useLocations } from '../../lib/hooks/useLocations';

export default function LocationSelector() {
  const { locations, activeLocationId, setActive, getActive } = useLocations();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = getActive();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Don't render if only one location or none
  if (locations.length <= 1) return null;

  return (
    <div ref={ref} className="relative hidden sm:block">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary/60 hover:bg-secondary text-sm font-medium text-foreground transition-colors"
      >
        <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
        <span className="max-w-[120px] truncate">{active?.name ?? 'Select Location'}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.12 }}
            className="absolute left-0 top-full mt-1.5 z-50 w-52 bg-card border border-border/60 rounded-xl shadow-xl overflow-hidden"
          >
            <div className="p-1">
              {locations.map(loc => (
                <button
                  key={loc.id}
                  onClick={() => { setActive(loc.id); setOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-left hover:bg-secondary/60 transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  <span className="flex-1 truncate font-medium text-foreground">{loc.name}</span>
                  {activeLocationId === loc.id && (
                    <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
