import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Building2, Globe, Phone, MapPin, Mail, Hash, FileText, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { POSSettings } from '../../lib/types';
import { getPOSSettings, updatePOSSettings } from '../../lib/api/pos';
import LoadingSpinner from '../ui/LoadingSpinner';

export default function BusinessSettings() {
    const [formData, setFormData] = useState<POSSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const settings = await getPOSSettings();
            setFormData(settings);
        } catch (error) {
            console.error('Error loading business settings:', error);
            toast.error('Failed to load business settings');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData) return;

        setIsSaving(true);
        try {
            await updatePOSSettings(formData);
            toast.success('Business settings updated successfully');
        } catch (error) {
            console.error('Error updating business settings:', error);
            toast.error('Failed to update settings');
        } finally {
            setIsSaving(false);
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-12">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (!formData) return null;

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            transition={{ staggerChildren: 0.1 }}
            className="space-y-6"
        >
            {/* Header */}
            <motion.div variants={itemVariants}>
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground-muted flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
                        <Building2 className="w-6 h-6" />
                    </div>
                    Business Profile & POS Configuration
                </h2>
                <p className="text-foreground-muted mt-2 ml-14">
                    Manage your store details. These settings will appear on your receipts and invoices.
                </p>
            </motion.div>

            {/* Basic Information */}
            <motion.div variants={itemVariants} className="p-6 rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-md transition-all duration-300">
                <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2 border-b border-border/50 pb-4">
                    <Globe className="w-5 h-5 text-blue-500" />
                    Basic Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground-muted">Business Name *</label>
                        <input
                            type="text"
                            value={formData.store_name}
                            onChange={(e) => setFormData(prev => prev ? ({ ...prev, store_name: e.target.value }) : null)}
                            placeholder="e.g., Ali Electronics"
                            className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-foreground placeholder-foreground-muted/50"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground-muted">Website</label>
                        <input
                            type="text"
                            value={formData.store_website || ''}
                            onChange={(e) => setFormData(prev => prev ? ({ ...prev, store_website: e.target.value }) : null)}
                            placeholder="www.yourstore.com"
                            className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-foreground placeholder-foreground-muted/50"
                        />
                    </div>
                </div>
            </motion.div>

            {/* Contact Information */}
            <motion.div variants={itemVariants} className="p-6 rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-md transition-all duration-300">
                <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2 border-b border-border/50 pb-4">
                    <Phone className="w-5 h-5 text-green-500" />
                    Contact Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2 space-y-2">
                        <label className="text-sm font-medium text-foreground-muted">
                            <MapPin className="w-4 h-4 inline mr-2 text-primary-500" />Street Address
                        </label>
                        <input
                            type="text"
                            value={formData.store_address}
                            onChange={(e) => setFormData(prev => prev ? ({ ...prev, store_address: e.target.value }) : null)}
                            placeholder="e.g., Shop #12, Main Market"
                            className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-foreground placeholder-foreground-muted/50"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground-muted">City</label>
                        <input
                            type="text"
                            value={formData.store_city || ''}
                            onChange={(e) => setFormData(prev => prev ? ({ ...prev, store_city: e.target.value }) : null)}
                            placeholder="e.g., Lahore"
                            className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-foreground placeholder-foreground-muted/50"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground-muted">Country</label>
                        <input
                            type="text"
                            value={formData.store_country || ''}
                            onChange={(e) => setFormData(prev => prev ? ({ ...prev, store_country: e.target.value }) : null)}
                            className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-foreground"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground-muted">
                            <Phone className="w-4 h-4 inline mr-2 text-primary-500" />Phone Number
                        </label>
                        <input
                            type="tel"
                            value={formData.store_phone}
                            onChange={(e) => setFormData(prev => prev ? ({ ...prev, store_phone: e.target.value }) : null)}
                            placeholder="+92 300 1234567"
                            className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-foreground placeholder-foreground-muted/50"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground-muted">
                            <Mail className="w-4 h-4 inline mr-2 text-primary-500" />Email Address
                        </label>
                        <input
                            type="email"
                            value={formData.store_email || ''}
                            onChange={(e) => setFormData(prev => prev ? ({ ...prev, store_email: e.target.value }) : null)}
                            placeholder="info@alielectronics.com"
                            className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-foreground placeholder-foreground-muted/50"
                        />
                    </div>

                    <div className="md:col-span-2 space-y-2">
                        <label className="text-sm font-medium text-foreground-muted">
                            <Hash className="w-4 h-4 inline mr-2 text-primary-500" />Tax / GST Number
                        </label>
                        <input
                            type="text"
                            value={formData.tax_number || ''}
                            onChange={(e) => setFormData(prev => prev ? ({ ...prev, tax_number: e.target.value }) : null)}
                            placeholder="e.g., GST-123456789"
                            className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-foreground placeholder-foreground-muted/50"
                        />
                    </div>
                </div>
            </motion.div>

            {/* Financial Settings */}
            <motion.div variants={itemVariants} className="p-6 rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-md transition-all duration-300">
                <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2 border-b border-border/50 pb-4">
                    <DollarSign className="w-5 h-5 text-emerald-500" />
                    Financial Settings
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground-muted">Default Tax Rate (%)</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={formData.tax_rate * 100}
                            onChange={(e) => setFormData(prev => prev ? ({ ...prev, tax_rate: (parseFloat(e.target.value) / 100) || 0 }) : null)}
                            className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-foreground placeholder-foreground-muted/50"
                        />
                        <p className="text-xs text-foreground-muted">Current rate: {(formData.tax_rate * 100).toFixed(2)}%</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground-muted">Currency</label>
                        <select
                            value={formData.currency}
                            onChange={(e) => setFormData(prev => prev ? ({ ...prev, currency: e.target.value }) : null)}
                            className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-foreground"
                        >
                            <option value="USD">USD - US Dollar</option>
                            <option value="EUR">EUR - Euro</option>
                            <option value="GBP">GBP - British Pound</option>
                            <option value="CAD">CAD - Canadian Dollar</option>
                            <option value="AUD">AUD - Australian Dollar</option>
                            <option value="PKR">PKR - Pakistani Rupee</option>
                        </select>
                    </div>
                </div>
            </motion.div>

            {/* Receipt Customization */}
            <motion.div variants={itemVariants} className="p-6 rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-md transition-all duration-300">
                <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2 border-b border-border/50 pb-4">
                    <FileText className="w-5 h-5 text-purple-500" />
                    Receipt Customization
                </h3>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground-muted">Receipt Header Message</label>
                        <input
                            type="text"
                            value={formData.receipt_header_message || ''}
                            onChange={(e) => setFormData(prev => prev ? ({ ...prev, receipt_header_message: e.target.value }) : null)}
                            placeholder="e.g., Welcome to Ali Electronics!"
                            className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-foreground placeholder-foreground-muted/50"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground-muted">Receipt Footer Message</label>
                        <input
                            type="text"
                            value={formData.receipt_footer_message}
                            onChange={(e) => setFormData(prev => prev ? ({ ...prev, receipt_footer_message: e.target.value }) : null)}
                            className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-foreground placeholder-foreground-muted/50"
                        />
                    </div>
                </div>
            </motion.div>

            {/* Save Button */}
            <motion.div variants={itemVariants} className="flex justify-end pt-4">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="btn-primary flex items-center gap-2 px-8 py-3 rounded-xl shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSaving ? (
                        <>
                            <LoadingSpinner size="sm" color="white" />
                            <span>Saving Changes...</span>
                        </>
                    ) : (
                        <>
                            <Save className="w-5 h-5" />
                            <span>Save Business Profile</span>
                        </>
                    )}
                </button>
            </motion.div>
        </motion.div>
    );
}
