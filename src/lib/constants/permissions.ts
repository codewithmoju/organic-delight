import type { OrgRole, Permission } from '../types/org';

export const ROLE_PERMISSIONS: Record<OrgRole, Set<Permission>> = {
  owner: new Set<Permission>([
    'dashboard.view',
    'pos.access', 'pos.void_transaction', 'pos.process_return', 'pos.apply_discount',
    'pos.apply_large_discount', 'pos.credit_sale', 'pos.close_shift', 'pos.open_shift',
    'pos.change_settings', 'pos.hold_cart', 'pos.change_bill_type',
    'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.delete',
    'inventory.adjust_stock', 'inventory.transfer',
    'categories.view', 'categories.create', 'categories.edit', 'categories.delete',
    'procurement.view', 'procurement.create', 'procurement.edit', 'procurement.delete',
    'customers.view', 'customers.create', 'customers.edit', 'customers.delete',
    'vendors.view', 'vendors.create', 'vendors.edit', 'vendors.delete',
    'expenses.view', 'expenses.create', 'expenses.edit', 'expenses.delete',
    'reports.view', 'reports.sales', 'reports.performance', 'reports.daily',
    'settings.view', 'settings.team', 'settings.invites', 'settings.org',
    'audit.view',
  ]),

  manager: new Set<Permission>([
    'dashboard.view',
    'pos.access', 'pos.process_return', 'pos.apply_discount',
    'pos.apply_large_discount', 'pos.credit_sale', 'pos.close_shift', 'pos.open_shift',
    'pos.hold_cart', 'pos.change_bill_type',
    'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.delete',
    'inventory.adjust_stock', 'inventory.transfer',
    'categories.view', 'categories.create', 'categories.edit', 'categories.delete',
    'procurement.view', 'procurement.create', 'procurement.edit', 'procurement.delete',
    'customers.view', 'customers.create', 'customers.edit', 'customers.delete',
    'vendors.view', 'vendors.create', 'vendors.edit', 'vendors.delete',
    'expenses.view', 'expenses.create', 'expenses.edit', 'expenses.delete',
    'reports.view', 'reports.sales', 'reports.performance', 'reports.daily',
    'settings.view', 'settings.team', 'settings.invites',
    'audit.view',
  ]),

  cashier: new Set<Permission>([
    'dashboard.view',
    'pos.access', 'pos.apply_discount', 'pos.open_shift', 'pos.hold_cart',
    'inventory.view',
    'categories.view',
    'customers.view', 'customers.create',
    'reports.view',
  ]),

  accountant: new Set<Permission>([
    'dashboard.view',
    'inventory.view',
    'categories.view',
    'procurement.view',
    'customers.view',
    'vendors.view',
    'expenses.view', 'expenses.create', 'expenses.edit',
    'reports.view', 'reports.sales', 'reports.performance', 'reports.daily',
  ]),

  viewer: new Set<Permission>([
    'dashboard.view',
    'inventory.view',
    'categories.view',
    'customers.view',
    'vendors.view',
    'reports.view',
  ]),
};

export const LARGE_DISCOUNT_THRESHOLD = 10; // %

export function getRolePermissions(role: OrgRole): Set<Permission> {
  return ROLE_PERMISSIONS[role] ?? ROLE_PERMISSIONS.viewer;
}
