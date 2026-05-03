import { useAuthStore } from '../store';
import { ROLE_PERMISSIONS } from '../constants/permissions';
import { can as centralCan } from '../auth/permissions';
import type { OrgRole, Permission } from '../types/org';

/**
 * POS permission levels by role:
 *
 * owner   — full access: void, refund, discounts, settings, reports, shift close
 * manager — most access: discounts, refunds, shift close; cannot void or change settings
 * cashier — basic cashier: sell, hold cart, basic discounts only; no void/refund/settings
 *
 * Delegates to centralized permissions engine when org membership exists,
 * falls back to legacy profile.role when not in an org context.
 */

// Legacy permission names used by existing POS components
export type POSPermission = Permission | LegacyPOSPermission;

type LegacyPOSPermission =
  | 'void_transaction'
  | 'process_return'
  | 'apply_discount'
  | 'apply_large_discount'
  | 'credit_sale'
  | 'close_shift'
  | 'open_shift'
  | 'view_reports'
  | 'change_settings'
  | 'hold_cart'
  | 'change_bill_type';

const LARGE_DISCOUNT_THRESHOLD = 10; // % — discounts above this need manager+

// Legacy role mapping for backward compatibility when no org membership exists
const LEGACY_ROLE_MAP: Record<string, OrgRole> = {
  admin: 'owner',
  manager: 'manager',
  user: 'cashier',
};

// Map legacy permission names to new namespaced names
const LEGACY_TO_NEW: Record<string, Permission> = {
  void_transaction: 'pos.void_transaction',
  process_return: 'pos.process_return',
  apply_discount: 'pos.apply_discount',
  apply_large_discount: 'pos.apply_large_discount',
  credit_sale: 'pos.credit_sale',
  close_shift: 'pos.close_shift',
  open_shift: 'pos.open_shift',
  view_reports: 'pos.view_reports' as Permission,
  change_settings: 'pos.change_settings',
  hold_cart: 'pos.hold_cart',
  change_bill_type: 'pos.change_bill_type',
};

function resolvePermission(permission: POSPermission): Permission {
  if (permission.startsWith('pos.') || permission.startsWith('inventory.') || permission.startsWith('dashboard.')) {
    return permission as Permission;
  }
  return LEGACY_TO_NEW[permission] ?? (permission as Permission);
}

export function usePOSPermissions() {
  const profile = useAuthStore(s => s.profile);
  const membership = useAuthStore(s => s.membership);

  // Use org role if available, otherwise map legacy profile role
  const role: OrgRole = membership?.role ?? LEGACY_ROLE_MAP[profile?.role ?? 'user'] ?? 'cashier';
  const permissions = ROLE_PERMISSIONS[role] ?? ROLE_PERMISSIONS.cashier;

  const can = (permission: POSPermission): boolean => {
    const resolved = resolvePermission(permission);
    // Use centralized engine if org membership exists
    if (membership) return centralCan(resolved);
    return permissions.has(resolved);
  };

  const canApplyDiscount = (discountPercent: number): boolean => {
    if (!can('apply_discount')) return false;
    if (discountPercent > LARGE_DISCOUNT_THRESHOLD) return can('apply_large_discount');
    return true;
  };

  return {
    role,
    can,
    canApplyDiscount,
    isAdmin: role === 'owner',
    isManager: role === 'owner' || role === 'manager',
    isCashier: true, // all authenticated users can use POS
  };
}
