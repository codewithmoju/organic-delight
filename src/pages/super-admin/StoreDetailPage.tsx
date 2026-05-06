import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Users, Package, ArrowUpDown, Wallet, Settings, Crown, Shield, Eye,
  Trash2, RefreshCw, Mail, Calendar, Building2, Hash, TrendingUp, TrendingDown, DollarSign
} from 'lucide-react';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { getOrganizationDetail, getOrgData, setUserRole, removeUserFromOrg } from '../../lib/api/superAdmin';
import { ROLE_LABELS, ROLE_STYLE } from '../../lib/constants/permissions';
import type { Organization, OrganizationMember, OrgRole } from '../../lib/types/org';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import CustomSelect from '../../components/ui/CustomSelect';
import SearchInput from '../../components/ui/SearchInput';
import { formatCurrency } from '../../lib/utils/notifications';

type Tab = 'members' | 'inventory' | 'transactions' | 'expenses' | 'settings';

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
  viewer: Eye,
};

const TAB_CONFIG: { key: Tab; label: string; icon: typeof Users; color: string; gradient: string }[] = [
  { key: 'members', label: 'Members', icon: Users, color: 'text-orange-600 dark:text-orange-400', gradient: 'from-orange-500 to-orange-600' },
  { key: 'inventory', label: 'Inventory', icon: Package, color: 'text-teal-600 dark:text-teal-400', gradient: 'from-teal-500 to-teal-600' },
  { key: 'transactions', label: 'Transactions', icon: ArrowUpDown, color: 'text-purple-600 dark:text-purple-400', gradient: 'from-purple-500 to-purple-600' },
  { key: 'expenses', label: 'Expenses', icon: Wallet, color: 'text-amber-600 dark:text-amber-400', gradient: 'from-amber-500 to-amber-600' },
  { key: 'settings', label: 'Settings', icon: Settings, color: 'text-teal-600 dark:text-teal-400', gradient: 'from-teal-500 to-teal-600' },
];

export default function StoreDetailPage() {
  const { id: orgId } = useParams<{ id: string }>();
  const [org, setOrg] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('members');
  const [confirmRemove, setConfirmRemove] = useState<OrganizationMember | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const [dataItems, setDataItems] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataSearch, setDataSearch] = useState('');
  const [itemsMap, setItemsMap] = useState<Map<string, string>>(new Map());

  const load = useCallback(async () => {
    if (!orgId) return;
    setIsLoading(true);
    try {
      const detail = await getOrganizationDetail(orgId);
      setOrg(detail.org);
      setMembers(detail.members);
    } catch {
      toast.error('Failed to load store details');
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  useEffect(() => { load(); }, [load]);

  const loadData = useCallback(async (collectionName: string) => {
    if (!orgId) return;
    setDataLoading(true);
    try {
      const data = await getOrgData(orgId, collectionName, { limitCount: 100, orderByField: 'created_at' });
      setDataItems(data);
      if (collectionName === 'transactions') {
        try {
          const items = await getOrgData(orgId, 'items', { limitCount: 500 });
          const map = new Map<string, string>();
          for (const item of items) map.set(item.id, item.name || item.id);
          setItemsMap(map);
        } catch { /* ignore */ }
      }
    } catch {
      toast.error(`Failed to load ${collectionName}`);
    } finally {
      setDataLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    if (tab === 'inventory') loadData('items');
    else if (tab === 'transactions') loadData('transactions');
    else if (tab === 'expenses') loadData('expenses');
  }, [tab, loadData]);

  const handleRoleChange = async (member: OrganizationMember, newRole: OrgRole) => {
    if (!orgId) return;
    try {
      await setUserRole(orgId, member.user_id, newRole);
      setMembers(prev => prev.map(m => m.id === member.id ? { ...m, role: newRole } : m));
      toast.success(`Role updated to ${newRole}`);
    } catch {
      toast.error('Failed to update role');
    }
  };

  const handleRemove = async () => {
    if (!confirmRemove || !orgId) return;
    setIsRemoving(true);
    try {
      await removeUserFromOrg(orgId, confirmRemove.user_id);
      setMembers(prev => prev.filter(m => m.id !== confirmRemove.id));
      setConfirmRemove(null);
      toast.success('Member removed');
    } catch {
      toast.error('Failed to remove member');
    } finally {
      setIsRemoving(false);
    }
  };

  const filteredData = useMemo(() => {
    if (!dataSearch) return dataItems;
    const q = dataSearch.toLowerCase();
    return dataItems.filter(item => JSON.stringify(item).toLowerCase().includes(q));
  }, [dataItems, dataSearch]);

  const owner = members.find(m => m.role === 'owner');

  if (isLoading) {
    return <div className="flex justify-center py-12"><LoadingSpinner size="lg" text="Loading store..." /></div>;
  }

  if (!org) {
    return <div className="text-center py-12 text-muted-foreground">Store not found.</div>;
  }

  const activeTabConfig = TAB_CONFIG.find(t => t.key === tab)!;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Back */}
      <Link to="/super-admin/stores" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to stores
      </Link>

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-[2.5rem] p-6 sm:p-8 lg:p-10">
        {/* Gradient mesh */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/60 via-orange-400/40 to-teal-600/35" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-400/40 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-teal-500/35 via-transparent to-transparent" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-400/25 rounded-full blur-[140px] -translate-y-1/3 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-teal-500/25 rounded-full blur-[120px] translate-y-1/3 -translate-x-1/4" />
        <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-orange-500/15 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2" />

        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/25 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-lg shadow-orange-500/30">
                <Package className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">{org.name}</h1>
                <div className="flex items-center gap-3 mt-1 text-white/80 text-sm">
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Created {formatDistanceToNow(org.created_at, { addSuffix: true })}</span>
                  <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {members.length} member{members.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>

            {owner && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/20 backdrop-blur-sm border border-white/20">
                <img
                  src={owner.user_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(owner.user_name || 'User')}&background=f97316&color=fff`}
                  alt="" className="w-7 h-7 rounded-full"
                />
                <div>
                  <p className="text-xs text-white/70">Owner</p>
                  <p className="text-sm font-semibold text-white">{owner.user_name}</p>
                </div>
              </div>
            )}
          </div>

          {/* Quick stats in header */}
          <div className="flex items-center gap-3 mt-5 flex-wrap">
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/20 backdrop-blur-sm border border-white/20">
              <Users className="w-4 h-4 text-white/70" />
              <span className="text-sm font-semibold text-white">{members.length}</span>
              <span className="text-xs text-white/70">members</span>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/20 backdrop-blur-sm border border-white/20">
              <Building2 className="w-4 h-4 text-white/80" />
              <span className="text-sm font-semibold text-white">{org.id.substring(0, 8)}</span>
              <span className="text-xs text-white/70">ID</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 app-toolbar-surface rounded-2xl p-1">
        {TAB_CONFIG.map(t => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setDataSearch(''); }}
            className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
              tab === t.key ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab === t.key && (
              <motion.div layoutId="storeTab" className="absolute inset-0 bg-background rounded-xl shadow-sm" transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <t.icon className="w-4 h-4" /> {t.label}
            </span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {/* Members Tab */}
        {tab === 'members' && (
          <motion.div key="members" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            {/* Role distribution */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {(['owner', 'manager', 'cashier', 'accountant', 'viewer'] as OrgRole[]).map(role => {
                const count = members.filter(m => m.role === role).length;
                const style = ROLE_STYLE[role];
                const RoleIcon = ROLE_ICONS[role];
                return (
                  <div key={role} className={`rounded-2xl p-3 border ${style.borderColor} ${style.bgColor} text-center`}>
                    <RoleIcon className={`w-5 h-5 ${style.color} mx-auto mb-1`} />
                    <p className="text-lg font-bold text-foreground">{count}</p>
                    <p className="text-[11px] font-medium text-muted-foreground">{ROLE_LABELS[role]}s</p>
                  </div>
                );
              })}
            </div>

            {members.length === 0 ? (
              <div className="card-theme rounded-2xl p-8 text-center border border-border/50">
                <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No members in this organization.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {members.map((m, i) => {
                  const style = ROLE_STYLE[m.role] ?? ROLE_STYLE.viewer;
                  const RoleIcon = ROLE_ICONS[m.role] ?? Users;
                  return (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="card-theme rounded-2xl border border-orange-500/20 p-4 hover:shadow-md hover:border-orange-500/40 transition-all duration-200 group"
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={m.user_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.user_name || 'User')}&background=f97316&color=fff`}
                          alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0 border border-border/30"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-bold text-foreground truncate">{m.user_name || 'Unknown'}</p>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${style.bgColor} ${style.color} ${style.borderColor}`}>
                              <RoleIcon className="w-2.5 h-2.5" /> {ROLE_LABELS[m.role]}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                            <Mail className="w-3 h-3" /> {m.user_email || '-'}
                          </p>
                          <p className="text-[11px] text-muted-foreground/60">
                            Joined {format(m.joined_at, 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/30">
                        <div className="flex-1">
                          <CustomSelect
                            options={ROLE_OPTIONS}
                            value={m.role}
                            onChange={(val) => handleRoleChange(m, val as OrgRole)}
                            placeholder="Role"
                          />
                        </div>
                        <button
                          onClick={() => setConfirmRemove(m)}
                          className="p-2 rounded-lg hover:bg-error/10 transition-colors flex-shrink-0"
                          title="Remove"
                        >
                          <Trash2 className="w-4 h-4 text-error" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* Data Tabs (Inventory / Transactions / Expenses) */}
        {(tab === 'inventory' || tab === 'transactions' || tab === 'expenses') && (
          <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <SearchInput value={dataSearch} onChange={setDataSearch} placeholder={`Search ${tab}...`} />
              </div>
              <button onClick={() => loadData(tab === 'inventory' ? 'items' : tab)} className="btn-secondary flex items-center gap-2 px-4 py-2.5 text-sm">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {dataLoading ? (
              <div className="flex justify-center py-12"><LoadingSpinner size="lg" text={`Loading ${tab}...`} /></div>
            ) : filteredData.length === 0 ? (
              <div className="card-theme rounded-2xl p-8 text-center border border-border/50">
                {tab === 'inventory' ? <Package className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" /> :
                 tab === 'transactions' ? <ArrowUpDown className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" /> :
                 <Wallet className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />}
                <p className="text-sm text-muted-foreground">No {tab} found for this organization.</p>
              </div>
            ) : (
              <div className="card-theme rounded-[2rem] overflow-hidden border border-orange-500/20">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-secondary/30 border-b border-border/40">
                        {Object.keys(filteredData[0]).filter(k => k !== 'id' && !k.endsWith('_id')).slice(0, 6).map(key => (
                          <th key={key} className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{key.replace(/_/g, ' ')}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {filteredData.slice(0, 50).map((item, i) => (
                        <motion.tr
                          key={item.id || i}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.015 }}
                          className="hover:bg-secondary/20 transition-colors"
                        >
                          {Object.entries(item).filter(([k]) => k !== 'id' && !k.endsWith('_id')).slice(0, 6).map(([key, val]) => {
                            let displayVal: string;
                            if (key === 'item_id' && tab === 'transactions') {
                              displayVal = item.item_name || itemsMap.get(val as string) || String(val ?? '-');
                            } else if (val instanceof Date) {
                              displayVal = format(val, 'MMM d, yyyy');
                            } else if (typeof val === 'number' && (key.includes('price') || key.includes('value') || key.includes('amount') || key.includes('cost'))) {
                              displayVal = formatCurrency(val);
                            } else {
                              displayVal = String(val ?? '-');
                            }
                            return <td key={key} className="px-5 py-3.5 text-foreground">{displayVal}</td>;
                          })}
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredData.length > 50 && (
                  <div className="px-6 py-3 text-xs text-muted-foreground text-center border-t border-border/30 bg-secondary/10">
                    Showing 50 of {filteredData.length} records
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* Settings Tab */}
        {tab === 'settings' && (
          <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="card-theme rounded-[2rem] p-6 border border-orange-500/20">
              <h3 className="font-bold text-foreground text-lg mb-4">Organization Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: 'Organization ID', value: org.id, mono: true, icon: Hash },
                  { label: 'Created By', value: org.created_by, mono: true, icon: Users },
                  { label: 'Created At', value: format(org.created_at, 'PPpp'), icon: Calendar },
                  { label: 'Last Updated', value: format(org.updated_at, 'PPpp'), icon: RefreshCw },
                ].map(info => (
                  <div key={info.label} className="flex items-start gap-3 p-3 rounded-xl bg-secondary/30 border border-border/30">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <info.icon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-0.5">{info.label}</p>
                      <p className={`text-sm font-semibold text-foreground ${info.mono ? 'font-mono text-xs' : ''}`}>{info.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={!!confirmRemove}
        onClose={() => setConfirmRemove(null)}
        onConfirm={handleRemove}
        title="Remove Member"
        message={`Remove ${confirmRemove?.user_name || 'this user'} from ${org.name}?`}
        confirmText="Remove"
        variant="danger"
        isLoading={isRemoving}
      />
    </motion.div>
  );
}
