import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Building2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PersonalSettings from '../components/settings/PersonalSettings';
import BusinessSettings from '../components/settings/BusinessSettings';
import { useAuthStore } from '../lib/store';
import LoadingSpinner from '../components/ui/LoadingSpinner';

export default function Settings() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'personal' | 'business'>('personal');
  const profile = useAuthStore(state => state.profile);

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text={t('common.loading', 'Loading...')} />
      </div>
    );
  }

  const tabs = [
    { id: 'personal', label: t('settings.tabs.personal'), icon: User },
    { id: 'business', label: t('settings.tabs.business'), icon: Building2 },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-500/10 via-transparent to-transparent p-8 border border-border/50"
      >
        <div className="relative z-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3 tracking-tight">
            {t('settings.title')}
          </h1>
          <p className="text-foreground-muted text-lg max-w-2xl">
            {t('settings.subtitle')}
          </p>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      </motion.div>

      {/* Tabs */}
      <div className="flex p-1 space-x-1 bg-card/50 backdrop-blur-xl rounded-xl border border-border/50 w-fit">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'personal' | 'business')}
              className={`
                relative px-6 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2
                ${isActive ? 'text-primary-foreground shadow-lg' : 'text-foreground-muted hover:text-foreground'}
              `}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-primary-500 rounded-lg"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'personal' ? <PersonalSettings /> : <BusinessSettings />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}