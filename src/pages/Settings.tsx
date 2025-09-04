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
            <div className="space-y-6">
              {/* Search Preferences */}
              <PreferenceSearch
                onSearch={setSearchQuery}
                placeholder="Search preferences..."
              />

              {/* Currency & Localization */}
              {filteredPreferences('Currency & Localization', ['currency', 'language', 'timezone', 'date format']) && (
                <PreferenceGroup
                  title="Currency & Localization"
                  description="Configure your regional preferences"
                  icon={<Globe className="w-5 h-5" />}
                >
                  <div className="space-y-4">
                    <div>
                      <label className="block text-base font-medium text-gray-300 mb-3">
                        <Globe className="w-4 h-4 inline mr-2" />
                        Preferred Currency
                      </label>
                      <CurrencySelector
                        selectedCurrency={profile?.preferred_currency || 'USD'}
                        onCurrencyChange={handleCurrencyChange}
                        showPopular={true}
                        className="w-full"
                      />
                    </div>

                    <PreferenceSelect
                      label="Language"
                      description="Choose your preferred language"
                      icon={<Languages className="w-4 h-4" />}
                      value={preferences.language}
                      options={[
                        { value: 'en', label: 'English' },
                        { value: 'es', label: 'Español' },
                        { value: 'fr', label: 'Français' },
                        { value: 'de', label: 'Deutsch' },
                        { value: 'it', label: 'Italiano' },
                        { value: 'pt', label: 'Português' },
                        { value: 'zh', label: '中文' },
                        { value: 'ja', label: '日本語' },
                      ]}
                      onChange={(value) => updatePreference('language', value)}
                    />

                    <PreferenceSelect
                      label="Date Format"
                      description="Choose how dates are displayed"
                      icon={<Clock className="w-4 h-4" />}
                      value={preferences.date_format}
                      options={[
                        { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (US)' },
                        { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (EU)' },
                        { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO)' },
                      ]}
                      onChange={(value) => updatePreference('date_format', value)}
                    />

                    <PreferenceSelect
                      label="Time Format"
                      description="Choose 12-hour or 24-hour time format"
                      icon={<Clock className="w-4 h-4" />}
                      value={preferences.time_format}
                      options={[
                        { value: '12h', label: '12-hour (AM/PM)' },
                        { value: '24h', label: '24-hour' },
                      ]}
                      onChange={(value) => updatePreference('time_format', value)}
                    />
                  </div>
                </PreferenceGroup>
              )}

              {/* Appearance */}
              {filteredPreferences('Appearance', ['theme', 'font size', 'animations', 'contrast']) && (
                <PreferenceGroup
                  title="Appearance"
                  description="Customize the look and feel of the application"
                  icon={<PaletteIcon className="w-5 h-5" />}
                >
                  <PreferenceSelect
                    label="Theme"
                    description="Choose your preferred color scheme"
                    icon={<Monitor className="w-4 h-4" />}
                    value={preferences.theme}
                    options={[
                      { value: 'light', label: '☀️ Light Mode' },
                      { value: 'dark', label: '🌙 Dark Mode' },
                      { value: 'system', label: '💻 System Default' },
                    ]}
                    onChange={(value) => updatePreference('theme', value)}
                  />

                  <PreferenceSelect
                    label="Font Size"
                    description="Adjust text size for better readability"
                    icon={<Type className="w-4 h-4" />}
                    value={preferences.font_size}
                    options={[
                      { value: 'small', label: 'Small' },
                      { value: 'medium', label: 'Medium' },
                      { value: 'large', label: 'Large' },
                    ]}
                    onChange={(value) => updatePreference('font_size', value)}
                  />

                  <PreferenceToggle
                    label="Show Animations"
                    description="Enable smooth transitions and animations"
                    icon={<Zap className="w-4 h-4" />}
                    checked={preferences.show_animations}
                    onChange={(checked) => updatePreference('show_animations', checked)}
                  />

                  <PreferenceToggle
                    label="High Contrast Mode"
                    description="Increase contrast for better visibility"
                    icon={<Eye className="w-4 h-4" />}
                    checked={preferences.high_contrast}
                    onChange={(checked) => updatePreference('high_contrast', checked)}
                  />

                  <PreferenceToggle
                    label="Compact View"
                    description="Show more content in less space"
                    icon={<Package className="w-4 h-4" />}
                    checked={preferences.compact_view}
                    onChange={(checked) => updatePreference('compact_view', checked)}
                  />
                </PreferenceGroup>
              )}

              {/* Behavior */}
              {filteredPreferences('Behavior', ['auto save', 'items per page', 'currency display']) && (
                <PreferenceGroup
                  title="Behavior"
                  description="Configure how the application behaves"
                  icon={<Zap className="w-5 h-5" />}
                >
                  <PreferenceToggle
                    label="Auto-Save"
                    description="Automatically save changes as you make them"
                    icon={<Save className="w-4 h-4" />}
                    checked={preferences.auto_save}
                    onChange={(checked) => updatePreference('auto_save', checked)}
                  />

                  <PreferenceSlider
                    label="Items Per Page"
                    description="Number of items to show in lists"
                    icon={<Package className="w-4 h-4" />}
                    value={preferences.items_per_page}
                    min={10}
                    max={100}
                    step={5}
                    onChange={(value) => updatePreference('items_per_page', value)}
                  />

                  <PreferenceSelect
                    label="Currency Display"
                    description="How to display currency information"
                    icon={<Globe className="w-4 h-4" />}
                    value={preferences.default_currency_display}
                    options={[
                      { value: 'symbol', label: 'Symbol only ($)' },
                      { value: 'code', label: 'Code only (USD)' },
                      { value: 'both', label: 'Both ($ USD)' },
                    ]}
                    onChange={(value) => updatePreference('default_currency_display', value)}
                  />
                </PreferenceGroup>
              )}

              {/* Save Actions */}
              <AnimatedCard delay={0.4}>
                <div className="p-6">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-center sm:text-left">
                      {hasUnsavedChanges && (
                        <div className="flex items-center text-warning-400 mb-2">
                          <AlertCircle className="w-4 h-4 mr-2" />
                          <span className="text-sm">You have unsaved changes</span>
                        </div>
                      )}
                      {lastSaved && (
                        <div className="flex items-center text-success-400 text-sm">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          <span>Last saved: {formatDate(lastSaved)}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-3">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowResetDialog(true)}
                        className="btn-secondary flex items-center gap-2"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Reset to Defaults
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={savePreferences}
                        disabled={preferencesLoading || !hasUnsavedChanges}
                        className="btn-primary flex items-center gap-2"
                      >
                        {preferencesLoading ? (
                          <LoadingSpinner size="sm" color="white" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        Save All Changes
                      </motion.button>
                    </div>
                  </div>
                </div>
              </AnimatedCard>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}