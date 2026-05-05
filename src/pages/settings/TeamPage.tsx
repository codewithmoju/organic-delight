import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Users, UserPlus, Shield, Trash2, Crown, Eye, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '../../lib/store';
import { getMembers, updateMemberRole, removeMember } from '../../lib/api/organizations';
import { getPendingInvites } from '../../lib/api/invites';
import type { OrganizationMember, OrgRole, Invite } from '../../lib/types/org';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import CustomSelect from '../../components/ui/CustomSelect';
import OrgGuard from '../../components/OrgGuard';

const ROLE_OPTIONS = [
  { value: 'owner', label: 'Owner', icon: <Crown className="w-4 h-4 text-yellow-500" /> },
  { value: 'manager', label: 'Manager', icon: <Shield className="w-4 h-4 text-blue-500" /> },
  { value: 'cashier', label: 'Cashier', icon: <Users className="w-4 h-4 text-green-500" /> },
  { value: 'accountant', label: 'Accountant', icon: <Users className="w-4 h-4 text-purple-500" /> },
  { value: 'viewer', label: 'Viewer', icon: <Eye className="w-4 h-4 text-gray-500" /> },
];

const ROLE_COLORS: Record<OrgRole, string> = {
  owner: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
  manager: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  cashier: 'bg-green-500/10 text-green-600 dark:text-green-400',
  accountant: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  viewer: 'bg-gray-500/10 text-gray-600 dark:text-gray-400',
};

export default function TeamPage() {
  const activeOrganization = useAuthStore((s) => s.activeOrganization);
  const membership = useAuthStore((s) => s.membership);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [pendingInvites, setPendingInvites] = useState<Invite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmRemove, setConfirmRemove] = useState<OrganizationMember | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const isOwnerOrManager = membership?.role === 'owner' || membership?.role === 'manager';

  const load = useCallback(async () => {
    if (!activeOrganization) return;
    setIsLoading(true);
    try {
      const [membersResult, invitesResult] = await Promise.allSettled([
        getMembers(activeOrganization.id),
        getPendingInvites(activeOrganization.id),
      ]);
      if (membersResult.status === 'fulfilled') {
        setMembers(membersResult.value);
      } else {
        console.error('Failed to load members:', membersResult.reason);
        toast.error('Failed to load team members');
      }
      if (invitesResult.status === 'fulfilled') {
        setPendingInvites(invitesResult.value);
      } else {
        console.error('Failed to load invites:', invitesResult.reason);
        // Don't toast — invites failure is expected if rules not deployed yet
      }
    } catch (err) {
      console.error('Failed to load team data:', err);
      toast.error('Failed to load team data');
    } finally {
      setIsLoading(false);
    }
  }, [activeOrganization]);

  useEffect(() => { load(); }, [load]);

  const handleRoleChange = async (member: OrganizationMember, newRole: OrgRole) => {
    if (!activeOrganization) return;
    // Prevent self-demotion from owner
    if (member.user_id === membership?.user_id && membership?.role === 'owner' && newRole !== 'owner') {
      toast.error('Owners cannot demote themselves');
      return;
    }
    try {
      await updateMemberRole(activeOrganization.id, member.user_id, newRole);
      setMembers(prev => prev.map(m => m.user_id === member.user_id ? { ...m, role: newRole } : m));
      toast.success(`Role updated to ${newRole}`);
    } catch {
      toast.error('Failed to update role');
    }
  };

  const handleRemove = async () => {
    if (!confirmRemove || !activeOrganization) return;
    setIsRemoving(true);
    try {
      await removeMember(activeOrganization.id, confirmRemove.user_id);
      setMembers(prev => prev.filter(m => m.user_id !== confirmRemove.user_id));
      toast.success(`${confirmRemove.user_name || 'Member'} removed`);
      setConfirmRemove(null);
    } catch {
      toast.error('Failed to remove member');
    } finally {
      setIsRemoving(false);
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
        <div className="relative z-10 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1.5 tracking-tight">
              Team
            </h1>
            <p className="text-foreground-muted text-sm sm:text-base">
              {activeOrganization.name} &middot; {members.length} member{members.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={load} className="btn-secondary px-3 py-2 rounded-xl flex items-center gap-2 text-sm">
              <RefreshCw className="w-4 h-4" />
            </button>
            {isOwnerOrManager && (
              <a href="/settings/invite" className="btn-primary px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium shadow-lg shadow-primary/20">
                <UserPlus className="w-4 h-4" />
                Add Member
              </a>
            )}
          </div>
        </div>
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/8 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      </motion.div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <LoadingSpinner size="lg" text="Loading members..." />
        </div>
      ) : members.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No team members"
          description="Invite team members to collaborate on your organization."
          action={isOwnerOrManager ? { label: 'Invite Member', onClick: () => window.location.href = '/settings/invite' } : undefined}
        />
      ) : (
        <div className="space-y-3">
          {/* Pending invites */}
          {pendingInvites.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
                Pending Invites ({pendingInvites.length})
              </h2>
              {pendingInvites.map(invite => (
                <div key={invite.id} className="card-theme border border-border/50 rounded-2xl p-4 flex items-center gap-4 opacity-70">
                  <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{invite.email}</p>
                    <p className="text-xs text-muted-foreground">Invited as {invite.role}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${ROLE_COLORS[invite.role]}`}>
                    {invite.role}
                  </span>
                </div>
              ))}
            </motion.div>
          )}

          {/* Active members */}
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
            Members ({members.length})
          </h2>
          {members.map((member, i) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card-theme border border-border/50 rounded-2xl p-4 flex items-center gap-4"
            >
              <img
                className="h-10 w-10 rounded-full bg-secondary object-cover ring-2 ring-background"
                src={member.user_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.user_name || member.user_email || 'U')}&background=1e40af&color=fff`}
                alt={member.user_name || 'Member'}
                loading="lazy"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {member.user_name || member.user_email || 'Unknown'}
                  {member.user_id === membership?.user_id && (
                    <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground truncate">{member.user_email || member.user_id}</p>
              </div>

              {isOwnerOrManager && member.user_id !== membership?.user_id ? (
                <CustomSelect
                  value={member.role}
                  onChange={(val) => handleRoleChange(member, val as OrgRole)}
                  options={ROLE_OPTIONS}
                  className="w-40"
                  disabled={member.role === 'owner' && membership?.role !== 'owner'}
                />
              ) : (
                <span className={`px-3 py-1.5 rounded-lg text-xs font-medium ${ROLE_COLORS[member.role]}`}>
                  {member.role}
                </span>
              )}

              {isOwnerOrManager && member.user_id !== membership?.user_id && member.role !== 'owner' && (
                <button
                  onClick={() => setConfirmRemove(member)}
                  className="p-2 rounded-lg hover:bg-error/10 text-muted-foreground hover:text-error transition-colors"
                  title="Remove member"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!confirmRemove}
        title="Remove Team Member"
        message={`Are you sure you want to remove ${confirmRemove?.user_name || confirmRemove?.user_email || 'this member'} from the organization? They will lose access immediately.`}
        confirmText="Remove"
        variant="danger"
        isLoading={isRemoving}
        onConfirm={handleRemove}
        onCancel={() => setConfirmRemove(null)}
      />
    </div>
    </OrgGuard>
  );
}
