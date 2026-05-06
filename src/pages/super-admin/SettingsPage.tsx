import { motion } from 'framer-motion';
import { Settings, Shield, Info, Key, Database, Server, Lock, Globe, Zap } from 'lucide-react';

const CAPABILITIES = [
  { icon: Building2, text: 'View and manage all organizations' },
  { icon: Key, text: 'Create stores and assign owners' },
  { icon: Database, text: 'Manage users across all organizations' },
  { icon: Globe, text: 'Browse inventory, transactions, and expenses' },
  { icon: Server, text: 'View platform-wide audit logs' },
  { icon: Lock, text: 'Bypass all permission checks' },
];

function Building2(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>;
}

export default function SettingsPage() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-orange-500/40 via-orange-400/25 to-teal-600/20 p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/15 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-500/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/4" />
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Platform Settings</h1>
        <p className="mt-2 text-muted-foreground">Super admin configuration and system information.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Super Admin Access Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-theme rounded-[2.5rem] p-6 border border-orange-500/20"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-lg">Super Admin Access</h3>
              <p className="text-xs text-muted-foreground">Firebase custom claims authentication</p>
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Super admin access is granted via Firebase custom claims. The claim is set on the user's auth token:
            </p>
            <div className="bg-secondary/60 rounded-xl p-4 border border-border/40">
              <code className="text-sm font-mono text-foreground">
                <span className="text-primary">superAdmin</span>
                <span className="text-muted-foreground">: </span>
                <span className="text-emerald-500">true</span>
              </code>
            </div>
            <p className="text-xs text-muted-foreground">
              The claim is read on login via <code className="px-1 py-0.5 rounded bg-secondary text-foreground text-[11px] font-mono">user.getIdTokenResult()</code> and stored in the auth state.
            </p>
          </div>
        </motion.div>

        {/* How to Grant Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="card-theme rounded-[2.5rem] p-6 border border-orange-500/20"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Key className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-lg">How to Grant Super Admin</h3>
              <p className="text-xs text-muted-foreground">3-step setup process</p>
            </div>
          </div>
          <div className="space-y-4">
            {[
              { step: '1', text: "Get the user's Firebase UID from the Firebase Console or the Users page." },
              { step: '2', text: 'Run the setup script with the UID:' },
              { step: '3', text: 'The user must sign out and sign back in for the claim to take effect.' },
            ].map(item => (
              <div key={item.step} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">{item.step}</span>
                </div>
                <p className="text-sm text-muted-foreground">{item.text}</p>
              </div>
            ))}
            <div className="bg-secondary/60 rounded-xl p-4 border border-border/40 overflow-x-auto">
              <code className="text-xs font-mono text-foreground whitespace-nowrap">
                node scripts/setSuperAdmin.js &lt;firebase-uid&gt;
              </code>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Capabilities */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card-theme rounded-[2.5rem] p-6 border border-orange-500/20"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-xl bg-teal-500/20 flex items-center justify-center">
            <Zap className="w-6 h-6 text-teal-500" />
          </div>
          <div>
            <h3 className="font-bold text-foreground text-lg">Super Admin Capabilities</h3>
            <p className="text-xs text-muted-foreground">What super admin can do across the platform</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {CAPABILITIES.map((cap, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 border border-border/30"
            >
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <cap.icon className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm text-foreground">{cap.text}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Technical Info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="card-theme rounded-[2.5rem] p-6 border border-orange-500/20"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
            <Info className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <h3 className="font-bold text-foreground text-lg">Technical Details</h3>
            <p className="text-xs text-muted-foreground">Implementation notes</p>
          </div>
        </div>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>Super admin bypasses all organization-level permission checks. The <code className="px-1 py-0.5 rounded bg-secondary text-foreground text-[11px] font-mono">can()</code> function returns <code className="px-1 py-0.5 rounded bg-secondary text-foreground text-[11px] font-mono">true</code> for all permissions.</p>
          <p>Firestore security rules check <code className="px-1 py-0.5 rounded bg-secondary text-foreground text-[11px] font-mono">request.auth.token.superAdmin</code> to allow cross-organization data access.</p>
          <p>Super admin does not require an organization membership. The org resolver is skipped for super admin users.</p>
          <p className="text-xs text-muted-foreground/70 pt-2">
            Note: Firebase custom claims require the Firebase Admin SDK. The script must be run with a service account that has appropriate permissions.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
