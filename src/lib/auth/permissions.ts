import { useAuthStore } from '../store';
import { ROLE_PERMISSIONS, getRolePermissions } from '../constants/permissions';
import type { OrgRole, Permission } from '../types/org';

/**
 * Central permission engine. Reads from auth store's membership and permissions state.
 * All permission checks in the app should go through this module.
 */

export function can(permission: Permission): boolean {
  const state = useAuthStore.getState();
  const overrides = state.membership?.permissions_overrides;

  // Check overrides first
  if (overrides && permission in overrides) {
    return overrides[permission];
  }

  // Fall back to role defaults
  const role = (state.membership?.role ?? 'viewer') as OrgRole;
  const rolePerms = getRolePermissions(role);
  return rolePerms.has(permission);
}

export function canAny(permissions: Permission[]): boolean {
  return permissions.some(p => can(p));
}

export function hasRole(role: OrgRole): boolean {
  const state = useAuthStore.getState();
  return state.membership?.role === role;
}

export function isOwner(): boolean {
  return hasRole('owner');
}

export function isManager(): boolean {
  const state = useAuthStore.getState();
  const role = state.membership?.role;
  return role === 'owner' || role === 'manager';
}

export function getRole(): OrgRole {
  const state = useAuthStore.getState();
  return (state.membership?.role ?? 'viewer') as OrgRole;
}

export function getPermissions(): Set<Permission> {
  const state = useAuthStore.getState();
  const role = (state.membership?.role ?? 'viewer') as OrgRole;
  const base = getRolePermissions(role);
  const overrides = state.membership?.permissions_overrides;

  if (!overrides) return base;

  // Merge overrides into base
  const merged = new Set(base);
  for (const [perm, allowed] of Object.entries(overrides)) {
    if (allowed) {
      merged.add(perm as Permission);
    } else {
      merged.delete(perm as Permission);
    }
  }
  return merged;
}
