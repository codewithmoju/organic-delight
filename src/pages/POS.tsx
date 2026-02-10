import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, BarChart3, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import POSInterface from '../components/pos/POSInterface';
import SalesReports from '../components/pos/SalesReports';
import POSSettings from '../components/pos/POSSettings';

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
        className="flex items-center justify-between gap-4"
      >
        {/* Title — hide on terminal tab to maximize space */}
        {activeView !== 'interface' && (
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gradient">{t('pos.title')}</h1>
            <p className="text-foreground-muted mt-1">
              {t('pos.subtitle')}
            </p>
          </div>
        )}

        {/* View Selector */}
        <div className={`flex bg-card/80 backdrop-blur-sm rounded-xl p-1 border border-border/50 shadow-sm ${activeView === 'interface' ? '' : 'ml-auto'}`}>
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
                  className="absolute inset-0 bg-primary-600 rounded-lg shadow-glow"
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
      <motion.div
        key={activeView}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeView === 'interface' && <POSInterface />}
        {activeView === 'reports' && <SalesReports />}
        {activeView === 'settings' && <POSSettings />}
      </motion.div>
    </div>
  );
}