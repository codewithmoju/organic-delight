import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, Calendar, Shield, UserCheck, Trash2, Crown, Building2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { getUserDetail, removeUserFromOrg, setUserRole } from '../../lib/api/superAdmin';
import { ROLE_LABELS, ROLE_STYLE, ROLE_DESCRIPTIONS } from '../../lib/constants/permissions';
import type { AdminUserProfile, OrgRole } from '../../lib/types/org';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import CustomSelect from '../../components/ui/CustomSelect';

const ROLE_OPTIONS = [
  { value: 'owner', label: 'Owner' },
  { value: 'manager', label: 'Manager' },
  { value: 'cashier', label: 'Cashier' },
  { value: 'accountant', label: 'Accountant' },
  { value: 'viewer', label: 'Viewer' },
];

const ROLE_ICONS: Record<OrgRole, typeof Crown> = {
  owner: Crown,
  manager: Shield,
  cashier: Users,
  accountant: Users,
  viewer: UserCheck,
};

export default function UserDetailPage() {
  const { id: userId } = useParams<{ id: string }>();
  const [user, setUser] = useState<AdminUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmRemove, setConfirmRemove] = useState<{ orgId: string; orgName: string } | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const data = await getUserDetail(userId);
      setUser(data);
    } catch {
      toast.error('Failed to load user');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const handleRoleChange = async (orgId: string, newRole: OrgRole) => {
    if (!userId) return;
    try {
      await setUserRole(orgId, userId, newRole);
      setUser(prev => prev ? {
        ...prev,
        memberships: prev.memberships.map(m =>
          m.organization_id === orgId ? { ...m, role: newRole } : m
        ),
      } : null);
      toast.success('Role updated');
    } catch {
      toast.error('Failed to update role');
    }
  };

  const handleRemove = async () => {
    if (!confirmRemove || !userId) return;
    setIsRemoving(true);
    try {
      await removeUserFromOrg(confirmRemove.orgId, userId);
      setUser(prev => prev ? {
        ...prev,
        memberships: prev.memberships.filter(m => m.organization_id !== confirmRemove.orgId),
      } : null);
      setConfirmRemove(null);
      toast.success('Removed from organization');
    } catch {
      toast.error('Failed to remove from organization');
    } finally {
      setIsRemoving(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><LoadingSpinner size="lg" text="Loading user..." /></div>;
  }

  if (!user) {
    return <div className="text-center py-12 text-muted-foreground">User not found.</div>;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Link to="/super-admin/users" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to users
      </Link>

      {/* Profile Card */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-orange-500/40 via-orange-400/25 to-teal-600/20 p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/15 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-500/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/4" />
        <div className="relative z-10 flex items-center gap-4">
          <img
            src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || 'User')}&background=f97316&color=fff`}
            alt="" className="w-16 h-16 rounded-xl ring-4 ring-background object-cover"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground">{user.full_name || 'Unknown'}</h1>
              {user.created_by_admin ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30">
                  <Shield className="w-2.5 h-2.5" /> Admin
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-secondary text-muted-foreground border border-border/50">
                  <UserCheck className="w-2.5 h-2.5" /> Self
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 mt-1.5 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {user.email}</span>
              <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Joined {format(user.created_at, 'MMM d, yyyy')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'User ID', value: user.id.substring(0, 16) + '...', mono: true },
          { label: 'Account Type', value: user.created_by_admin ? 'Admin-created' : 'Self-registered', icon: user.created_by_admin ? Shield : UserCheck },
          { label: 'Organizations', value: `${user.memberships.length} membership${user.memberships.length !== 1 ? 's' : ''}`, icon: Building2 },
        ].map((info, i) => (
          <motion.div
            key={info.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="card-theme rounded-2xl p-4 border border-orange-500/20"
          >
            <p className="text-xs font-medium text-muted-foreground mb-1">{info.label}</p>
            <p className={`text-sm font-semibold text-foreground flex items-center gap-1.5 ${info.mono ? 'font-mono' : ''}`}>
              {info.icon && <info.icon className="w-4 h-4 text-primary" />}
              {info.value}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Memberships */}
      <div className="card-theme rounded-[2.5rem] overflow-hidden border border-orange-500/20">
        <div className="h-1.5 bg-gradient-to-r from-orange-400 via-orange-500 to-teal-500" />
        <div className="px-6 py-4 border-b border-border/50">
          <h2 className="text-lg font-bold text-foreground">Organization Memberships</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Manage roles and access across organizations</p>
        </div>
        {user.memberships.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground text-sm">Not a member of any organization.</div>
        ) : (
          <div className="divide-y divide-border/30">
            {user.memberships.map(m => {
              const style = ROLE_STYLE[m.role] ?? ROLE_STYLE.viewer;
              const RoleIcon = ROLE_ICONS[m.role] ?? Users;
              return (
                <div key={m.organization_id} className="flex items-center gap-4 p-4 sm:p-5 hover:bg-secondary/20 transition-colors">
                  {/* Org Icon */}
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <Link to={`/super-admin/stores/${m.organization_id}`} className="font-semibold text-foreground hover:text-primary transition-colors">
                      {m.organization_name}
                    </Link>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${style.bgColor} ${style.color} ${style.borderColor}`}>
                        <RoleIcon className="w-3 h-3" /> {ROLE_LABELS[m.role]}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium ${
                        m.status === 'active' ? 'bg-success-500/10 text-success-600 dark:text-success-400 border border-success-500/20' : 'bg-secondary text-muted-foreground border border-border/50'
                      }`}>
                        {m.status}
                      </span>
                    </div>
                  </div>

                  {/* Role Selector */}
                  <div className="w-40 hidden sm:block">
                    <CustomSelect
                      options={ROLE_OPTIONS}
                      value={m.role}
                      onChange={(val) => handleRoleChange(m.organization_id, val as OrgRole)}
                      placeholder="Role"
                    />
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => setConfirmRemove({ orgId: m.organization_id, orgName: m.organization_name })}
                    className="p-2 rounded-lg hover:bg-error/10 transition-colors flex-shrink-0"
                    title="Remove from organization"
                  >
                    <Trash2 className="w-4 h-4 text-error" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!confirmRemove}
        onClose={() => setConfirmRemove(null)}
        onConfirm={handleRemove}
        title="Remove from Organization"
        message={`Remove ${user.full_name} from ${confirmRemove?.orgName}?`}
        confirmText="Remove"
        variant="danger"
        isLoading={isRemoving}
      />
    </motion.div>
  );
}
