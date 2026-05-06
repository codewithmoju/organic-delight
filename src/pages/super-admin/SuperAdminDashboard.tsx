import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Building2, Users, UserCheck, Crown, ArrowRight, Activity,
  TrendingUp, Shield, Zap, Globe, Package, Wallet, ArrowUpDown
} from 'lucide-react';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { getPlatformStats } from '../../lib/api/superAdmin';
import type { PlatformStats } from '../../lib/types/org';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getPlatformStats();
      setStats(data);
    } catch {
      toast.error('Failed to load platform stats');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" text="Loading platform data..." />
      </div>
    );
  }

  const statCards = [
    { label: 'Organizations', value: stats?.totalOrganizations ?? 0, icon: Building2, gradient: 'from-orange-500 to-orange-600', bg: 'bg-orange-500/20', text: 'text-orange-600 dark:text-orange-400', glow: 'bg-orange-500', border: 'border-orange-500/30' },
    { label: 'Total Users', value: stats?.totalUsers ?? 0, icon: Users, gradient: 'from-teal-500 to-teal-600', bg: 'bg-teal-500/20', text: 'text-teal-600 dark:text-teal-400', glow: 'bg-teal-500', border: 'border-teal-500/30' },
    { label: 'Team Members', value: stats?.totalTeamMembers ?? 0, icon: UserCheck, gradient: 'from-purple-500 to-purple-600', bg: 'bg-purple-500/20', text: 'text-purple-600 dark:text-purple-400', glow: 'bg-purple-500', border: 'border-purple-500/30' },
    { label: 'Active Members', value: stats?.totalActiveMembers ?? 0, icon: Crown, gradient: 'from-amber-500 to-amber-600', bg: 'bg-amber-500/20', text: 'text-amber-600 dark:text-amber-400', glow: 'bg-amber-500', border: 'border-amber-500/30' },
  ];

  const quickActions = [
    { to: '/super-admin/stores', label: 'Stores', desc: 'Manage organizations', icon: Building2, bg: 'bg-orange-500/20', border: 'border-orange-500/30', color: 'text-orange-600 dark:text-orange-400', hoverBg: 'hover:bg-orange-500/30' },
    { to: '/super-admin/users', label: 'Users', desc: 'User management', icon: Users, bg: 'bg-teal-500/20', border: 'border-teal-500/30', color: 'text-teal-600 dark:text-teal-400', hoverBg: 'hover:bg-teal-500/30' },
    { to: '/super-admin/roles', label: 'Roles', desc: 'Permission control', icon: Crown, bg: 'bg-purple-500/20', border: 'border-purple-500/30', color: 'text-purple-600 dark:text-purple-400', hoverBg: 'hover:bg-purple-500/30' },
    { to: '/super-admin/audit', label: 'Audit', desc: 'Activity logs', icon: Activity, bg: 'bg-violet-500/20', border: 'border-violet-500/30', color: 'text-violet-600 dark:text-violet-400', hoverBg: 'hover:bg-violet-500/30' },
    { to: '/super-admin/data/items', label: 'Inventory', desc: 'Browse items', icon: Package, bg: 'bg-emerald-500/20', border: 'border-emerald-500/30', color: 'text-emerald-600 dark:text-emerald-400', hoverBg: 'hover:bg-emerald-500/30' },
    { to: '/super-admin/data/transactions', label: 'Transactions', desc: 'Stock movements', icon: ArrowUpDown, bg: 'bg-blue-500/20', border: 'border-blue-500/30', color: 'text-blue-600 dark:text-blue-400', hoverBg: 'hover:bg-blue-500/30' },
    { to: '/super-admin/data/expenses', label: 'Expenses', desc: 'Spending records', icon: Wallet, bg: 'bg-rose-500/20', border: 'border-rose-500/30', color: 'text-rose-600 dark:text-rose-400', hoverBg: 'hover:bg-rose-500/30' },
    { to: '/super-admin/settings', label: 'Settings', desc: 'Platform config', icon: Shield, bg: 'bg-slate-500/20', border: 'border-slate-500/30', color: 'text-slate-600 dark:text-slate-400', hoverBg: 'hover:bg-slate-500/30' },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Hero Header — Brand Orange + Teal gradient */}
      <motion.div variants={item} className="relative overflow-hidden rounded-[2.5rem] p-6 sm:p-8 lg:p-10">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/60 via-orange-400/40 to-teal-600/35" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-400/40 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-teal-500/35 via-transparent to-transparent" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-400/25 rounded-full blur-[140px] -translate-y-1/3 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-teal-500/25 rounded-full blur-[120px] translate-y-1/3 -translate-x-1/4" />
        <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-orange-500/20 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-white/30 backdrop-blur-sm border border-white/40 flex items-center justify-center shadow-lg shadow-orange-500/40">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">Platform Dashboard</h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/30 text-white border border-white/40 backdrop-blur-sm">
                  <Zap className="w-3 h-3" /> Super Admin
                </span>
              </div>
              <p className="text-white/80 mt-1">Real-time overview of your entire platform ecosystem.</p>
            </div>
          </div>

          {/* Mini stats in header */}
          <div className="flex items-center gap-3 mt-4 flex-wrap">
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/25 backdrop-blur-sm border border-white/30">
              <Globe className="w-4 h-4 text-white/80" />
              <span className="text-sm font-bold text-white">{stats?.totalOrganizations ?? 0}</span>
              <span className="text-xs text-white/70">orgs</span>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/25 backdrop-blur-sm border border-white/30">
              <Users className="w-4 h-4 text-white/80" />
              <span className="text-sm font-bold text-white">{stats?.totalUsers ?? 0}</span>
              <span className="text-xs text-white/70">users</span>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/25 backdrop-blur-sm border border-white/30">
              <Activity className="w-4 h-4 text-white/80" />
              <span className="text-sm font-bold text-white">{stats?.totalActiveMembers ?? 0}</span>
              <span className="text-xs text-white/70">active</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + i * 0.05, type: 'spring', stiffness: 300 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className={`group relative overflow-hidden rounded-2xl bg-card border ${stat.border} p-5 shadow-sm hover:shadow-lg transition-all duration-300`}
          >
            <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${stat.gradient}`} />
            <div className="flex items-center justify-between mb-3">
              <div className={`w-11 h-11 rounded-xl ${stat.bg} flex items-center justify-center border ${stat.border}`}>
                <stat.icon className={`w-5 h-5 ${stat.text}`} />
              </div>
            </div>
            <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">{stat.label}</p>
            <p className="text-3xl font-extrabold text-foreground tabular-nums tracking-tight">{stat.value}</p>
            <div className={`absolute -right-6 -bottom-6 w-28 h-28 rounded-full opacity-10 blur-2xl pointer-events-none ${stat.glow}`} />
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={item}>
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4 text-orange-500" />
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((action, i) => (
            <motion.div
              key={action.to}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.04 }}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
            >
              <Link
                to={action.to}
                className={`block p-4 rounded-2xl ${action.bg} border ${action.border} ${action.hoverBg} transition-all duration-200 group`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <action.icon className={`w-5 h-5 ${action.color}`} />
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className="text-sm font-bold text-foreground">{action.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{action.desc}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Recent Organizations */}
      <motion.div variants={item}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-orange-500" />
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Recent Organizations</h2>
          </div>
          <Link to="/super-admin/stores" className="flex items-center gap-1 text-xs font-semibold text-orange-600 dark:text-orange-400 hover:text-orange-700 transition-colors">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {!stats?.recentOrganizations?.length ? (
          <div className="card-theme rounded-2xl p-8 text-center border border-border/50">
            <Building2 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No organizations found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.recentOrganizations.map((org, i) => (
              <motion.div
                key={org.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
              >
                <Link
                  to={`/super-admin/stores/${org.id}`}
                  className="block rounded-2xl bg-card border border-orange-500/20 overflow-hidden hover:shadow-lg hover:border-orange-500/40 transition-all duration-300 group"
                >
                  <div className="h-1.5 bg-gradient-to-r from-orange-400 via-orange-500 to-teal-500" />
                  <div className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-11 h-11 rounded-xl bg-orange-500/20 flex items-center justify-center border border-orange-500/30">
                        <Building2 className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-foreground truncate group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">{org.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Users className="w-3 h-3" /> {org.member_count} member{org.member_count !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    {org.owner_name && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                        <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center">
                          <Crown className="w-3 h-3 text-amber-500" />
                        </div>
                        {org.owner_name}
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground">{formatDistanceToNow(org.created_at, { addSuffix: true })}</span>
                      <span className="text-[11px] text-muted-foreground/60">{format(org.created_at, 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Platform Health */}
      <motion.div variants={item} className="card-theme rounded-2xl p-4 border border-teal-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse" />
            <span className="text-sm font-medium text-foreground">Platform Status: <span className="text-teal-600 dark:text-teal-400 font-bold">Operational</span></span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>{stats?.totalOrganizations ?? 0} orgs</span>
            <span>{stats?.totalUsers ?? 0} users</span>
            <span>{stats?.totalActiveMembers ?? 0} active</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
