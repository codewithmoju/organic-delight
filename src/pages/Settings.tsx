import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Building2 } from 'lucide-react';
import PersonalSettings from '../components/settings/PersonalSettings';
import BusinessSettings from '../components/settings/BusinessSettings';
import { useAuthStore } from '../lib/store';
import LoadingSpinner from '../components/ui/LoadingSpinner';

export default function Settings() {
  const [activeTab, setActiveTab] = useState<'personal' | 'business'>('personal');
  const profile = useAuthStore(state => state.profile);

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Loading profile..." />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-gradient mb-2">Settings</h1>
        <p className="text-gray-400 text-sm sm:text-base">
          Manage your personal and business information
        </p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-dark-700">
        <button
          onClick={() => setActiveTab('personal')}
          className={`px-6 py-3 font-medium transition-colors relative ${activeTab === 'personal'
              ? 'text-primary-400'
              : 'text-gray-400 hover:text-gray-300'
            }`}
        >
          <User className="w-4 h-4 inline mr-2" />
          Personal Info
          {activeTab === 'personal' && (
            <motion.div
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500"
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab('business')}
          className={`px-6 py-3 font-medium transition-colors relative ${activeTab === 'business'
              ? 'text-primary-400'
              : 'text-gray-400 hover:text-gray-300'
            }`}
        >
          <Building2 className="w-4 h-4 inline mr-2" />
          Business Profile
          {activeTab === 'business' && (
            <motion.div
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500"
            />
          )}
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'personal' ? <PersonalSettings /> : <BusinessSettings />}
    </div>
  );
}