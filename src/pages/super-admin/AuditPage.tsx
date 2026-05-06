import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Shield, Search, RefreshCw, Download, Filter, X,
  Plus, Pencil, Trash2, LogIn, LogOut,
  Receipt, ShoppingBag, CreditCard, SlidersHorizontal, RotateCcw,
  Package, Users, Building2, DollarSign, FileText, User, Settings,
  Activity, Clock, ChevronDown, Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { getAuditLogsGlobal, getAllOrganizations, getAllUsers } from '../../lib/api/superAdmin';
import { exportToCSV } from '../../lib/utils/csvExport';
import type { AuditEntry } from '../../lib/api/auditLog';
import type { OrgSummary, AdminUserProfile } from '../../lib/types/org';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import SearchInput from '../../components/ui/SearchInput';
import CustomSelect from '../../components/ui/CustomSelect';

const ACTION_CONFIG: Record<string, { label: string; description: string; icon: typeof Plus; color: string; bg: string; border: string }> = {
  create: { label: 'Created', description: 'New record added', icon: Plus, color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  update: { label: 'Updated', description: 'Record modified', icon: Pencil, color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  delete: { label: 'Deleted', description: 'Record removed', icon: Trash2, color: 'text-red-700 dark:text-red-300', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  login: { label: 'Signed In', description: 'User authenticated', icon: LogIn, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
  logout: { label: 'Signed Out', description: 'Session ended', icon: LogOut, color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20' },
  sale: { label: 'Sale', description: 'POS transaction completed', icon: Receipt, color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  purchase: { label: 'Purchase', description: 'Stock procurement', icon: ShoppingBag, color: 'text-purple-700 dark:text-purple-300', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  payment: { label: 'Payment', description: 'Payment processed', icon: CreditCard, color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  adjustment: { label: 'Adjusted', description: 'Stock level corrected', icon: SlidersHorizontal, color: 'text-orange-700 dark:text-orange-300', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  return: { label: 'Returned', description: 'Item returned', icon: RotateCcw, color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  export: { label: 'Exported', description: 'Data exported', icon: Download, color: 'text-indigo-700 dark:text-indigo-300', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
  security: { label: 'Security', description: 'Security event', icon: Shield, color: 'text-red-700 dark:text-red-300', bg: 'bg-red-500/10', border: 'border-red-500/20' },
};

const RESOURCE_CONFIG: Record<string, { label: string; plural: string; icon: typeof Package }> = {
  item: { label: 'Item', plural: 'Items', icon: Package },
  category: { label: 'Category', plural: 'Categories', icon: FileText },
  customer: { label: 'Customer', plural: 'Customers', icon: Users },
  vendor: { label: 'Vendor', plural: 'Vendors', icon: Building2 },
  expense: { label: 'Expense', plural: 'Expenses', icon: DollarSign },
  purchase: { label: 'Purchase', plural: 'Purchases', icon: ShoppingBag },
  pos_transaction: { label: 'POS Sale', plural: 'POS Sales', icon: Receipt },
  user: { label: 'User', plural: 'Users', icon: User },
  settings: { label: 'Settings', plural: 'Settings', icon: Settings },
  report: { label: 'Report', plural: 'Reports', icon: FileText },
  tenant: { label: 'Organization', plural: 'Organizations', icon: Building2 },
};

/** Build a human-readable description for an audit entry */
function getHumanReadableDescription(entry: AuditEntry): string {
  const action = ACTION_CONFIG[entry.action];
  const resource = RESOURCE_CONFIG[entry.resource];
  const actionLabel = action?.label ?? entry.action;
  const resourceLabel = resource?.label ?? entry.resource;
  const name = entry.resource_name;

  switch (entry.action) {
    case 'create':
      return name ? `Created ${resourceLabel.toLowerCase()} "${name}"` : `Created new ${resourceLabel.toLowerCase()}`;
    case 'update':
      return name ? `Updated ${resourceLabel.toLowerCase()} "${name}"` : `Updated ${resourceLabel.toLowerCase()}`;
    case 'delete':
      return name ? `Deleted ${resourceLabel.toLowerCase()} "${name}"` : `Deleted ${resourceLabel.toLowerCase()}`;
    case 'login':
      return 'Signed in to the system';
    case 'logout':
      return 'Signed out of the system';
    case 'sale':
      return name ? `Completed sale "${name}"` : 'Completed a POS sale';
    case 'purchase':
      return name ? `Created purchase "${name}"` : 'Created a purchase order';
    case 'payment':
      return name ? `Processed payment "${name}"` : 'Processed a payment';
    case 'adjustment':
      return name ? `Adjusted stock for "${name}"` : 'Adjusted stock levels';
    case 'return':
      return name ? `Processed return for "${name}"` : 'Processed a return';
    case 'export':
      return `Exported ${resourceLabel.toLowerCase()} data`;
    case 'security':
      return name ? `Security event: ${name}` : 'Security event recorded';
    default:
      return entry.details || `${actionLabel} ${resourceLabel.toLowerCase()}${name ? ` "${name}"` : ''}`;
  }
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [orgs, setOrgs] = useState<OrgSummary[]>([]);
  const [users, setUsers] = useState<AdminUserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [resourceFilter, setResourceFilter] = useState('all');
  const [orgFilter, setOrgFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [logsData, orgsData, usersData] = await Promise.allSettled([
        getAuditLogsGlobal({ limitCount: 500 }),
        getAllOrganizations(),
        getAllUsers({ limitCount: 200 }),
      ]);
      if (logsData.status === 'fulfilled') setLogs(logsData.value);
      if (orgsData.status === 'fulfilled') setOrgs(orgsData.value);
      if (usersData.status === 'fulfilled') setUsers(usersData.value);
    } catch {
      toast.error('Failed to load audit logs');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const orgOptions = [
    { value: 'all', label: 'All Organizations' },
    ...orgs.map(o => ({ value: o.id, label: o.name })),
  ];

  const userOptions = [
    { value: 'all', label: 'All Users' },
    ...users.map(u => ({ value: u.id, label: `${u.full_name || u.email || u.id}` })),
  ];

  const filtered = useMemo(() => {
    return logs.filter(log => {
      const q = search.toLowerCase();
      const desc = getHumanReadableDescription(log).toLowerCase();
      const matchSearch = !q
        || desc.includes(q)
        || (log.resource_name || '').toLowerCase().includes(q)
        || (log.details || '').toLowerCase().includes(q)
        || (log.user_name || '').toLowerCase().includes(q)
        || log.action.includes(q);
      const matchAction = actionFilter === 'all' || log.action === actionFilter;
      const matchResource = resourceFilter === 'all' || log.resource === resourceFilter;
      const matchOrg = orgFilter === 'all' || (log as any).organization_id === orgFilter;
      const matchUser = userFilter === 'all' || log.user_id === userFilter;
      return matchSearch && matchAction && matchResource && matchOrg && matchUser;
    });
  }, [logs, search, actionFilter, resourceFilter, orgFilter, userFilter]);

  const activeFilterCount = [actionFilter, resourceFilter, orgFilter, userFilter].filter(f => f !== 'all').length;

  const clearFilters = () => {
    setActionFilter('all');
    setResourceFilter('all');
    setOrgFilter('all');
    setUserFilter('all');
    setSearch('');
  };

  const handleExport = () => {
    if (!filtered.length) { toast.error('No data to export'); return; }
    exportToCSV(filtered.map(l => ({
      Date: format(l.created_at, 'yyyy-MM-dd HH:mm'),
      Action: ACTION_CONFIG[l.action]?.label ?? l.action,
      Resource: RESOURCE_CONFIG[l.resource]?.label ?? l.resource,
      Name: l.resource_name || '',
      Description: getHumanReadableDescription(l),
      User: l.user_name || l.user_id,
      Details: l.details || '',
    })), 'audit-logs');
    toast.success('Exported');
  };

  // Stats
  const stats = useMemo(() => {
    const actionCounts: Record<string, number> = {};
    const userSet = new Set<string>();
    for (const log of filtered) {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
      userSet.add(log.user_id);
    }
    const topAction = Object.entries(actionCounts).sort((a, b) => b[1] - a[1])[0];
    return {
      total: filtered.length,
      uniqueUsers: userSet.size,
      topAction: topAction ? ACTION_CONFIG[topAction[0]]?.label ?? topAction[0] : '-',
      topActionCount: topAction ? topAction[1] : 0,
    };
  }, [filtered]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-orange-500/40 via-orange-400/25 to-teal-600/20 p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/15 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-500/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/4" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Audit Log</h1>
            <p className="mt-2 text-muted-foreground">
              {filtered.length} entries
              {orgFilter !== 'all' && ` in ${orgs.find(o => o.id === orgFilter)?.name ?? 'selected org'}`}
              {userFilter !== 'all' && ` by ${users.find(u => u.id === userFilter)?.full_name ?? 'selected user'}`}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleExport} className="btn-secondary flex items-center gap-2 px-4 py-2.5 text-sm">
              <Download className="w-4 h-4" /> Export CSV
            </button>
            <button onClick={load} className="btn-secondary flex items-center gap-2 px-4 py-2.5 text-sm">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      {!isLoading && filtered.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Entries', value: stats.total.toString(), icon: Activity, color: 'text-foreground', bg: 'bg-secondary' },
            { label: 'Unique Users', value: stats.uniqueUsers.toString(), icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
            { label: 'Most Common', value: stats.topAction, icon: Shield, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/20' },
            { label: 'Organizations', value: orgFilter === 'all' ? orgs.length.toString() : '1', icon: Building2, color: 'text-foreground', bg: 'bg-secondary' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl bg-card border border-orange-500/20 p-4 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-7 h-7 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
                </div>
                <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
              </div>
              <p className={`text-lg font-bold tabular-nums ${stat.color}`}>{stat.value}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Search + Filter Toggle */}
      <div className="flex gap-3">
        <div className="flex-1">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by action, resource, user, or description..." />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors border ${
            showFilters ? 'bg-primary/10 text-primary border-primary/30' : 'btn-secondary'
          }`}
        >
          <Filter className="w-4 h-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="card-theme rounded-2xl p-4 border border-border/50 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Filters</h3>
                {activeFilterCount > 0 && (
                  <button onClick={clearFilters} className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                    <X className="w-3 h-3" /> Clear all
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">User</label>
                  <CustomSelect options={userOptions} value={userFilter} onChange={setUserFilter} placeholder="All Users" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Organization</label>
                  <CustomSelect options={orgOptions} value={orgFilter} onChange={setOrgFilter} placeholder="All Organizations" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Action</label>
                  <CustomSelect
                    options={[{ value: 'all', label: 'All Actions' }, ...Object.entries(ACTION_CONFIG).map(([k, v]) => ({ value: k, label: v.label }))]}
                    value={actionFilter}
                    onChange={setActionFilter}
                    placeholder="All Actions"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Resource</label>
                  <CustomSelect
                    options={[{ value: 'all', label: 'All Resources' }, ...Object.entries(RESOURCE_CONFIG).map(([k, v]) => ({ value: k, label: v.label }))]}
                    value={resourceFilter}
                    onChange={setResourceFilter}
                    placeholder="All Resources"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Filter Pills */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {actionFilter !== 'all' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
              {ACTION_CONFIG[actionFilter]?.label ?? actionFilter}
              <button onClick={() => setActionFilter('all')} className="hover:bg-primary/20 rounded-full p-0.5"><X className="w-3 h-3" /></button>
            </span>
          )}
          {resourceFilter !== 'all' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-500/30">
              {RESOURCE_CONFIG[resourceFilter]?.label ?? resourceFilter}
              <button onClick={() => setResourceFilter('all')} className="hover:bg-blue-500/20 rounded-full p-0.5"><X className="w-3 h-3" /></button>
            </span>
          )}
          {orgFilter !== 'all' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30">
              {orgs.find(o => o.id === orgFilter)?.name ?? 'Org'}
              <button onClick={() => setOrgFilter('all')} className="hover:bg-emerald-500/20 rounded-full p-0.5"><X className="w-3 h-3" /></button>
            </span>
          )}
          {userFilter !== 'all' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30">
              <User className="w-3 h-3" /> {users.find(u => u.id === userFilter)?.full_name ?? 'User'}
              <button onClick={() => setUserFilter('all')} className="hover:bg-violet-500/20 rounded-full p-0.5"><X className="w-3 h-3" /></button>
            </span>
          )}
        </div>
      )}

      {/* Loading */}
      {isLoading && <div className="flex justify-center py-12"><LoadingSpinner size="lg" text="Loading audit logs..." /></div>}

      {/* Empty */}
      {!isLoading && filtered.length === 0 && (
        <EmptyState icon={Shield} title="No audit entries" description={search || activeFilterCount > 0 ? 'Try adjusting your filters or search.' : 'No activity recorded yet.'} />
      )}

      {/* Audit Timeline */}
      {!isLoading && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.slice(0, 200).map((entry, i) => {
            const actionCfg = ACTION_CONFIG[entry.action] || { label: entry.action, description: '', icon: Shield, color: 'text-muted-foreground', bg: 'bg-secondary', border: 'border-border' };
            const resCfg = RESOURCE_CONFIG[entry.resource] || { label: entry.resource, plural: entry.resource, icon: FileText };
            const Icon = actionCfg.icon;
            const ResIcon = resCfg.icon;
            const description = getHumanReadableDescription(entry);
            const timeAgo = formatDistanceToNow(entry.created_at, { addSuffix: true });
            const exactTime = format(entry.created_at, 'MMM d, yyyy \'at\' h:mm a');

            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.01 }}
                className="card-theme rounded-2xl border border-border/50 p-4 sm:p-5 hover:shadow-md hover:border-border transition-all duration-200 group"
              >
                <div className="flex items-start gap-4">
                  {/* Action Icon */}
                  <div className={`w-11 h-11 rounded-xl ${actionCfg.bg} ${actionCfg.border} border flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${actionCfg.color}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        {/* Action Badge + Description */}
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider ${actionCfg.bg} ${actionCfg.color} ${actionCfg.border} border`}>
                            {actionCfg.label}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-secondary/60 text-muted-foreground border border-border/40">
                            <ResIcon className="w-3 h-3" /> {resCfg.label}
                          </span>
                        </div>
                        {/* Human-readable description */}
                        <p className="text-sm font-medium text-foreground leading-snug">{description}</p>
                        {/* Details if any */}
                        {entry.details && entry.details !== description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{entry.details}</p>
                        )}
                      </div>

                      {/* Time */}
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-muted-foreground whitespace-nowrap" title={exactTime}>{timeAgo}</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-0.5">{format(entry.created_at, 'HH:mm')}</p>
                      </div>
                    </div>

                    {/* User + Org footer */}
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {entry.user_name || entry.user_id}
                      </span>
                      {(entry as any).organization_id && (
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {orgs.find(o => o.id === (entry as any).organization_id)?.name ?? 'Unknown Org'}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(entry.created_at, 'MMM d, h:mm a')}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
          {filtered.length > 200 && (
            <div className="text-center py-3 text-xs text-muted-foreground">
              Showing 200 of {filtered.length} entries
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
