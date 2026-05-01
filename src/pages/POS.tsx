import { useState, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, BarChart3, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LoadingSpinner from '../components/ui/LoadingSpinner';

// Eagerly load the terminal — it's the default view
import POSInterface from '../components/pos/POSInterface';

// Lazy-load heavy sub-views that are not visible on initial load
const SalesReports = lazy(() => import('../components/pos/SalesReports'));
const POSSettings = lazy(() => import('../components/pos/POSSettings'));

const SubViewFallback = () => (
  <div className="min-h-[40vh] flex items-center justify-center">
    <LoadingSpinner size="lg" />
  </div>
);

type POSView = 'interface' | 'reports' | 'settings';

export default function POS() {
  const { t } = useTranslation();
  const [activeView, setActiveView] = useState<POSView>('interface');

  const views = [
    { id: 'interface', label: t('pos.tabs.terminal'), icon: ShoppingCart },
    { id: 'reports', label: t('pos.tabs.reports'), icon: BarChart3 },
    { id: 'settings', label: t('pos.tabs.settings'), icon: Settings },
  ] as const;

  return (
    <div className={activeView === 'interface' ? 'space-y-2' : 'space-y-6'}>
      {/* Header — compact on terminal view */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="app-page-header gap-4"
      >
        {/* Title — hide on terminal tab to maximize space */}
        {activeView !== 'interface' && (
          <div>
            <h1 className="app-page-title">{t('pos.title')}</h1>
            <p className="app-page-subtitle">
              {t('pos.subtitle')}
            </p>
          </div>
        )}

        {/* View Selector */}
        <div className={`flex app-toolbar-surface rounded-xl p-1 ${activeView === 'interface' ? '' : 'ml-auto'}`}>
          {views.map((view) => (
            <motion.button
              key={view.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveView(view.id)}
              className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeView === view.id
                ? 'text-white'
                : 'text-foreground-muted hover:text-foreground hover:bg-muted/50'
                }`}
            >
              {activeView === view.id && (
                <motion.div
                  layoutId="pos-tab-indicator"
                  className="absolute inset-0 bg-primary-700 rounded-lg shadow-glow"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                />
              )}
              <view.icon className="w-4 h-4 relative z-10" />
              <span className="hidden sm:inline relative z-10">{view.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* View Content */}
      <div>
        {activeView === 'interface' && <POSInterface />}
        {activeView === 'reports' && (
          <Suspense fallback={<SubViewFallback />}>
            <SalesReports />
          </Suspense>
        )}
        {activeView === 'settings' && (
          <Suspense fallback={<SubViewFallback />}>
            <POSSettings />
          </Suspense>
        )}
      </div>
    </div>
  );
}