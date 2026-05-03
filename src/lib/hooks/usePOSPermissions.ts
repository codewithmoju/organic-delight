import { useAuthStore } from '../store';

/**
 * POS permission levels by role:
 *
 * admin   — full access: void, refund, discounts, settings, reports, shift close
 * manager — most access: discounts, refunds, shift close; cannot void or change settings
 * user    — basic cashier: sell, hold cart, basic discounts only; no void/refund/settings
 */

export type POSPermission =
  | 'void_transaction'      // admin only
  | 'process_return'        // admin + manager
  | 'apply_discount'        // all roles
  | 'apply_large_discount'  // admin + manager (discount > threshold)
  | 'credit_sale'           // admin + manager
  | 'close_shift'           // admin + manager
  | 'open_shift'            // all roles
  | 'view_reports'          // admin + manager
  | 'change_settings'       // admin only
  | 'hold_cart'             // all roles
  | 'change_bill_type'      // admin + manager

const LARGE_DISCOUNT_THRESHOLD = 10; // % — discounts above this need manager+

const ROLE_PERMISSIONS: Record<string, Set<POSPermission>> = {
  admin: new Set([
    'void_transaction', 'process_return', 'apply_discount', 'apply_large_discount',
    'credit_sale', 'close_shift', 'open_shift', 'view_reports',
    'change_settings', 'hold_cart', 'change_bill_type',
  ]),
  manager: new Set([
    'process_return', 'apply_discount', 'apply_large_discount',
    'credit_sale', 'close_shift', 'open_shift', 'view_reports',
    'hold_cart', 'change_bill_type',
  ]),
  user: new Set([
    'apply_discount', 'open_shift', 'hold_cart',
  ]),
};

export function usePOSPermissions() {
  const profile = useAuthStore(s => s.profile);
  const role = profile?.role ?? 'user';
  const permissions = ROLE_PERMISSIONS[role] ?? ROLE_PERMISSIONS.user;

  const can = (permission: POSPermission): boolean => permissions.has(permission);

  const canApplyDiscount = (discountPercent: number): boolean => {
    if (!can('apply_discount')) return false;
    if (discountPercent > LARGE_DISCOUNT_THRESHOLD) return can('apply_large_discount');
    return true;
  };

  return {
    role,
    can,
    canApplyDiscount,
    isAdmin: role === 'admin',
    isManager: role === 'manager' || role === 'admin',
    isCashier: true, // all authenticated users can use POS
  };
}
