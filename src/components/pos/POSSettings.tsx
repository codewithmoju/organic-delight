import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Printer, Camera, Settings as SettingsIcon, ExternalLink, Monitor, ScrollText, Percent, FileText, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import { getPOSSettings, updatePOSSettings } from '../../lib/api/pos';
import { POSSettings as POSSettingsType } from '../../lib/types';
import LoadingSpinner from '../ui/LoadingSpinner';
import AnimatedCard from '../ui/AnimatedCard';
import { useNavigate } from 'react-router-dom';

export default function POSSettings() {
  const [settings, setSettings] = useState<POSSettingsType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const navigate = useNavigate();

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
      toast.success('Terminal settings saved successfully');
    } catch (error) {
      console.error('Error saving terminal settings:', error);
      toast.error('Failed to save settings');
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
        <LoadingSpinner size="lg" text="Loading settings..." />
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Top Actions */}
      <div className="flex justify-end">
        <button
          onClick={() => navigate('/settings')}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-foreground-muted hover:text-primary-400 hover:bg-muted/30 transition-all"
        >
          <SettingsIcon className="w-4 h-4" />
          <span>Go to Business Settings</span>
          <ExternalLink className="w-3 h-3 opacity-50" />
        </button>
      </div>

      <form onSubmit={handleSave}>
        <AnimatedCard delay={0.1} className="overflow-hidden border border-border/50 bg-card/50 backdrop-blur-sm">
          {/* Section Header */}
          <div className="p-6 border-b border-border/50 bg-muted/10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary-500/10 text-primary-400">
                <Monitor className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Terminal Preferences</h3>
                <p className="text-sm text-foreground-muted">Configure hardware for this specific device</p>
              </div>
            </div>
          </div>

          {/* Settings List */}
          <div className="divide-y divide-border/30">

            {/* Barcode Scanner */}
            <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/20 transition-colors">
              <div className="flex items-start gap-4">
                <div className={`mt-1 p-2 rounded-lg flex-shrink-0 ${settings.barcode_scanner_enabled ? 'bg-success-500/10 text-success-400' : 'bg-muted text-foreground-muted'}`}>
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">Camera Barcode Scanner</h4>
                  <p className="text-sm text-foreground-muted mt-0.5">Allow using the device camera to scan product barcodes</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer self-start sm:self-auto ml-14 sm:ml-0">
                <input
                  type="checkbox"
                  checked={settings.barcode_scanner_enabled}
                  onChange={(e) => updateSetting('barcode_scanner_enabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-muted/50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:shadow-sm after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            {/* Auto-Print */}
            <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/20 transition-colors">
              <div className="flex items-start gap-4">
                <div className={`mt-1 p-2 rounded-lg flex-shrink-0 ${settings.auto_print_receipt ? 'bg-success-500/10 text-success-400' : 'bg-muted text-foreground-muted'}`}>
                  <ScrollText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">Auto-Print Receipts</h4>
                  <p className="text-sm text-foreground-muted mt-0.5">Automatically trigger print dialog after a successful sale</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer self-start sm:self-auto ml-14 sm:ml-0">
                <input
                  type="checkbox"
                  checked={settings.auto_print_receipt}
                  onChange={(e) => updateSetting('auto_print_receipt', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-muted/50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:shadow-sm after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            {/* Thermal Printer */}
            <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/20 transition-colors">
              <div className="flex items-start gap-4">
                <div className={`mt-1 p-2 rounded-lg flex-shrink-0 ${settings.thermal_printer_enabled ? 'bg-success-500/10 text-success-400' : 'bg-muted text-foreground-muted'}`}>
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">Thermal Printer Mode</h4>
                  <p className="text-sm text-foreground-muted mt-0.5">Format receipts for 80mm/58mm thermal printers</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer self-start sm:self-auto ml-14 sm:ml-0">
                <input
                  type="checkbox"
                  checked={settings.thermal_printer_enabled}
                  onChange={(e) => updateSetting('thermal_printer_enabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-muted/50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:shadow-sm after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

          </div>

          {/* Card Footer */}
          <div className="p-4 bg-muted/10 border-t border-border/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="text-xs text-foreground-muted">
              Changes are saved to this browser only.
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={!hasChanges || isSaving}
              className={`btn-primary flex items-center justify-center gap-2 px-6 py-2.5 w-full sm:w-auto ${!hasChanges ? 'opacity-50 cursor-not-allowed' : ''}`}
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
            </motion.button>
          </div>
        </AnimatedCard>

        {/* ── Tax & Pricing ── */}
        <AnimatedCard delay={0.2} className="overflow-hidden border border-border/50 bg-card/50 backdrop-blur-sm">
          <div className="p-6 border-b border-border/50 bg-muted/10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-warning-500/10 text-warning-500">
                <Percent className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Tax & Pricing</h3>
                <p className="text-sm text-foreground-muted">Configure tax rates applied at checkout</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                Tax Rate (%)
              </label>
              <div className="relative w-48">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={(settings.tax_rate * 100).toFixed(1)}
                  onChange={e => updateSetting('tax_rate', parseFloat(e.target.value) / 100 || 0)}
                  className="w-full h-11 pl-4 pr-10 bg-background border border-border/60 rounded-xl text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                  placeholder="0.0"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground pointer-events-none">%</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                Currently: {(settings.tax_rate * 100).toFixed(1)}% — applied to every sale at checkout
              </p>
            </div>
            {settings.tax_number !== undefined && (
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Tax / GST Number</label>
                <input
                  type="text"
                  value={settings.tax_number || ''}
                  onChange={e => updateSetting('tax_number', e.target.value)}
                  className="w-full h-11 px-4 bg-background border border-border/60 rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all placeholder:text-muted-foreground/50"
                  placeholder="e.g. GST-1234567"
                />
              </div>
            )}
          </div>
        </AnimatedCard>

        {/* ── Receipt Customization ── */}
        <AnimatedCard delay={0.3} className="overflow-hidden border border-border/50 bg-card/50 backdrop-blur-sm">
          <div className="p-6 border-b border-border/50 bg-muted/10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                <Receipt className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Receipt Customization</h3>
                <p className="text-sm text-foreground-muted">Customize what appears on printed receipts</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Store Name</label>
              <input
                type="text"
                value={settings.store_name || ''}
                onChange={e => updateSetting('store_name', e.target.value)}
                className="w-full h-11 px-4 bg-background border border-border/60 rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all placeholder:text-muted-foreground/50"
                placeholder="Your store name"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Store Phone</label>
              <input
                type="text"
                value={settings.store_phone || ''}
                onChange={e => updateSetting('store_phone', e.target.value)}
                className="w-full h-11 px-4 bg-background border border-border/60 rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all placeholder:text-muted-foreground/50"
                placeholder="+92 300 0000000"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Store Address</label>
              <input
                type="text"
                value={settings.store_address || ''}
                onChange={e => updateSetting('store_address', e.target.value)}
                className="w-full h-11 px-4 bg-background border border-border/60 rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all placeholder:text-muted-foreground/50"
                placeholder="123 Main Street, City"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Receipt Header Message</label>
              <textarea
                rows={2}
                value={settings.receipt_header_message || ''}
                onChange={e => updateSetting('receipt_header_message', e.target.value)}
                className="w-full px-4 py-2.5 bg-background border border-border/60 rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all resize-none placeholder:text-muted-foreground/50"
                placeholder="Welcome message shown at the top of receipts"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Receipt Footer Message</label>
              <textarea
                rows={2}
                value={settings.receipt_footer_message || ''}
                onChange={e => updateSetting('receipt_footer_message', e.target.value)}
                className="w-full px-4 py-2.5 bg-background border border-border/60 rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all resize-none placeholder:text-muted-foreground/50"
                placeholder="e.g. Thank you for your business!"
              />
            </div>
          </div>
          <div className="p-4 bg-muted/10 border-t border-border/50 flex justify-end">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={!hasChanges || isSaving}
              className={`btn-primary flex items-center justify-center gap-2 px-6 py-2.5 ${!hasChanges ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isSaving ? <><LoadingSpinner size="sm" color="white" />Saving...</> : <><Save className="w-4 h-4" />Save All Changes</>}
            </motion.button>
          </div>
        </AnimatedCard>
      </form>
    </div>
  );
}