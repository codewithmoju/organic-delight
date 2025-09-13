import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { User, Save, Mail, Phone, Building, MapPin } from 'lucide-react';
import { useAuthStore } from '../lib/store';
import { updateUserProfile } from '../lib/api/auth';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import AnimatedCard from '../components/ui/AnimatedCard';
import AvatarUpload from '../components/ui/AvatarUpload';

export default function Settings() {
  const [isLoading, setIsLoading] = useState(false);
  const { profile, setProfile } = useAuthStore((state) => ({ 
    profile: state.profile, 
    setProfile: state.setProfile 
  }));

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

  async function handleAvatarChange(avatarUrl: string | null) {
    try {
      await updateUserProfile(profile?.id, { avatar_url: avatarUrl });
      setProfile({ ...profile, avatar_url: avatarUrl });
    } catch (error) {
      toast.error('Failed to update avatar');
      console.error(error);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-gradient mb-2">Profile Settings</h1>
        <p className="text-gray-400 text-sm sm:text-base">
          Manage your personal information and account details
        </p>
      </motion.div>

      {/* Profile Form */}
      <AnimatedCard delay={0.1}>
        <div className="p-6 sm:p-8">
          <div className="flex items-center mb-8">
            <div className="p-3 rounded-lg bg-primary-500/20 text-primary-400 mr-4">
              <User className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold text-white">Personal Information</h3>
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
            {/* Full Name */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
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

            {/* Email (Read-only) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
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
              <p className="text-gray-500 text-sm mt-2">
                Email cannot be changed. Contact support if you need to update your email.
              </p>
            </motion.div>

            {/* Phone */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
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

            {/* Company */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
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

            {/* Address */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
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

            {/* Save Button */}
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
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </motion.button>
            </motion.div>
          </form>
        </div>
      </AnimatedCard>
    </div>
  );
}