import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Users, RefreshCw, Shield, UserCheck, Mail, Building2, Crown, Plus, X, AlertTriangle, Ban } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { getAllUsers, createUserGlobal } from '../../lib/api/superAdmin';
import { ROLE_LABELS, ROLE_STYLE } from '../../lib/constants/permissions';
import type { AdminUserProfile, OrgRole } from '../../lib/types/org';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import SearchInput from '../../components/ui/SearchInput';

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

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

  const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsCreating(true);
    const fd = new FormData(e.currentTarget);
    const name = fd.get('name') as string;
    const email = fd.get('email') as string;
    const password = fd.get('password') as string;
    
    try {
      await createUserGlobal({ name, email, password: password || undefined });
      toast.success('User created successfully');
      setIsAddModalOpen(false);
      load();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create user');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-orange-500/40 via-orange-400/25 to-teal-600/20 p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/15 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-500/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/4" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">User Management</h1>
            <p className="mt-2 text-muted-foreground">{users.length} user{users.length !== 1 ? 's' : ''} registered across all organizations</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={load} className="btn-secondary flex items-center gap-2 px-4 py-2.5 text-sm rounded-xl">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={() => setIsAddModalOpen(true)} className="btn-primary flex items-center gap-2 px-4 py-2.5 text-sm rounded-xl">
              <Plus className="w-4 h-4" /> Add User
            </button>
          </div>
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
                  {/* Avatar & Status */}
                  <div className="relative">
                    <img
                      src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || 'User')}&background=f97316&color=fff`}
                      alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                    />
                    {user.status && user.status !== 'active' && (
                      <div className="absolute -bottom-1 -right-1 bg-error text-error-foreground rounded-full p-0.5 border-2 border-background">
                        <Ban className="w-3 h-3" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                        {user.full_name || 'Unknown'}
                      </p>
                      {user.status && user.status !== 'active' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-error/10 text-error border border-error/20">
                          {user.status === 'banned_permanent' ? 'Banned' : 'Suspended'}
                        </span>
                      )}
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

      {/* Add User Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-card rounded-2xl shadow-xl border border-border overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border">
                <h3 className="text-lg font-semibold text-foreground">Add Global User</h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCreateUser} className="p-4 sm:p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    required
                    className="w-full px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Password (Optional)</label>
                  <input
                    type="text"
                    name="password"
                    className="w-full px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Auto-generated if empty"
                  />
                </div>
                
                <div className="pt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="btn-primary px-6 py-2 text-sm"
                  >
                    {isCreating ? 'Creating...' : 'Create User'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
