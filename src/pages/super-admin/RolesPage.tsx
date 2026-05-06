import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crown, Shield, Users, Eye, Save, RotateCcw, Info, ChevronRight, Loader2, CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getAllOrganizations,
  getOrgRoleOverrides,
  saveOrgRoleOverrides,
  type RoleOverrides,
} from '../../lib/api/superAdmin';
import {
  ROLE_PERMISSIONS,
  PERMISSION_METADATA,
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  ROLE_STYLE,
  getPermissionsByCategory,
} from '../../lib/constants/permissions';
import type { OrgRole, Permission, OrgSummary } from '../../lib/types/org';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import CustomSelect from '../../components/ui/CustomSelect';

const ROLES: { key: OrgRole; icon: typeof Crown }[] = [
  { key: 'owner', icon: Crown },
  { key: 'manager', icon: Shield },
  { key: 'cashier', icon: Users },
  { key: 'accountant', icon: Users },
  { key: 'viewer', icon: Eye },
];

const PERMISSION_GROUPS = getPermissionsByCategory();

export default function RolesPage() {
  const [orgs, setOrgs] = useState<OrgSummary[]>([]);
  const [selectedOrg, setSelectedOrg] = useState('');
  const [activeRole, setActiveRole] = useState<OrgRole>('owner');
  const [overrides, setOverrides] = useState<RoleOverrides>({});
  const [orgsLoading, setOrgsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingOverrides, setLoadingOverrides] = useState(false);
  const [savedSnapshot, setSavedSnapshot] = useState<string>('');

  useEffect(() => {
    getAllOrganizations()
      .then(setOrgs)
      .catch(() => toast.error('Failed to load organizations'))
      .finally(() => setOrgsLoading(false));
  }, []);

  const loadOverrides = useCallback(async () => {
    if (!selectedOrg) return;
    setLoadingOverrides(true);
    try {
      const data = await getOrgRoleOverrides(selectedOrg);
      setOverrides(data);
      setSavedSnapshot(JSON.stringify(data));
    } catch {
      toast.error('Failed to load role overrides');
    } finally {
      setLoadingOverrides(false);
    }
  }, [selectedOrg]);

  useEffect(() => { loadOverrides(); }, [loadOverrides]);

  const orgOptions = orgs.map(o => ({ value: o.id, label: o.name }));

  // Compute effective permissions for the active role
  const basePerms = ROLE_PERMISSIONS[activeRole] ?? new Set<Permission>();
  const roleOverrides = overrides[activeRole] ?? {};

  const effectivePerms = useMemo(() => {
    const effective = new Set(basePerms);
    for (const [perm, allowed] of Object.entries(roleOverrides)) {
      if (allowed) effective.add(perm as Permission);
      else effective.delete(perm as Permission);
    }
    return effective;
  }, [basePerms, roleOverrides]);

  const hasChanges = JSON.stringify(overrides) !== savedSnapshot;

  const togglePermission = (perm: Permission) => {
    if (activeRole === 'owner') return; // Owner always has all permissions

    setOverrides(prev => {
      const current = prev[activeRole] ?? {};
      const isCurrentlyEnabled = effectivePerms.has(perm);

      // If toggling back to base default, remove the override
      const baseHasIt = basePerms.has(perm);
      if (isCurrentlyEnabled && !baseHasIt) {
        // Was overridden to true, now removing override → goes back to base (false)
        const { [perm]: _, ...rest } = current;
        return { ...prev, [activeRole]: rest };
      }
      if (!isCurrentlyEnabled && baseHasIt) {
        // Was overridden to false, now removing override → goes back to base (true)
        const { [perm]: _, ...rest } = current;
        return { ...prev, [activeRole]: rest };
      }

      // Otherwise, add an override
      const newOverrides = { ...current, [perm]: !isCurrentlyEnabled };
      return { ...prev, [activeRole]: newOverrides };
    });
  };

  const handleSave = async () => {
    if (!selectedOrg) return;
    setSaving(true);
    try {
      // Clean up: remove empty role override objects
      const cleaned: RoleOverrides = {};
      for (const [role, perms] of Object.entries(overrides)) {
        if (perms && Object.keys(perms).length > 0) {
          cleaned[role as OrgRole] = perms;
        }
      }
      await saveOrgRoleOverrides(selectedOrg, cleaned);
      setOverrides(cleaned);
      setSavedSnapshot(JSON.stringify(cleaned));
      toast.success('Permission overrides saved');
    } catch {
      toast.error('Failed to save overrides');
    } finally {
      setSaving(false);
    }
  };

  const handleResetRole = () => {
    setOverrides(prev => {
      const { [activeRole]: _, ...rest } = prev;
      return rest;
    });
  };

  const getPermissionCount = (role: OrgRole) => {
    const base = ROLE_PERMISSIONS[role] ?? new Set();
    const roleOvr = overrides[role] ?? {};
    const effective = new Set(base);
    for (const [perm, allowed] of Object.entries(roleOvr)) {
      if (allowed) effective.add(perm as Permission);
      else effective.delete(perm as Permission);
    }
    return effective.size;
  };

  const getOverrideCount = (role: OrgRole) => {
    return Object.keys(overrides[role] ?? {}).length;
  };

  const roleStyle = ROLE_STYLE[activeRole];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-orange-500/40 via-orange-400/25 to-teal-600/20 p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/15 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-500/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/4" />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Role Permissions</h1>
            <p className="mt-2 text-muted-foreground">
              {selectedOrg
                ? 'Customize what each role can do for this organization.'
                : 'Select an organization to customize role permissions.'}
            </p>
          </div>
          {selectedOrg && hasChanges && (
            <div className="flex gap-2">
              <button
                onClick={loadOverrides}
                className="btn-secondary flex items-center gap-2 px-4 py-2.5 text-sm"
              >
                <RotateCcw className="w-4 h-4" /> Discard
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Org Selector */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <CustomSelect
            options={orgOptions}
            value={selectedOrg}
            onChange={setSelectedOrg}
            placeholder={orgsLoading ? 'Loading organizations...' : 'Select organization to customize...'}
          />
        </div>
      </div>

      {/* No Org Selected */}
      {!selectedOrg && (
        <EmptyState
          icon={Shield}
          title="Select an organization"
          description="Choose an organization to view and customize role permissions for that organization."
        />
      )}

      {/* Loading Overrides */}
      {selectedOrg && loadingOverrides && (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" text="Loading permissions..." />
        </div>
      )}

      {/* Main Content */}
      {selectedOrg && !loadingOverrides && (
        <div className="space-y-6">
          {/* Role Tabs */}
          <div className="flex gap-1 overflow-x-auto pb-1 app-toolbar-surface rounded-2xl p-1">
            {ROLES.map(role => {
              const style = ROLE_STYLE[role.key];
              const overrideCount = getOverrideCount(role.key);
              return (
                <button
                  key={role.key}
                  onClick={() => setActiveRole(role.key)}
                  className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                    activeRole === role.key ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {activeRole === role.key && (
                    <motion.div
                      layoutId="roleTab"
                      className="absolute inset-0 bg-background rounded-xl shadow-sm"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <role.icon className={`w-4 h-4 ${style.color}`} />
                    {ROLE_LABELS[role.key]}
                    {overrideCount > 0 && (
                      <span className="w-4 h-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                        {overrideCount}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Role Description */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeRole}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className={`rounded-2xl p-4 border ${roleStyle.borderColor} ${roleStyle.bgColor}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${roleStyle.bgColor} flex items-center justify-center`}>
                      {activeRole === 'owner' ? (
                        <Crown className={`w-5 h-5 ${roleStyle.color}`} />
                      ) : activeRole === 'manager' ? (
                        <Shield className={`w-5 h-5 ${roleStyle.color}`} />
                      ) : activeRole === 'viewer' ? (
                        <Eye className={`w-5 h-5 ${roleStyle.color}`} />
                      ) : (
                        <Users className={`w-5 h-5 ${roleStyle.color}`} />
                      )}
                    </div>
                    <div>
                      <h3 className={`font-bold ${roleStyle.color}`}>{ROLE_LABELS[activeRole]}</h3>
                      <p className="text-sm text-muted-foreground">{ROLE_DESCRIPTIONS[activeRole]}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-foreground">{getPermissionCount(activeRole)}</p>
                    <p className="text-xs text-muted-foreground">permissions</p>
                  </div>
                </div>
              </div>

              {activeRole === 'owner' && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 text-sm">
                  <Crown className="w-4 h-4 flex-shrink-0" />
                  <span className="font-medium">Owner role always has all permissions and cannot be modified.</span>
                </div>
              )}

              {activeRole !== 'owner' && getOverrideCount(activeRole) > 0 && (
                <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-primary/5 border border-primary/20">
                  <div className="flex items-center gap-2 text-sm text-primary">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="font-medium">{getOverrideCount(activeRole)} custom override{getOverrideCount(activeRole) !== 1 ? 's' : ''} for this role</span>
                  </div>
                  <button
                    onClick={handleResetRole}
                    className="text-xs font-medium text-muted-foreground hover:text-error transition-colors flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset to defaults
                  </button>
                </div>
              )}

              {/* Permission Groups */}
              {Object.entries(PERMISSION_GROUPS).map(([category, perms]) => {
                const grantedInCategory = perms.filter(p => effectivePerms.has(p)).length;
                return (
                  <div key={category} className="card-theme rounded-[2.5rem] overflow-hidden">
                    <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <h3 className="font-bold text-foreground">{category}</h3>
                        <span className="text-xs font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                          {grantedInCategory}/{perms.length}
                        </span>
                      </div>
                      {activeRole !== 'owner' && (
                        <button
                          onClick={() => {
                            const allEnabled = perms.every(p => effectivePerms.has(p));
                            setOverrides(prev => {
                              const current = { ...(prev[activeRole] ?? {}) };
                              for (const p of perms) {
                                const baseHasIt = basePerms.has(p);
                                if (allEnabled) {
                                  // Disable all that are currently effective
                                  if (baseHasIt) current[p] = false;
                                  else delete current[p];
                                } else {
                                  // Enable all that aren't currently effective
                                  if (!baseHasIt) current[p] = true;
                                  else delete current[p];
                                }
                              }
                              return { ...prev, [activeRole]: current };
                            });
                          }}
                          className="text-xs font-medium text-primary hover:text-primary-dark transition-colors"
                        >
                          {perms.every(p => effectivePerms.has(p)) ? 'Disable all' : 'Enable all'}
                        </button>
                      )}
                    </div>
                    <div className="divide-y divide-border/30">
                      {perms.map(perm => {
                        const meta = PERMISSION_METADATA[perm];
                        const isEnabled = effectivePerms.has(perm);
                        const isOverridden = perm in roleOverrides;
                        const baseHasIt = basePerms.has(perm);
                        const isChanged = isOverridden && roleOverrides[perm] !== baseHasIt;

                        return (
                          <div
                            key={perm}
                            className={`flex items-center gap-4 px-6 py-3.5 transition-colors ${
                              activeRole !== 'owner' ? 'hover:bg-secondary/20 cursor-pointer' : ''
                            } ${isChanged ? 'bg-primary/5' : ''}`}
                            onClick={() => togglePermission(perm)}
                          >
                            {/* Toggle Switch */}
                            <div className="flex-shrink-0">
                              <div
                                className={`relative w-10 h-6 rounded-full transition-colors duration-200 ${
                                  isEnabled
                                    ? activeRole === 'owner' ? 'bg-amber-500' : 'bg-primary'
                                    : 'bg-border'
                                } ${activeRole === 'owner' ? 'opacity-80' : ''}`}
                              >
                                <motion.div
                                  className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
                                  animate={{ left: isEnabled ? '22px' : '2px' }}
                                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                />
                              </div>
                            </div>

                            {/* Permission Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-foreground">
                                  {meta?.label ?? perm}
                                </span>
                                {isChanged && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary">
                                    Modified
                                  </span>
                                )}
                              </div>
                              {/* Tooltip description */}
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                {meta?.description ?? perm}
                              </p>
                            </div>

                            {/* Info icon with full tooltip on hover */}
                            {meta?.description && (
                              <div className="relative group flex-shrink-0">
                                <Info className="w-4 h-4 text-muted-foreground/50 hover:text-muted-foreground transition-colors" />
                                <div className="absolute right-0 bottom-full mb-2 w-64 p-3 rounded-xl bg-popover border border-border shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
                                  <p className="text-xs font-medium text-foreground mb-1">{meta.label}</p>
                                  <p className="text-xs text-muted-foreground leading-relaxed">{meta.description}</p>
                                  <div className="absolute top-full right-4 w-2 h-2 bg-popover border-r border-b border-border rotate-45 -mt-1" />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
