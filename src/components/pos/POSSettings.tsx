import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Printer, Camera, Settings as SettingsIcon, ExternalLink, Monitor, ScrollText } from 'lucide-react';
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
            <div className="p-5 flex items-center justify-between hover:bg-muted/20 transition-colors">
              <div className="flex items-start gap-4">
                <div className={`mt-1 p-2 rounded-lg ${settings.barcode_scanner_enabled ? 'bg-success-500/10 text-success-400' : 'bg-muted text-foreground-muted'}`}>
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">Camera Barcode Scanner</h4>
                  <p className="text-sm text-foreground-muted mt-0.5">Allow using the device camera to scan product barcodes</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
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
            <div className="p-5 flex items-center justify-between hover:bg-muted/20 transition-colors">
              <div className="flex items-start gap-4">
                <div className={`mt-1 p-2 rounded-lg ${settings.auto_print_receipt ? 'bg-success-500/10 text-success-400' : 'bg-muted text-foreground-muted'}`}>
                  <ScrollText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">Auto-Print Receipts</h4>
                  <p className="text-sm text-foreground-muted mt-0.5">Automatically trigger print dialog after a successful sale</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
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
            <div className="p-5 flex items-center justify-between hover:bg-muted/20 transition-colors">
              <div className="flex items-start gap-4">
                <div className={`mt-1 p-2 rounded-lg ${settings.thermal_printer_enabled ? 'bg-success-500/10 text-success-400' : 'bg-muted text-foreground-muted'}`}>
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">Thermal Printer Mode</h4>
                  <p className="text-sm text-foreground-muted mt-0.5">Format receipts for 80mm/58mm thermal printers</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
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
          <div className="p-4 bg-muted/10 border-t border-border/50 flex justify-between items-center">
            <div className="text-xs text-foreground-muted">
              Changes are saved to this browser only.
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={!hasChanges || isSaving}
              className={`btn-primary flex items-center gap-2 px-6 py-2.5 ${!hasChanges ? 'opacity-50 cursor-not-allowed' : ''}`}
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
      </form>
    </div>
  );
}