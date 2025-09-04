import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useAuthStore } from '../lib/store';
import { updateUserProfile } from '../lib/api/auth';
import { updatePassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import AnimatedCard from '../components/ui/AnimatedCard';
import { User, Lock, Bell, Palette } from 'lucide-react';

export default function Settings() {
  const [isLoading, setIsLoading] = useState(false);
  const profile = useAuthStore((state) => state.profile);
  const setProfile = useAuthStore((state) => state.setProfile);

  async function handleProfileSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const updates = {
        full_name: formData.get('fullName') as string,
        company: formData.get('company') as string,
        phone: formData.get('phone') as string,
        preferred_currency: formData.get('currency') as string,
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
      const newPassword = formData.get('newPassword') as string;
      const confirmPassword = formData.get('confirmPassword') as string;

      if (newPassword !== confirmPassword) {
        throw new Error('New passwords do not match');
      }

      if (!auth.currentUser) {
        throw new Error('No authenticated user');
      }

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Profile Settings */}
        <AnimatedCard delay={0.1}>
          <div className="p-6 sm:p-8">
            <div className="flex items-center mb-8">
              <div className="p-3 rounded-lg bg-primary-500/20 text-primary-400 mr-4">
                <User className="w-6 h-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-white">Profile Settings</h3>
            </div>
            
            <form onSubmit={handleProfileSubmit} className="space-y-4 sm:space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <label htmlFor="fullName" className="block text-base font-medium text-gray-300 mb-3">
                  Full Name
                </label>
                <input
                  type="text"
                  name="fullName"
                  id="fullName"
                  defaultValue={profile?.full_name}
                  required
                  className="w-full input-dark input-large"
                />
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <label htmlFor="email" className="block text-base font-medium text-gray-300 mb-3">
                  Email
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
                transition={{ delay: 0.4 }}
              >
                <label htmlFor="company" className="block text-base font-medium text-gray-300 mb-3">
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
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <label htmlFor="phone" className="block text-base font-medium text-gray-300 mb-3">
                  Phone
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
                <label htmlFor="currency" className="block text-base font-medium text-gray-300 mb-3">
                  Preferred Currency
                </label>
                <select
                  name="currency"
                  id="currency"
                  defaultValue={profile?.preferred_currency || 'USD'}
                  className="w-full input-dark input-large"
                >
                  <option value="USD">USD ($)</option>
                  <option value="PKR">PKR (₨)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="JPY">JPY (¥)</option>
                </select>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
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

        {/* Password Settings */}
        <AnimatedCard delay={0.2}>
          <div className="p-8">
            <div className="flex items-center mb-8">
              <div className="p-3 rounded-lg bg-accent-500/20 text-accent-400 mr-4">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-white">Change Password</h3>
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
          </div>
        </AnimatedCard>
      </div>
    </div>
  );
}