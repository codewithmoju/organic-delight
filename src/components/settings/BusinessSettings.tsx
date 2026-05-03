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
            setFormData({
                ...settings,
                store_country: settings.store_country || 'Pakistan',
                tax_rate: Number.isFinite(settings.tax_rate) ? settings.tax_rate : 0,
                currency: 'PKR'
            });
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
    const taxRatePercent = Number.isFinite(formData.tax_rate) ? formData.tax_rate * 100 : 0;

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            transition={{ staggerChildren: 0.1 }}
            className="space-y-6"
        >
            {/* Header */}
            <motion.div variants={itemVariants}>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500 flex-shrink-0">
                        <Building2 className="w-5 h-5" />
                    </div>
                    Business Profile & POS
                </h2>
                <p className="text-foreground-muted mt-1 text-sm ml-12">
                    Store details appear on receipts and invoices.
                </p>
            </motion.div>

            {/* Basic Information */}
            <motion.div variants={itemVariants} className="p-4 sm:p-6 rounded-2xl bg-card border border-border/50 shadow-sm">
                <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2 border-b border-border/50 pb-3 uppercase tracking-wider">
                    <Globe className="w-4 h-4 text-blue-500" />
                    Basic Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">Business Name *</label>
                        <input type="text" value={formData.store_name} onChange={(e) => setFormData(prev => prev ? ({ ...prev, store_name: e.target.value }) : null)} placeholder="e.g., Ali Electronics" className="w-full h-11 px-4 bg-background border border-border/60 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all text-foreground placeholder:text-foreground-muted/50 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">Website</label>
                        <input type="text" value={formData.store_website || ''} onChange={(e) => setFormData(prev => prev ? ({ ...prev, store_website: e.target.value }) : null)} placeholder="www.yourstore.com" className="w-full h-11 px-4 bg-background border border-border/60 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all text-foreground placeholder:text-foreground-muted/50 text-sm" />
                    </div>
                </div>
            </motion.div>

            {/* Contact Information */}
            <motion.div variants={itemVariants} className="p-4 sm:p-6 rounded-2xl bg-card border border-border/50 shadow-sm">
                <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2 border-b border-border/50 pb-3 uppercase tracking-wider">
                    <Phone className="w-4 h-4 text-success-500" />
                    Contact Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2 space-y-1.5">
                        <label className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">Street Address</label>
                        <input type="text" value={formData.store_address} onChange={(e) => setFormData(prev => prev ? ({ ...prev, store_address: e.target.value }) : null)} placeholder="e.g., Shop #12, Main Market" className="w-full h-11 px-4 bg-background border border-border/60 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all text-foreground placeholder:text-foreground-muted/50 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">City</label>
                        <input type="text" value={formData.store_city || ''} onChange={(e) => setFormData(prev => prev ? ({ ...prev, store_city: e.target.value }) : null)} placeholder="e.g., Lahore" className="w-full h-11 px-4 bg-background border border-border/60 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all text-foreground placeholder:text-foreground-muted/50 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">Country</label>
                        <input type="text" value={formData.store_country || 'Pakistan'} readOnly className="w-full h-11 px-4 bg-background border border-border/60 rounded-xl text-foreground text-sm opacity-70" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">Phone Number</label>
                        <input type="tel" value={formData.store_phone} onChange={(e) => setFormData(prev => prev ? ({ ...prev, store_phone: e.target.value }) : null)} placeholder="+92 300 1234567" className="w-full h-11 px-4 bg-background border border-border/60 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all text-foreground placeholder:text-foreground-muted/50 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">Email Address</label>
                        <input type="email" value={formData.store_email || ''} onChange={(e) => setFormData(prev => prev ? ({ ...prev, store_email: e.target.value }) : null)} placeholder="info@store.com" className="w-full h-11 px-4 bg-background border border-border/60 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all text-foreground placeholder:text-foreground-muted/50 text-sm" />
                    </div>
                    <div className="sm:col-span-2 space-y-1.5">
                        <label className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">Tax / GST Number</label>
                        <input type="text" value={formData.tax_number || ''} onChange={(e) => setFormData(prev => prev ? ({ ...prev, tax_number: e.target.value }) : null)} placeholder="e.g., GST-123456789" className="w-full h-11 px-4 bg-background border border-border/60 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all text-foreground placeholder:text-foreground-muted/50 text-sm" />
                    </div>
                </div>
            </motion.div>

            {/* Financial Settings */}
            <motion.div variants={itemVariants} className="p-4 sm:p-6 rounded-2xl bg-card border border-border/50 shadow-sm">
                <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2 border-b border-border/50 pb-3 uppercase tracking-wider">
                    <DollarSign className="w-4 h-4 text-success-500" />
                    Financial Settings
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">Default Tax Rate (%)</label>
                        <input type="number" step="0.01" min="0" max="100" value={taxRatePercent} onChange={(e) => setFormData(prev => prev ? ({ ...prev, tax_rate: (parseFloat(e.target.value) / 100) || 0 }) : null)} className="w-full h-11 px-4 bg-background border border-border/60 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all text-foreground text-sm" />
                        <p className="text-xs text-foreground-muted">Current: {taxRatePercent.toFixed(2)}%</p>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">Currency</label>
                        <select value="PKR" onChange={() => undefined} className="w-full h-11 px-4 bg-background border border-border/60 rounded-xl focus:ring-2 focus:ring-primary/20 transition-all text-foreground text-sm">
                            <option value="PKR">PKR - Pakistani Rupee</option>
                        </select>
                    </div>
                </div>
            </motion.div>

            {/* Receipt Customization */}
            <motion.div variants={itemVariants} className="p-4 sm:p-6 rounded-2xl bg-card border border-border/50 shadow-sm">
                <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2 border-b border-border/50 pb-3 uppercase tracking-wider">
                    <FileText className="w-4 h-4 text-purple-500" />
                    Receipt Customization
                </h3>
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">Header Message</label>
                        <input type="text" value={formData.receipt_header_message || ''} onChange={(e) => setFormData(prev => prev ? ({ ...prev, receipt_header_message: e.target.value }) : null)} placeholder="e.g., Welcome to Ali Electronics!" className="w-full h-11 px-4 bg-background border border-border/60 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all text-foreground placeholder:text-foreground-muted/50 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">Footer Message</label>
                        <input type="text" value={formData.receipt_footer_message} onChange={(e) => setFormData(prev => prev ? ({ ...prev, receipt_footer_message: e.target.value }) : null)} className="w-full h-11 px-4 bg-background border border-border/60 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all text-foreground text-sm" />
                    </div>
                </div>
            </motion.div>

            {/* Save Button */}
            <motion.div variants={itemVariants} className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="btn-primary flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
                >
                    {isSaving ? (
                        <><LoadingSpinner size="sm" color="white" /><span>Saving...</span></>
                    ) : (
                        <><Save className="w-4 h-4" /><span>Save Business Profile</span></>
                    )}
                </button>
            </motion.div>
        </motion.div>
    );
}
