import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Building2, Bell } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PersonalSettings from '../components/settings/PersonalSettings';
import BusinessSettings from '../components/settings/BusinessSettings';
import NotificationPreferences from '../components/settings/NotificationPreferences';
import { useAuthStore } from '../lib/store';
import LoadingSpinner from '../components/ui/LoadingSpinner';

export default function Settings() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'personal' | 'business' | 'notifications'>('personal');
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
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6 pb-16">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary/8 via-transparent to-transparent p-5 sm:p-7 border border-border/50"
      >
        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1.5 tracking-tight">
            {t('settings.title')}
          </h1>
          <p className="text-foreground-muted text-sm sm:text-base max-w-2xl">
            {t('settings.subtitle')}
          </p>
        </div>
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/8 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      </motion.div>

      {/* Tabs — full width on mobile */}
      <div className="flex p-1 gap-1 bg-card/60 backdrop-blur-xl rounded-xl border border-border/50">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'personal' | 'business')}
              className={`
                relative flex-1 sm:flex-none px-4 sm:px-6 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2
                ${isActive ? 'text-white shadow-lg' : 'text-foreground-muted hover:text-foreground'}
              `}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-primary rounded-lg"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
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
          {activeTab === 'personal' && <PersonalSettings />}
          {activeTab === 'business' && <BusinessSettings />}
          {activeTab === 'notifications' && <NotificationPreferences />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}