import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { 
  User, 
  Lock, 
  Bell, 
  Palette, 
  Globe, 
  Shield, 
  Download,
  Moon, 
  Sun, 
  Monitor,
  Smartphone,
  Mail,
  MapPin,
  Phone,
  Building,
  Languages,
  HelpCircle,
  Package,
  ArrowUpDown,
  Clock,
  Type,
  Eye,
  Zap,
  RotateCcw,
  Save,
  AlertCircle,
  CheckCircle,
  Palette as PaletteIcon
} from 'lucide-react';
import { useAuthStore } from '../lib/store';
import { updateUserProfile } from '../lib/api/auth';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from '../lib/firebase';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import AnimatedCard from '../components/ui/AnimatedCard';
import AvatarUpload from '../components/ui/AvatarUpload';
import CurrencySelector from '../components/ui/CurrencySelector';
import { usePreferences } from '../lib/hooks/usePreferences';
import PreferenceGroup from '../components/settings/PreferenceGroup';
import PreferenceToggle from '../components/settings/PreferenceToggle';
import PreferenceSelect from '../components/settings/PreferenceSelect';
import PreferenceSlider from '../components/settings/PreferenceSlider';
import PreferenceSearch from '../components/settings/PreferenceSearch';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { formatDate } from '../lib/utils/notifications';
import { debounce } from '../lib/utils/debounce';
import { SUPPORTED_CURRENCIES } from '../lib/types';

export default function Settings() {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences' | 'notifications'>('profile');
  const profile = useAuthStore((state) => state.profile);
  const setProfile = useAuthStore((state) => state.setProfile);

  const {
    preferences,
    updatePreference,
    savePreferences,
    resetToDefaults,
    isLoading: preferencesLoading,
    hasUnsavedChanges,
    lastSaved,
  } = usePreferences();

  const [searchQuery, setSearchQuery] = useState('');
  const [showResetDialog, setShowResetDialog] = useState(false);

  async function handleProfileSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const updates = {
        full_name: formData.get('fullName') as string,
        company: formData.get('company') as string,
        phone: formData.get('phone') as string,
        address: formData.get('address') as string,
        preferred_currency: profile?.preferred_currency || 'USD',
      };

      await updateUserProfile(profile?.id, updates);

      setProfile({ ...profile, ...updates });
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handlePasswordChange(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const currentPassword = formData.get('currentPassword') as string;
      const newPassword = formData.get('newPassword') as string;
      const confirmPassword = formData.get('confirmPassword') as string;

      if (newPassword !== confirmPassword) {
        throw new Error('New passwords do not match');
      }

      if (!auth.currentUser) {
        throw new Error('No authenticated user');
      }

      // Re-authenticate user before changing password
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email!,
        currentPassword
      );
      await reauthenticateWithCredential(auth.currentUser, credential);

      await updatePassword(auth.currentUser, newPassword);

      toast.success('Password updated successfully');
      (e.target as HTMLFormElement).reset();
    } catch (error: any) {
      toast.error(error.message);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCurrencyChange(currency: string) {
    try {
      await updateUserProfile(profile?.id, { preferred_currency: currency });
      setProfile({ ...profile, preferred_currency: currency });
      toast.success('Currency updated successfully');
    } catch (error) {
      toast.error('Failed to update currency');
      console.error(error);
    }
  }

  async function handleAvatarChange(avatarUrl: string | null) {
    try {
      await updateUserProfile(profile?.id, { avatar_url: avatarUrl });
      setProfile({ ...profile, avatar_url: avatarUrl });
    } catch (error) {
      toast.error('Failed to update avatar');
      console.error(error);
    }
  }

  const handleResetToDefaults = async () => {
    await resetToDefaults();
    setShowResetDialog(false);
  };

  const filteredPreferences = (groupName: string, items: string[]) => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return groupName.toLowerCase().includes(query) || 
           items.some(item => item.toLowerCase().includes(query));
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'preferences', label: 'Preferences', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ] as const;

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-gradient mb-2">Settings</h1>
        <p className="text-gray-400 text-sm sm:text-base">
          Manage your account preferences and security settings
        </p>
      </motion.div>

      {/* Tab Navigation */}
      <AnimatedCard delay={0.1}>
        <div className="p-4 sm:p-6">
          <div className="flex flex-wrap gap-2 sm:gap-4">
            {tabs.map((tab, index) => (
              <motion.button
                key={tab.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-glow'
                    : 'bg-dark-700/50 text-gray-300 hover:bg-dark-600/50 hover:text-white'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </AnimatedCard>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'profile' && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <AnimatedCard delay={0.2}>
              <div className="p-6 sm:p-8">
                <div className="flex items-center mb-8">
                  <div className="p-3 rounded-lg bg-primary-500/20 text-primary-400 mr-4">
                    <User className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">Profile Information</h3>
                </div>

                {/* Avatar Section */}
                <div className="mb-8 text-center">
                  <AvatarUpload
                    currentAvatar={profile?.avatar_url}
                    userName={profile?.full_name || ''}
                    onAvatarChange={handleAvatarChange}
                    size="lg"
                  />
                </div>

                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <label htmlFor="fullName" className="block text-base font-medium text-gray-300 mb-3">
                        <User className="w-4 h-4 inline mr-2" />
                        Full Name
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        id="fullName"
                        defaultValue={profile?.full_name}
                        required
                        className="w-full input-dark input-large"
                        placeholder="Enter your full name"
                      />
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <label htmlFor="email" className="block text-base font-medium text-gray-300 mb-3">
                        <Mail className="w-4 h-4 inline mr-2" />
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="email"
                        id="email"
                        value={profile?.email}
                        disabled
                        className="w-full input-dark input-large opacity-50 cursor-not-allowed"
                      />
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <label htmlFor="phone" className="block text-base font-medium text-gray-300 mb-3">
                        <Phone className="w-4 h-4 inline mr-2" />
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        id="phone"
                        defaultValue={profile?.phone || ''}
                        className="w-full input-dark input-large"
                        placeholder="Enter phone number"
                      />
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                    >
                      <label htmlFor="company" className="block text-base font-medium text-gray-300 mb-3">
                        <Building className="w-4 h-4 inline mr-2" />
                        Company
                      </label>
                      <input
                        type="text"
                        name="company"
                        id="company"
                        defaultValue={profile?.company || ''}
                        className="w-full input-dark input-large"
                        placeholder="Enter company name"
                      />
                    </motion.div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                  >
                    <label htmlFor="address" className="block text-base font-medium text-gray-300 mb-3">
                      <MapPin className="w-4 h-4 inline mr-2" />
                      Address
                    </label>
                    <textarea
                      name="address"
                      id="address"
                      rows={3}
                      defaultValue={profile?.address || ''}
                      className="w-full input-dark input-large resize-none"
                      placeholder="Enter your address"
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="pt-6"
                  >
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="submit"
                      disabled={isLoading}
                      className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-lg"
                    >
                      {isLoading ? (
                        <>
                          <LoadingSpinner size="sm" color="white" />
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </motion.button>
                  </motion.div>
                </form>
              </div>
            </AnimatedCard>
          </motion.div>
        )}

        {activeTab === 'security' && (
          <motion.div
            key="security"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <AnimatedCard delay={0.2}>
              <div className="p-6 sm:p-8">
                <div className="flex items-center mb-8">
                  <div className="p-3 rounded-lg bg-accent-500/20 text-accent-400 mr-4">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">Security Settings</h3>
                </div>

                <form onSubmit={handlePasswordChange} className="space-y-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <label htmlFor="currentPassword" className="block text-base font-medium text-gray-300 mb-3">
                      Current Password
                    </label>
                    <input
                      type="password"
                      name="currentPassword"
                      id="currentPassword"
                      required
                      className="w-full input-dark input-large"
                      placeholder="Enter current password"
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <label htmlFor="newPassword" className="block text-base font-medium text-gray-300 mb-3">
                      New Password
                    </label>
                    <input
                      type="password"
                      name="newPassword"
                      id="newPassword"
                      required
                      className="w-full input-dark input-large"
                      placeholder="Enter new password"
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <label htmlFor="confirmPassword" className="block text-base font-medium text-gray-300 mb-3">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      id="confirmPassword"
                      required
                      className="w-full input-dark input-large"
                      placeholder="Confirm new password"
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="pt-6"
                  >
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="submit"
                      disabled={isLoading}
                      className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-lg"
                    >
                      {isLoading ? (
                        <>
                          <LoadingSpinner size="sm" color="white" />
                          Updating...
                        </>
                      ) : (
                        'Update Password'
                      )}
                    </motion.button>
                  </motion.div>
                </form>

                {/* Two-Factor Authentication */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="mt-8 pt-8 border-t border-dark-700/50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-2">Two-Factor Authentication</h4>
                      <p className="text-gray-400 text-sm">Add an extra layer of security to your account</p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="btn-secondary flex items-center gap-2"
                    >
                      <Shield className="w-4 h-4" />
                      Enable 2FA
                    </motion.button>
                  </div>
                </motion.div>
              </div>
            </AnimatedCard>
          </motion.div>
        )}

        {activeTab === 'preferences' && (
          <motion.div
            key="preferences"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <AnimatedCard delay={0.2}>
              <div className="p-6 sm:p-8">
                <div className="flex items-center mb-8">
                  <div className="p-3 rounded-lg bg-success-500/20 text-success-400 mr-4">
                    <Palette className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">Preferences</h3>
                </div>

                <div className="space-y-8">
                  {/* Currency Selection */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <label className="block text-base font-medium text-gray-300 mb-4">
                      <Globe className="w-4 h-4 inline mr-2" />
                      Preferred Currency
                    </label>
                    <CurrencySelector
                      selectedCurrency={profile?.preferred_currency || 'USD'}
                      onCurrencyChange={handleCurrencyChange}
                    />
                  </motion.div>

                  {/* Language Selection */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <label className="block text-base font-medium text-gray-300 mb-4">
                      <Languages className="w-4 h-4 inline mr-2" />
                      Language
                    </label>
                    <select className="w-full input-dark input-large">
                      <option value="en">English</option>
                      <option value="es">Español</option>
                      <option value="fr">Français</option>
                      <option value="de">Deutsch</option>
                      <option value="zh">中文</option>
                      <option value="ja">日本語</option>
                    </select>
                  </motion.div>

                  {/* Theme Selection */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <label className="block text-base font-medium text-gray-300 mb-4">
                      Theme Preference
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { id: 'light', label: 'Light', icon: Sun },
                        { id: 'dark', label: 'Dark', icon: Moon },
                        { id: 'system', label: 'System', icon: Monitor },
                      ].map((theme) => (
                        <motion.button
                          key={theme.id}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                            (profile?.theme || 'dark') === theme.id
                              ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                              : 'border-dark-600 bg-dark-700/30 text-gray-400 hover:border-primary-500/50'
                          }`}
                        >
                          <theme.icon className="w-6 h-6 mx-auto mb-2" />
                          <div className="font-medium">{theme.label}</div>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>

                  {/* Data Export */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="pt-6 border-t border-dark-700/50"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-semibold text-white mb-2">Data Export</h4>
                        <p className="text-gray-400 text-sm">Download your data for backup or migration</p>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="btn-secondary flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Export Data
                      </motion.button>
                    </div>
                  </motion.div>
                </div>
              </div>
            </AnimatedCard>
          </motion.div>
        )}

        {activeTab === 'notifications' && (
          <motion.div
            key="notifications"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <AnimatedCard delay={0.2}>
              <div className="p-6 sm:p-8">
                <div className="flex items-center mb-8">
                  <div className="p-3 rounded-lg bg-warning-500/20 text-warning-400 mr-4">
                    <Bell className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">Notification Settings</h3>
                </div>

                <div className="space-y-6">
                  {[
                    {
                      id: 'email_notifications',
                      title: 'Email Notifications',
                      description: 'Receive notifications via email',
                      icon: Mail,
                    },
                    {
                      id: 'push_notifications',
                      title: 'Push Notifications',
                      description: 'Receive push notifications on your device',
                      icon: Smartphone,
                    },
                    {
                      id: 'low_stock_alerts',
                      title: 'Low Stock Alerts',
                      description: 'Get notified when items are running low',
                      icon: Package,
                    },
                    {
                      id: 'transaction_alerts',
                      title: 'Transaction Alerts',
                      description: 'Notifications for new transactions',
                      icon: ArrowUpDown,
                    },
                  ].map((setting, index) => (
                    <motion.div
                      key={setting.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="flex items-center justify-between p-4 rounded-xl bg-dark-700/30 border border-dark-600/50"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="p-2 rounded-lg bg-primary-500/20 text-primary-400">
                          <setting.icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-white font-medium">{setting.title}</h4>
                          <p className="text-gray-400 text-sm">{setting.description}</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          defaultChecked={true}
                        />
                        <div className="w-11 h-6 bg-dark-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </motion.div>
                  ))}
                </div>

                {/* Help Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="mt-8 pt-8 border-t border-dark-700/50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-2">Need Help?</h4>
                      <p className="text-gray-400 text-sm">Get support or view documentation</p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="btn-secondary flex items-center gap-2"
                    >
                      <HelpCircle className="w-4 h-4" />
                      Help Center
                    </motion.button>
                  </div>
                </motion.div>
              </div>
            </AnimatedCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}