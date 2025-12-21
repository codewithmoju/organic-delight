import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Store, Phone, MapPin, Percent, DollarSign, Printer, Camera, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { getPOSSettings, updatePOSSettings } from '../../lib/api/pos';
import { POSSettings as POSSettingsType } from '../../lib/types';
import LoadingSpinner from '../ui/LoadingSpinner';
import AnimatedCard from '../ui/AnimatedCard';

export default function POSSettings() {
  const [settings, setSettings] = useState<POSSettingsType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const posSettings = await getPOSSettings();
      setSettings(posSettings);
    } catch (error) {
      console.error('Error loading POS settings:', error);
      toast.error('Failed to load POS settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!settings) return;

    setIsSaving(true);
    try {
      await updatePOSSettings(settings);
      setHasChanges(false);
      toast.success('POS settings saved successfully');
    } catch (error) {
      console.error('Error saving POS settings:', error);
      toast.error('Failed to save POS settings');
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = <K extends keyof POSSettingsType>(
    key: K,
    value: POSSettingsType[K]
  ) => {
    if (!settings) return;

    setSettings(prev => prev ? { ...prev, [key]: value } : null);
    setHasChanges(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Loading POS settings..." />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-12">
        <Store className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-400 mb-2">Settings Not Available</h3>
        <p className="text-gray-500">Unable to load POS settings</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gradient">POS Settings</h1>
        <p className="text-gray-400 mt-1">
          Configure your Point of Sale system preferences
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Store Information */}
        <AnimatedCard delay={0.1}>
          <div className="p-6">
            <div className="flex items-center mb-6">
              <div className="p-3 rounded-lg bg-primary-500/20 text-primary-400 mr-4">
                <Store className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-white">Store Information</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-base font-medium text-gray-300 mb-3">
                  <Store className="w-4 h-4 inline mr-2" />
                  Store Name
                </label>
                <input
                  type="text"
                  value={settings.store_name}
                  onChange={(e) => updateSetting('store_name', e.target.value)}
                  className="w-full input-dark input-large"
                  placeholder="Enter store name"
                  required
                />
              </div>

              <div>
                <label className="block text-base font-medium text-gray-300 mb-3">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Store Phone
                </label>
                <input
                  type="tel"
                  value={settings.store_phone}
                  onChange={(e) => updateSetting('store_phone', e.target.value)}
                  className="w-full input-dark input-large"
                  placeholder="Enter store phone number (e.g., +92 300 1234567)"
                  required
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-base font-medium text-gray-300 mb-3">
                <MapPin className="w-4 h-4 inline mr-2" />
                Store Address
              </label>
              <textarea
                value={settings.store_address}
                onChange={(e) => updateSetting('store_address', e.target.value)}
                rows={3}
                className="w-full input-dark input-large resize-none"
                placeholder="Enter complete store address"
                required
              />
            </div>
          </div>
        </AnimatedCard>

        {/* Financial Settings */}
        <AnimatedCard delay={0.2}>
          <div className="p-6">
            <div className="flex items-center mb-6">
              <div className="p-3 rounded-lg bg-success-500/20 text-success-400 mr-4">
                <DollarSign className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-white">Financial Settings</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-base font-medium text-gray-300 mb-3">
                  <Percent className="w-4 h-4 inline mr-2" />
                  Tax Rate (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={settings.tax_rate * 100}
                  onChange={(e) => updateSetting('tax_rate', parseFloat(e.target.value) / 100 || 0)}
                  className="w-full input-dark input-large"
                  placeholder="Enter tax rate"
                  required
                />
                <p className="text-gray-500 text-sm mt-2">
                  Current rate: {(settings.tax_rate * 100).toFixed(2)}%
                </p>
              </div>

              <div>
                <label className="block text-base font-medium text-gray-300 mb-3">
                  <DollarSign className="w-4 h-4 inline mr-2" />
                  Currency
                </label>
                <select
                  value={settings.currency}
                  onChange={(e) => updateSetting('currency', e.target.value)}
                  className="w-full input-dark input-large"
                  required
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="CAD">CAD - Canadian Dollar</option>
                  <option value="AUD">AUD - Australian Dollar</option>
                </select>
              </div>
            </div>
          </div>
        </AnimatedCard>

        {/* Hardware Settings */}
        <AnimatedCard delay={0.3}>
          <div className="p-6">
            <div className="flex items-center mb-6">
              <div className="p-3 rounded-lg bg-accent-500/20 text-accent-400 mr-4">
                <Printer className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-white">Hardware Settings</h3>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-xl bg-dark-700/30 border border-dark-600/50">
                <div className="flex items-center space-x-4">
                  <Camera className="w-5 h-5 text-primary-400" />
                  <div>
                    <h4 className="text-white font-medium">Barcode Scanner</h4>
                    <p className="text-gray-400 text-sm">Enable camera-based barcode scanning</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.barcode_scanner_enabled}
                    onChange={(e) => updateSetting('barcode_scanner_enabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-dark-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600" />
                </label>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-dark-700/30 border border-dark-600/50">
                <div className="flex items-center space-x-4">
                  <Printer className="w-5 h-5 text-primary-400" />
                  <div>
                    <h4 className="text-white font-medium">Auto-Print Receipts</h4>
                    <p className="text-gray-400 text-sm">Automatically print receipts after payment</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.auto_print_receipt}
                    onChange={(e) => updateSetting('auto_print_receipt', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-dark-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600" />
                </label>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-dark-700/30 border border-dark-600/50">
                <div className="flex items-center space-x-4">
                  <Printer className="w-5 h-5 text-primary-400" />
                  <div>
                    <h4 className="text-white font-medium">Thermal Printer</h4>
                    <p className="text-gray-400 text-sm">Enable thermal receipt printer support</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.thermal_printer_enabled}
                    onChange={(e) => updateSetting('thermal_printer_enabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-dark-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600" />
                </label>
              </div>
            </div>
          </div>
        </AnimatedCard>

        {/* Receipt Customization */}
        <AnimatedCard delay={0.4}>
          <div className="p-6">
            <div className="flex items-center mb-6">
              <div className="p-3 rounded-lg bg-warning-500/20 text-warning-400 mr-4">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-white">Receipt Customization</h3>
            </div>

            <div>
              <label className="block text-base font-medium text-gray-300 mb-3">
                Receipt Footer Message
              </label>
              <textarea
                value={settings.receipt_footer_message}
                onChange={(e) => updateSetting('receipt_footer_message', e.target.value)}
                rows={3}
                className="w-full input-dark input-large resize-none"
                placeholder="Enter message to appear at bottom of receipts"
              />
              <p className="text-gray-500 text-sm mt-2">
                This message will appear at the bottom of all printed receipts
              </p>
            </div>
          </div>
        </AnimatedCard>

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex justify-end"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={!hasChanges || isSaving}
            className={`btn-primary flex items-center gap-2 px-8 py-3 ${!hasChanges ? 'opacity-50 cursor-not-allowed' : ''
              }`}
          >
            {isSaving ? (
              <>
                <LoadingSpinner size="sm" color="white" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Settings
              </>
            )}
          </motion.button>
        </motion.div>
      </form>
    </div>
  );
}