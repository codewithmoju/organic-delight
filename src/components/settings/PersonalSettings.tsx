import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { User, Save, Phone, Building2, MapPin, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '../../lib/store';
import { updateUserProfile } from '../../lib/api/auth';
import LoadingSpinner from '../ui/LoadingSpinner';

export default function PersonalSettings() {
    const profile = useAuthStore(state => state.profile);
    const setProfile = useAuthStore(state => state.setProfile);
    const [isSaving, setIsSaving] = useState(false);

    // Initialize form data from profile
    const initialData = useMemo(() => ({
        full_name: profile?.full_name || '',
        phone_number: profile?.phone_number || '',
        company: profile?.company || '',
        address: profile?.address || ''
    }), [profile]);

    const [formData, setFormData] = useState(initialData);

    // Check if there are changes
    const hasChanges = useMemo(() => {
        return JSON.stringify(formData) !== JSON.stringify(initialData);
    }, [formData, initialData]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile?.id) return;

        setIsSaving(true);
        try {
            await updateUserProfile(profile.id, formData);
            setProfile({ ...profile, ...formData });
            toast.success('Profile updated successfully');
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
        >
            {/* Header */}
            <motion.div variants={itemVariants}>
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground-muted flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
                        <Shield className="w-6 h-6" />
                    </div>
                    Personal Profile
                </h2>
                <p className="text-foreground-muted mt-2 ml-14">Manage your personal details and preferences</p>
            </motion.div>

            {/* Form Card */}
            <motion.div
                variants={itemVariants}
                className="p-6 rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-md transition-all duration-300"
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Full Name */}
                        <div className="space-y-2">
                            <label htmlFor="full_name" className="text-sm font-medium text-foreground-muted flex items-center gap-2">
                                <User className="w-4 h-4 text-primary-500" />
                                Full Name
                            </label>
                            <input
                                type="text"
                                id="full_name"
                                value={formData.full_name}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-foreground placeholder-foreground-muted/50"
                                placeholder="John Doe"
                            />
                        </div>

                        {/* Phone Number */}
                        <div className="space-y-2">
                            <label htmlFor="phone_number" className="text-sm font-medium text-foreground-muted flex items-center gap-2">
                                <Phone className="w-4 h-4 text-success-500" />
                                Phone Number
                            </label>
                            <input
                                type="tel"
                                id="phone_number"
                                value={formData.phone_number}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-foreground placeholder-foreground-muted/50"
                                placeholder="+1 234 567 890"
                            />
                        </div>

                        {/* Company */}
                        <div className="space-y-2">
                            <label htmlFor="company" className="text-sm font-medium text-foreground-muted flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-purple-500" />
                                Company
                            </label>
                            <input
                                type="text"
                                id="company"
                                value={formData.company}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-foreground placeholder-foreground-muted/50"
                                placeholder="Acme Inc."
                            />
                        </div>

                        {/* Address */}
                        <div className="space-y-2">
                            <label htmlFor="address" className="text-sm font-medium text-foreground-muted flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-error-500" />
                                Address
                            </label>
                            <input
                                type="text"
                                id="address"
                                value={formData.address}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-foreground placeholder-foreground-muted/50"
                                placeholder="123 Main St, City, Country"
                            />
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end pt-4 border-t border-border/50">
                        <button
                            type="submit"
                            disabled={isSaving || !hasChanges}
                            className={`
                flex items-center gap-2 px-8 py-3 rounded-xl shadow-lg transition-all duration-300
                ${hasChanges
                                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-primary-500/20 hover:shadow-primary-500/40 hover:-translate-y-0.5'
                                    : 'bg-secondary text-foreground-muted cursor-not-allowed'}
              `}
                        >
                            {isSaving ? (
                                <>
                                    <LoadingSpinner size="sm" color="white" />
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    <span>Save Changes</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
}
