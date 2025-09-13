import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { User, Save, Mail, Phone, Building, MapPin } from 'lucide-react';
import { useAuthStore } from '../lib/store';
import { updateUserProfile } from '../lib/api/auth';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import AnimatedCard from '../components/ui/AnimatedCard';

export default function Settings() {
  console.log('Settings component render');
  
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    company: '',
    address: ''
  });
  const [hasChanges, setHasChanges] = useState(false);

  // Use stable selectors to prevent unnecessary re-renders
  const profile = useAuthStore(useCallback((state) => state.profile, []));
  const setProfile = useAuthStore(useCallback((state) => state.setProfile, []));

  // Memoize profile data to prevent reference changes
  const memoizedProfile = useMemo(() => {
    if (!profile) return null;
    
    return {
      id: profile.id,
      full_name: profile.full_name || '',
      email: profile.email || '',
      phone: profile.phone || '',
      company: profile.company || '',
      address: profile.address || ''
    };
  }, [profile?.id, profile?.full_name, profile?.email, profile?.phone, profile?.company, profile?.address]);

  // Initialize form data only when profile changes
  useEffect(() => {
    console.log('Settings useEffect - profile changed', memoizedProfile?.id);
    
    if (memoizedProfile) {
      setFormData({
        full_name: memoizedProfile.full_name,
        phone: memoizedProfile.phone,
        company: memoizedProfile.company,
        address: memoizedProfile.address
      });
      setHasChanges(false);
    }
  }, [memoizedProfile?.id]); // Only depend on profile ID to prevent loops

  // Stable form field update handler
  const handleFieldChange = useCallback((field: string, value: string) => {
    console.log('Settings field change:', field, value);
    
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Check if there are actual changes
      if (memoizedProfile) {
        const hasActualChanges = Object.keys(newData).some(key => 
          newData[key as keyof typeof newData] !== memoizedProfile[key as keyof typeof memoizedProfile]
        );
        setHasChanges(hasActualChanges);
      }
      
      return newData;
    });
  }, [memoizedProfile]);

  // Stable form submit handler
  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('Settings form submit');
    
    if (!memoizedProfile?.id || !hasChanges) {
      console.log('No changes to save or no profile ID');
      return;
    }

    setIsLoading(true);

    try {
      await updateUserProfile(memoizedProfile.id, formData);
      
      // Update the profile in store with functional update to prevent loops
      setProfile((prevProfile: any) => {
        if (!prevProfile) return prevProfile;
        
        return {
          ...prevProfile,
          ...formData,
          updated_at: new Date()
        };
      });
      
      setHasChanges(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  }, [memoizedProfile?.id, formData, hasChanges, setProfile]);

  // Don't render if no profile
  if (!memoizedProfile) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Loading profile..." />
      </div>
    );
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

          <form onSubmit={handleSubmit} className="space-y-6">
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
                id="fullName"
                value={formData.full_name}
                onChange={(e) => handleFieldChange('full_name', e.target.value)}
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
                id="email"
                value={memoizedProfile.email}
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
                id="phone"
                value={formData.phone}
                onChange={(e) => handleFieldChange('phone', e.target.value)}
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
                id="company"
                value={formData.company}
                onChange={(e) => handleFieldChange('company', e.target.value)}
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
                id="address"
                rows={3}
                value={formData.address}
                onChange={(e) => handleFieldChange('address', e.target.value)}
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
                disabled={isLoading || !hasChanges}
                className={`btn-primary w-full flex items-center justify-center gap-2 py-4 text-lg ${
                  !hasChanges ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" color="white" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {hasChanges ? 'Save Changes' : 'No Changes'}
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