import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
  Shield, Search, Filter, RefreshCw, Download,
  Package, Users, Building2, DollarSign, ShoppingBag,
  Settings, FileText, User, LogIn, LogOut,
  Plus, Pencil, Trash2, RotateCcw, CreditCard,
  SlidersHorizontal, Receipt
} from 'lucide-react';
import { getAuditLogs, AuditEntry, AuditAction, AuditResource } from '../../lib/api/auditLog';
import { exportToCSV } from '../../lib/utils/csvExport';
import { toast } from 'sonner';

// ── Config maps ───────────────────────────────────────────────────────────────

const ACTION_CONFIG: Record<AuditAction, { label: string; icon: any; color: string }> = {
  create:     { label: 'Created',    icon: Plus,           color: 'text-emerald-500 bg-emerald-500/10' },
  update:     { label: 'Updated',    icon: Pencil,         color: 'text-blue-500 bg-blue-500/10' },
  delete:     { label: 'Deleted',    icon: Trash2,         color: 'text-red-500 bg-red-500/10' },
  login:      { label: 'Login',      icon: LogIn,          color: 'text-primary bg-primary/10' },
  logout:     { label: 'Logout',     icon: LogOut,         color: 'text-muted-foreground bg-secondary' },
  sale:       { label: 'Sale',       icon: Receipt,        color: 'text-emerald-500 bg-emerald-500/10' },
  purchase:   { label: 'Purchase',   icon: ShoppingBag,    color: 'text-purple-500 bg-purple-500/10' },
  payment:    { label: 'Payment',    icon: CreditCard,     color: 'text-blue-500 bg-blue-500/10' },
  adjustment: { label: 'Adjustment', icon: SlidersHorizontal, color: 'text-orange-500 bg-orange-500/10' },
  return:     { label: 'Return',     icon: RotateCcw,      color: 'text-warning-500 bg-warning-500/10' },
  export:     { label: 'Export',     icon: Download,       color: 'text-indigo-500 bg-indigo-500/10' },
};

const RESOURCE_CONFIG: Record<AuditResource, { label: string; icon: any }> = {
  item:            { label: 'Item',        icon: Package },
  category:        { label: 'Category',   icon: FileText },
  customer:        { label: 'Customer',   icon: Users },
  vendor:          { label: 'Vendor',     icon: Building2 },
  expense:         { label: 'Expense',    icon: DollarSign },
  purchase:        { label: 'Purchase',   icon: ShoppingBag },
  pos_transaction: { label: 'POS Sale',   icon: Receipt },
  user:            { label: 'User',       icon: User },
  settings:        { label: 'Settings',   icon: Settings },
  report:          { label: 'Report',     icon: FileText },
};

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [resourceFilter, setResourceFilter] = useState<string>('all');

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAuditLogs({ limitCount: 200 });
      setLogs(data);
    } catch {
      toast.error('Failed to load audit logs');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = logs.filter(log => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (log.resource_name || '').toLowerCase().includes(q) ||
      (log.details || '').toLowerCase().includes(q) ||
      log.action.includes(q) ||
      log.resource.includes(q);
    const matchAction = actionFilter === 'all' || log.action === actionFilter;
    const matchResource = resourceFilter === 'all' || log.resource === resourceFilter;
    return matchSearch && matchAction && matchResource;
  });

  const handleExport = () => {
    if (!filtered.length) { toast.error('No data to export'); return; }
    exportToCSV(
      filtered.map(l => ({
        Date: format(l.created_at, 'yyyy-MM-dd HH:mm:ss'),
        Action: l.action,
        Resource: l.resource,
        'Resource Name': l.resource_name || '',
        Details: l.details || '',
        'User ID': l.user_id,
      })),
      `audit-log-${format(new Date(), 'yyyy-MM-dd')}`
    );
    toast.success('Audit log exported');
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-10">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="app-page-title flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Audit Log
          </h1>
          <p className="app-page-subtitle">Track all critical actions performed in the system</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2.5 rounded-xl bg-card border border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-sm font-medium text-foreground transition-colors">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Search by resource, action, details..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-card border border-border/60 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <select value={actionFilter} onChange={e => setActionFilter(e.target.value)}
          className="h-10 px-3 bg-card border border-border/60 rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20">
          <option value="all">All Actions</option>
          {Object.entries(ACTION_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <select value={resourceFilter} onChange={e => setResourceFilter(e.target.value)}
          className="h-10 px-3 bg-card border border-border/60 rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20">
          <option value="all">All Resources</option>
          {Object.entries(RESOURCE_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </motion.div>

      {/* Stats */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="font-medium">{filtered.length} entries</span>
        {(search || actionFilter !== 'all' || resourceFilter !== 'all') && (
          <button onClick={() => { setSearch(''); setActionFilter('all'); setResourceFilter('all'); }}
            className="text-primary hover:underline">Clear filters</button>
        )}
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-5 space-y-3 animate-pulse">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-8 h-8 bg-secondary rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 bg-secondary rounded w-48" />
                  <div className="h-3 bg-secondary rounded w-32" />
                </div>
                <div className="h-3 bg-secondary rounded w-24 flex-shrink-0" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Shield className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-foreground font-medium">No audit entries found</p>
            <p className="text-muted-foreground text-sm mt-1">
              {logs.length === 0
                ? 'Audit events will appear here as actions are performed'
                : 'No entries match your current filters'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            <AnimatePresence initial={false}>
              {filtered.map((log, i) => {
                const actionCfg = ACTION_CONFIG[log.action] || ACTION_CONFIG.update;
                const resourceCfg = RESOURCE_CONFIG[log.resource] || RESOURCE_CONFIG.item;
                const ActionIcon = actionCfg.icon;
                const ResourceIcon = resourceCfg.icon;
                return (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(i * 0.02, 0.3) }}
                    className="flex items-start gap-3 px-5 py-3.5 hover:bg-secondary/20 transition-colors"
                  >
                    {/* Action icon */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${actionCfg.color}`}>
                      <ActionIcon className="w-3.5 h-3.5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-foreground">{actionCfg.label}</span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary text-xs font-medium text-muted-foreground">
                          <ResourceIcon className="w-3 h-3" />
                          {resourceCfg.label}
                        </span>
                        {log.resource_name && (
                          <span className="text-sm text-foreground font-medium truncate max-w-[200px]">
                            "{log.resource_name}"
                          </span>
                        )}
                      </div>
                      {log.details && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{log.details}</p>
                      )}
                    </div>

                    {/* Timestamp */}
                    <div className="text-xs text-muted-foreground flex-shrink-0 text-right">
                      <p>{format(log.created_at, 'MMM d, yyyy')}</p>
                      <p>{format(log.created_at, 'h:mm a')}</p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </div>
  );
}
