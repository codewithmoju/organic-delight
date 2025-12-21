import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Building2, Upload, X, Save, MapPin, Phone, Mail, Hash, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '../../lib/store';
import { updateUserProfile } from '../../lib/api/auth';
import { BUSINESS_TYPES } from '../../lib/constants/businessTypes';
import LoadingSpinner from '../ui/LoadingSpinner';

export default function BusinessSettings() {
    const profile = useAuthStore(state => state.profile);
    const setProfile = useAuthStore(state => state.setProfile);
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        business_name: profile?.business_name || '',
        business_type: profile?.business_type || '',
        business_tagline: profile?.business_tagline || '',
        business_logo: profile?.business_logo || '',
        business_address: profile?.business_address || '',
        business_city: profile?.business_city || '',
        business_country: profile?.business_country || 'Pakistan',
        business_phone: profile?.business_phone || '',
        business_email: profile?.business_email || '',
        tax_number: profile?.tax_number || '',
        receipt_header: profile?.receipt_header || '',
        receipt_footer: profile?.receipt_footer || 'Thank you for your business!'
    });

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            toast.error('Logo must be less than 2MB');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            setFormData(prev => ({ ...prev, business_logo: base64 }));
            toast.success('Logo uploaded successfully');
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveLogo = () => {
        setFormData(prev => ({ ...prev, business_logo: '' }));
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSave = async () => {
        if (!profile?.id) {
            toast.error('User profile not found');
            return;
        }

        setIsSaving(true);
        try {
            await updateUserProfile(profile.id, formData);
            setProfile({ ...profile, ...formData });
            toast.success('Business settings saved successfully!');
        } catch (error: any) {
            console.error('Error saving business settings:', error);
            toast.error(error.message || 'Failed to save settings');
        } finally {
            setIsSaving(false);
        }
    };

    const selectedBusinessType = BUSINESS_TYPES.find(t => t.value === formData.business_type);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gradient flex items-center gap-2">
                    <Building2 className="w-6 h-6" />
                    Business Profile
                </h2>
                <p className="text-gray-400 mt-1">Personalize your business information and branding</p>
            </div>

            {/* Logo Upload */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6"
            >
                <h3 className="text-lg font-semibold text-white mb-4">Business Logo</h3>

                <div className="flex items-center gap-6">
                    {formData.business_logo ? (
                        <div className="relative">
                            <img
                                src={formData.business_logo}
                                alt="Business Logo"
                                className="w-32 h-32 object-contain rounded-lg border-2 border-primary-500/30 bg-dark-800"
                            />
                            <button
                                onClick={handleRemoveLogo}
                                className="absolute -top-2 -right-2 p-1 bg-error-500 hover:bg-error-600 rounded-full transition-colors"
                            >
                                <X className="w-4 h-4 text-white" />
                            </button>
                        </div>
                    ) : (
                        <div className="w-32 h-32 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center bg-dark-800/50">
                            <Building2 className="w-12 h-12 text-gray-600" />
                        </div>
                    )}

                    <div className="flex-1">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="btn-secondary flex items-center gap-2"
                        >
                            <Upload className="w-4 h-4" />
                            Upload Logo
                        </button>
                        <p className="text-sm text-gray-500 mt-2">
                            Recommended: Square image, max 2MB
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Basic Information */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-card p-6"
            >
                <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Business Name *
                        </label>
                        <input
                            type="text"
                            value={formData.business_name}
                            onChange={(e) => setFormData(prev => ({ ...prev, business_name: e.target.value }))}
                            placeholder="e.g., Ali Electronics"
                            className="w-full input-dark"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Business Type
                        </label>
                        <select
                            value={formData.business_type}
                            onChange={(e) => setFormData(prev => ({ ...prev, business_type: e.target.value }))}
                            className="w-full input-dark"
                        >
                            <option value="">Select type</option>
                            {BUSINESS_TYPES.map(type => (
                                <option key={type.value} value={type.value}>
                                    {type.icon} {type.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Tagline / Slogan
                        </label>
                        <input
                            type="text"
                            value={formData.business_tagline}
                            onChange={(e) => setFormData(prev => ({ ...prev, business_tagline: e.target.value }))}
                            placeholder="e.g., Your Trusted Electronics Partner"
                            className="w-full input-dark"
                        />
                    </div>
                </div>
            </motion.div>

            {/* Contact Information */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-card p-6"
            >
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Phone className="w-5 h-5 text-accent-400" />
                    Contact Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            <MapPin className="w-4 h-4 inline mr-1" />
                            Street Address
                        </label>
                        <input
                            type="text"
                            value={formData.business_address}
                            onChange={(e) => setFormData(prev => ({ ...prev, business_address: e.target.value }))}
                            placeholder="e.g., Shop #12, Main Market"
                            className="w-full input-dark"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            City
                        </label>
                        <input
                            type="text"
                            value={formData.business_city}
                            onChange={(e) => setFormData(prev => ({ ...prev, business_city: e.target.value }))}
                            placeholder="e.g., Lahore"
                            className="w-full input-dark"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Country
                        </label>
                        <input
                            type="text"
                            value={formData.business_country}
                            onChange={(e) => setFormData(prev => ({ ...prev, business_country: e.target.value }))}
                            className="w-full input-dark"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            <Phone className="w-4 h-4 inline mr-1" />
                            Phone Number
                        </label>
                        <input
                            type="tel"
                            value={formData.business_phone}
                            onChange={(e) => setFormData(prev => ({ ...prev, business_phone: e.target.value }))}
                            placeholder="+92 300 1234567"
                            className="w-full input-dark"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            <Mail className="w-4 h-4 inline mr-1" />
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={formData.business_email}
                            onChange={(e) => setFormData(prev => ({ ...prev, business_email: e.target.value }))}
                            placeholder="info@alielectronics.com"
                            className="w-full input-dark"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            <Hash className="w-4 h-4 inline mr-1" />
                            Tax / GST Number
                        </label>
                        <input
                            type="text"
                            value={formData.tax_number}
                            onChange={(e) => setFormData(prev => ({ ...prev, tax_number: e.target.value }))}
                            placeholder="e.g., GST-123456789"
                            className="w-full input-dark"
                        />
                    </div>
                </div>
            </motion.div>

            {/* Receipt Customization */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-card p-6"
            >
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-success-400" />
                    Receipt Customization
                </h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Receipt Header Message
                        </label>
                        <input
                            type="text"
                            value={formData.receipt_header}
                            onChange={(e) => setFormData(prev => ({ ...prev, receipt_header: e.target.value }))}
                            placeholder="e.g., Welcome to Ali Electronics!"
                            className="w-full input-dark"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Receipt Footer Message
                        </label>
                        <input
                            type="text"
                            value={formData.receipt_footer}
                            onChange={(e) => setFormData(prev => ({ ...prev, receipt_footer: e.target.value }))}
                            className="w-full input-dark"
                        />
                    </div>
                </div>
            </motion.div>

            {/* Save Button */}
            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="btn-primary flex items-center gap-2 min-w-[160px]"
                >
                    {isSaving ? (
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
                </button>
            </div>
        </div>
    );
}
