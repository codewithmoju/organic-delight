import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Users, RefreshCw, Shield, UserCheck, Mail, Building2, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { getAllUsers } from '../../lib/api/superAdmin';
import { ROLE_LABELS, ROLE_STYLE } from '../../lib/constants/permissions';
import type { AdminUserProfile, OrgRole } from '../../lib/types/org';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import SearchInput from '../../components/ui/SearchInput';

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    if (!search) return users;
    const q = search.toLowerCase();
    return users.filter(u =>
      u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }, [users, search]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-orange-500/40 via-orange-400/25 to-teal-600/20 p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/15 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-500/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/4" />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">User Management</h1>
            <p className="mt-2 text-muted-foreground">{users.length} user{users.length !== 1 ? 's' : ''} registered across all organizations</p>
          </div>
          <button onClick={load} className="btn-secondary flex items-center gap-2 px-4 py-2.5 text-sm">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search */}
      <SearchInput value={search} onChange={setSearch} placeholder="Search by name or email..." />

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" text="Loading users..." />
        </div>
      )}

      {/* Empty */}
      {!isLoading && filtered.length === 0 && (
        <EmptyState
          icon={Users}
          title="No users found"
          description={search ? 'Try a different search term.' : 'No users registered yet.'}
        />
      )}

      {/* User Cards */}
      {!isLoading && filtered.length > 0 && (
        <div className="card-theme rounded-[2.5rem] overflow-hidden border border-border/50 shadow-sm">
          <div className="divide-y divide-border/30">
            {filtered.map((user, i) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
              >
                <Link
                  to={`/super-admin/users/${user.id}`}
                  className="flex items-center gap-4 p-4 sm:p-5 hover:bg-secondary/20 transition-colors group"
                >
                  {/* Avatar */}
                  <img
                    src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || 'User')}&background=f97316&color=fff`}
                    alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                        {user.full_name || 'Unknown'}
                      </p>
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
                    <div className="flex items-center gap-2 mt-1">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Mail className="w-3 h-3" /> {user.email}
                      </span>
                    </div>
                    {/* Org memberships */}
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      {user.memberships.length === 0 ? (
                        <span className="text-xs text-muted-foreground">No organizations</span>
                      ) : (
                        user.memberships.slice(0, 3).map(m => {
                          const style = ROLE_STYLE[m.role] ?? ROLE_STYLE.viewer;
                          return (
                            <span
                              key={m.organization_id}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${style.bgColor} ${style.color} ${style.borderColor}`}
                            >
                              <Building2 className="w-3 h-3" />
                              {m.organization_name}
                              <span className="opacity-60">·</span>
                              {ROLE_LABELS[m.role]}
                            </span>
                          );
                        })
                      )}
                      {user.memberships.length > 3 && (
                        <span className="text-xs text-muted-foreground font-medium">+{user.memberships.length - 3} more</span>
                      )}
                    </div>
                  </div>

                  {/* Date */}
                  <div className="text-right flex-shrink-0 hidden sm:block">
                    <p className="text-xs text-muted-foreground">Joined</p>
                    <p className="text-sm font-medium text-foreground">{format(user.created_at, 'MMM d, yyyy')}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
