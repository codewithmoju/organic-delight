import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Check, Trash2, Clock, ArrowLeft, Mail, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../lib/store';
import { getPendingInvites, cancelInvite } from '../../lib/api/invites';
import { createTeamMember } from '../../lib/api/teamAccounts';
import type { Invite, OrgRole } from '../../lib/types/org';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import CustomSelect from '../../components/ui/CustomSelect';
import OrgGuard from '../../components/OrgGuard';
import { format } from 'date-fns';

const ROLE_OPTIONS = [
  { value: 'manager', label: 'Manager' },
  { value: 'cashier', label: 'Cashier' },
  { value: 'accountant', label: 'Accountant' },
  { value: 'viewer', label: 'Viewer' },
];

const PASSWORD_REQS = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'Contains uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Contains lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { label: 'Contains number', test: (p: string) => /\d/.test(p) },
];

export default function InvitePage() {
  const navigate = useNavigate();
  const activeOrganization = useAuthStore((s) => s.activeOrganization);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<OrgRole>('cashier');
  const [isSending, setIsSending] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState<Invite | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const load = useCallback(async () => {
    if (!activeOrganization) return;
    setIsLoading(true);
    try {
      const data = await getPendingInvites(activeOrganization.id);
      setInvites(data);
    } catch {
      // invites may not be available — non-blocking
    } finally {
      setIsLoading(false);
    }
  }, [activeOrganization]);

  useEffect(() => { load(); }, [load]);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrganization || !email.trim() || !name.trim() || !password) return;

    // Validate password
    if (!PASSWORD_REQS.every(r => r.test(password))) {
      toast.error('Password does not meet requirements');
      return;
    }

    setIsSending(true);
    try {
      const result = await createTeamMember(
        activeOrganization.id,
        email.trim(),
        name.trim(),
        password,
        role
      );
      toast.success(`Account created for ${result.email}. Share the credentials with them.`);
      setEmail('');
      setName('');
      setPassword('');
      load();
    } catch (err: any) {
      const code = err?.code || '';
      if (code.includes('already-exists')) {
        toast.error('An account with this email already exists');
      } else if (code.includes('permission-denied')) {
        toast.error("You don't have permission to create accounts");
      } else {
        toast.error(err?.message || 'Failed to create account');
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleCancel = async () => {
    if (!confirmCancel) return;
    setIsCancelling(true);
    try {
      await cancelInvite(confirmCancel.id);
      setInvites(prev => prev.filter(i => i.id !== confirmCancel.id));
      toast.success('Invite cancelled');
      setConfirmCancel(null);
    } catch {
      toast.error('Failed to cancel invite');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <OrgGuard>
    <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6 pb-16">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary/8 via-transparent to-transparent p-5 sm:p-7 border border-border/50"
      >
        <div className="relative z-10 flex items-center gap-4">
          <button
            onClick={() => navigate('/settings/team')}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1.5 tracking-tight">
              Add Team Member
            </h1>
            <p className="text-foreground-muted text-sm sm:text-base">
              Create an account for your team member with a role
            </p>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/8 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      </motion.div>

      {/* Create account form */}
      <motion.form
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onSubmit={handleCreateAccount}
        className="card-theme border border-border/50 rounded-2xl p-5 sm:p-6 space-y-4"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Create Account</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Set email, password, and role. Share credentials with your team member.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-foreground/80 mb-2">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
              className="w-full h-12 px-4 rounded-xl bg-secondary/50 border-transparent focus:border-primary/50 focus:ring-4 focus:ring-primary/10 text-foreground placeholder-muted-foreground transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground/80 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@example.com"
              required
              className="w-full h-12 px-4 rounded-xl bg-secondary/50 border-transparent focus:border-primary/50 focus:ring-4 focus:ring-primary/10 text-foreground placeholder-muted-foreground transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-foreground/80 mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Set a password"
                required
                className="w-full h-12 px-4 pr-12 rounded-xl bg-secondary/50 border-transparent focus:border-primary/50 focus:ring-4 focus:ring-primary/10 text-foreground placeholder-muted-foreground transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {/* Password requirements */}
            <div className="mt-2 space-y-1">
              {PASSWORD_REQS.map((req) => (
                <div key={req.label} className="flex items-center gap-2 text-xs">
                  {req.test(password) ? (
                    <Check className="w-3 h-3 text-success" />
                  ) : (
                    <div className="w-3 h-3 rounded-full border border-muted-foreground/30" />
                  )}
                  <span className={req.test(password) ? 'text-success' : 'text-muted-foreground'}>
                    {req.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground/80 mb-2">Role</label>
            <CustomSelect
              value={role}
              onChange={(val) => setRole(val as OrgRole)}
              options={ROLE_OPTIONS}
            />
            <p className="text-xs text-muted-foreground mt-2">
              {role === 'cashier' && 'Access to POS and basic inventory view'}
              {role === 'accountant' && 'Access to reports, expenses, and financial data'}
              {role === 'manager' && 'Full access except org settings'}
              {role === 'viewer' && 'Read-only access to dashboard and reports'}
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <motion.button
            type="submit"
            disabled={isSending || !email.trim() || !name.trim() || !password}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn-primary h-12 px-8 rounded-xl flex items-center justify-center gap-2 font-medium shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Create Account
              </>
            )}
          </motion.button>
        </div>
      </motion.form>

      {/* Pending invites (backward compat) */}
      {invites.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-3">
            Pending Invites ({invites.length})
          </h2>

          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <LoadingSpinner size="md" text="Loading invites..." />
            </div>
          ) : (
            <div className="space-y-2">
              {invites.map((invite, i) => (
                <motion.div
                  key={invite.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="card-theme border border-border/50 rounded-2xl p-4 flex items-center gap-4"
                >
                  <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{invite.email}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="capitalize">{invite.role}</span>
                      <span>&middot;</span>
                      <Clock className="w-3 h-3" />
                      <span>Expires {format(invite.expires_at, 'MMM d')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setConfirmCancel(invite)}
                      className="p-2 rounded-lg hover:bg-error/10 text-muted-foreground hover:text-error transition-colors"
                      title="Cancel invite"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      <ConfirmDialog
        isOpen={!!confirmCancel}
        title="Cancel Invite"
        message={`Cancel the invite for ${confirmCancel?.email}? They will no longer be able to join.`}
        confirmText="Cancel Invite"
        variant="warning"
        isLoading={isCancelling}
        onConfirm={handleCancel}
        onCancel={() => setConfirmCancel(null)}
      />
    </div>
    </OrgGuard>
  );
}
