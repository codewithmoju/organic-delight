import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Save, Mail, Smartphone, AlertTriangle, ShoppingBag, DollarSign, Package } from 'lucide-react';
import { toast } from 'sonner';
import { readScopedJSON, writeScopedJSON } from '../../lib/utils/storageScope';

export interface NotificationPrefs {
  // In-app
  inapp_low_stock: boolean;
  inapp_expiry: boolean;
  inapp_payment_due: boolean;
  inapp_sale_complete: boolean;
  // Email (future)
  email_low_stock: boolean;
  email_daily_report: boolean;
  email_payment_reminders: boolean;
  // SMS (future)
  sms_low_stock: boolean;
  sms_payment_reminders: boolean;
}

const DEFAULT_PREFS: NotificationPrefs = {
  inapp_low_stock: true,
  inapp_expiry: true,
  inapp_payment_due: true,
  inapp_sale_complete: false,
  email_low_stock: false,
  email_daily_report: false,
  email_payment_reminders: false,
  sms_low_stock: false,
  sms_payment_reminders: false,
};

const PREFS_KEY = 'notification_preferences';

export function getNotificationPrefs(): NotificationPrefs {
  try {
    const parsed = readScopedJSON<Partial<NotificationPrefs>>(PREFS_KEY, {}, undefined, PREFS_KEY);
    return { ...DEFAULT_PREFS, ...parsed };
  } catch {
    return DEFAULT_PREFS;
  }
}

function Toggle({ checked, onChange, disabled = false }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label className={`relative inline-flex items-center ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
      <input type="checkbox" checked={checked} onChange={e => !disabled && onChange(e.target.checked)} className="sr-only peer" disabled={disabled} />
      <div className="w-10 h-5 bg-secondary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:shadow-sm after:transition-all peer-checked:bg-primary" />
    </label>
  );
}

function PrefRow({ icon: Icon, label, sub, checked, onChange, disabled, badge }: {
  icon: any; label: string; sub?: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; badge?: string;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border/30 last:border-0">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-secondary/50 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Icon className="w-4 h-4 text-muted-foreground" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-foreground">{label}</p>
            {badge && <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-secondary text-muted-foreground font-semibold uppercase">{badge}</span>}
          </div>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
      </div>
      <Toggle checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  );
}

export default function NotificationPreferences() {
  const [prefs, setPrefs] = useState<NotificationPrefs>(getNotificationPrefs);
  const [hasChanges, setHasChanges] = useState(false);

  const update = (key: keyof NotificationPrefs) => (val: boolean) => {
    setPrefs(p => ({ ...p, [key]: val }));
    setHasChanges(true);
  };

  const save = () => {
    writeScopedJSON(PREFS_KEY, prefs);
    setHasChanges(false);
    toast.success('Notification preferences saved');
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          Notification Preferences
        </h2>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={save}
          disabled={!hasChanges}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 transition-all"
        >
          <Save className="w-4 h-4" /> Save
        </motion.button>
      </div>

      {/* In-app */}
      <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <Bell className="w-3.5 h-3.5" /> In-App Notifications
        </h3>
        <PrefRow icon={AlertTriangle} label="Low Stock Alerts" sub="Notify when items fall below threshold" checked={prefs.inapp_low_stock} onChange={update('inapp_low_stock')} />
        <PrefRow icon={Package} label="Expiry Alerts" sub="Notify when items are expiring within 30 days" checked={prefs.inapp_expiry} onChange={update('inapp_expiry')} />
        <PrefRow icon={DollarSign} label="Vendor Payment Due" sub="Remind about upcoming vendor payments" checked={prefs.inapp_payment_due} onChange={update('inapp_payment_due')} />
        <PrefRow icon={ShoppingBag} label="Sale Completed" sub="Notify after each successful POS transaction" checked={prefs.inapp_sale_complete} onChange={update('inapp_sale_complete')} />
      </div>

      {/* Email */}
      <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <Mail className="w-3.5 h-3.5" /> Email Notifications
          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-secondary text-muted-foreground font-semibold">Coming Soon</span>
        </h3>
        <PrefRow icon={AlertTriangle} label="Low Stock Email" sub="Daily digest of low stock items" checked={prefs.email_low_stock} onChange={update('email_low_stock')} disabled />
        <PrefRow icon={Package} label="Daily Report Email" sub="End-of-day operations summary" checked={prefs.email_daily_report} onChange={update('email_daily_report')} disabled />
        <PrefRow icon={DollarSign} label="Payment Reminders" sub="Email reminders for overdue vendor payments" checked={prefs.email_payment_reminders} onChange={update('email_payment_reminders')} disabled />
      </div>

      {/* SMS */}
      <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <Smartphone className="w-3.5 h-3.5" /> SMS Notifications
          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-secondary text-muted-foreground font-semibold">Coming Soon</span>
        </h3>
        <PrefRow icon={AlertTriangle} label="Low Stock SMS" sub="Instant SMS for critical stock levels" checked={prefs.sms_low_stock} onChange={update('sms_low_stock')} disabled />
        <PrefRow icon={DollarSign} label="Payment Reminder SMS" sub="SMS reminders for overdue payments" checked={prefs.sms_payment_reminders} onChange={update('sms_payment_reminders')} disabled />
      </div>
    </div>
  );
}
