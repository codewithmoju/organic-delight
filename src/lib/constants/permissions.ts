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

// ── Permission Metadata ──────────────────────────────────────────────────────

export interface PermissionMeta {
  label: string;
  description: string;
  category: string;
}

export const PERMISSION_METADATA: Record<Permission, PermissionMeta> = {
  // Dashboard
  'dashboard.view': { label: 'View Dashboard', description: 'Access the main dashboard with sales charts, stock alerts, and business overview.', category: 'Dashboard' },

  // POS
  'pos.access': { label: 'Access POS', description: 'Open the point-of-sale screen to process sales and take payments.', category: 'Point of Sale' },
  'pos.void_transaction': { label: 'Void Transactions', description: 'Cancel and void completed POS transactions. Requires a reason.', category: 'Point of Sale' },
  'pos.process_return': { label: 'Process Returns', description: 'Handle customer returns and issue refunds from the POS.', category: 'Point of Sale' },
  'pos.apply_discount': { label: 'Apply Discount', description: 'Apply percentage or fixed discounts to items in the cart.', category: 'Point of Sale' },
  'pos.apply_large_discount': { label: 'Apply Large Discount', description: 'Apply discounts above the threshold (10%+). Requires manager approval.', category: 'Point of Sale' },
  'pos.credit_sale': { label: 'Credit Sales', description: 'Create sales on credit without immediate payment. Tracks customer balance.', category: 'Point of Sale' },
  'pos.close_shift': { label: 'Close Shift', description: 'End a POS session and generate the shift closing report with cash count.', category: 'Point of Sale' },
  'pos.open_shift': { label: 'Open Shift', description: 'Start a new POS session with an opening cash drawer count.', category: 'Point of Sale' },
  'pos.change_settings': { label: 'POS Settings', description: 'Modify POS configuration like printer, receipt template, and shortcuts.', category: 'Point of Sale' },
  'pos.hold_cart': { label: 'Hold Cart', description: 'Save the current cart for later and serve another customer.', category: 'Point of Sale' },
  'pos.change_bill_type': { label: 'Change Bill Type', description: 'Switch between bill types (e.g., standard, return, exchange) during checkout.', category: 'Point of Sale' },

  // Inventory
  'inventory.view': { label: 'View Inventory', description: 'Browse and search the product catalog, stock levels, and item details.', category: 'Inventory' },
  'inventory.create': { label: 'Create Items', description: 'Add new products to the inventory with pricing, SKU, and stock info.', category: 'Inventory' },
  'inventory.edit': { label: 'Edit Items', description: 'Update product details, pricing, descriptions, and stock thresholds.', category: 'Inventory' },
  'inventory.delete': { label: 'Delete Items', description: 'Remove products from inventory. Items with transactions are archived instead.', category: 'Inventory' },
  'inventory.adjust_stock': { label: 'Adjust Stock', description: 'Perform stock adjustments to correct quantities (damaged, expired, count correction).', category: 'Inventory' },
  'inventory.transfer': { label: 'Transfer Stock', description: 'Move stock between locations or warehouses.', category: 'Inventory' },

  // Categories
  'categories.view': { label: 'View Categories', description: 'Browse product categories and their organization.', category: 'Categories' },
  'categories.create': { label: 'Create Categories', description: 'Add new product categories to organize your inventory.', category: 'Categories' },
  'categories.edit': { label: 'Edit Categories', description: 'Rename categories and update their properties.', category: 'Categories' },
  'categories.delete': { label: 'Delete Categories', description: 'Remove categories. Items in the category become uncategorized.', category: 'Categories' },

  // Procurement
  'procurement.view': { label: 'View Purchases', description: 'Browse purchase orders and procurement history.', category: 'Procurement' },
  'procurement.create': { label: 'Create Purchases', description: 'Create new purchase orders to restock inventory from vendors.', category: 'Procurement' },
  'procurement.edit': { label: 'Edit Purchases', description: 'Modify existing purchase orders before they are finalized.', category: 'Procurement' },
  'procurement.delete': { label: 'Delete Purchases', description: 'Remove purchase orders. Only draft orders can be deleted.', category: 'Procurement' },

  // Customers
  'customers.view': { label: 'View Customers', description: 'Browse customer profiles, contact info, and purchase history.', category: 'Customers' },
  'customers.create': { label: 'Create Customers', description: 'Add new customer profiles with contact and billing details.', category: 'Customers' },
  'customers.edit': { label: 'Edit Customers', description: 'Update customer information, addresses, and credit limits.', category: 'Customers' },
  'customers.delete': { label: 'Delete Customers', description: 'Remove customer profiles from the system.', category: 'Customers' },

  // Vendors
  'vendors.view': { label: 'View Vendors', description: 'Browse vendor/supplier profiles and contact information.', category: 'Vendors' },
  'vendors.create': { label: 'Create Vendors', description: 'Add new vendor/supplier profiles with contact and payment terms.', category: 'Vendors' },
  'vendors.edit': { label: 'Edit Vendors', description: 'Update vendor details, payment terms, and contact information.', category: 'Vendors' },
  'vendors.delete': { label: 'Delete Vendors', description: 'Remove vendor profiles from the system.', category: 'Vendors' },

  // Expenses
  'expenses.view': { label: 'View Expenses', description: 'Browse expense records and spending history.', category: 'Expenses' },
  'expenses.create': { label: 'Create Expenses', description: 'Record new business expenses with category, amount, and receipt.', category: 'Expenses' },
  'expenses.edit': { label: 'Edit Expenses', description: 'Update expense details, amounts, and categories.', category: 'Expenses' },
  'expenses.delete': { label: 'Delete Expenses', description: 'Remove expense records from the system.', category: 'Expenses' },

  // Reports
  'reports.view': { label: 'View Reports', description: 'Access the reports section and view basic analytics.', category: 'Reports' },
  'reports.sales': { label: 'Sales Reports', description: 'View detailed sales reports with revenue, trends, and breakdowns.', category: 'Reports' },
  'reports.performance': { label: 'Performance Reports', description: 'View staff performance metrics, sales targets, and productivity.', category: 'Reports' },
  'reports.daily': { label: 'Daily Reports', description: 'Access daily summary reports with transactions, revenue, and stock changes.', category: 'Reports' },

  // Settings
  'settings.view': { label: 'View Settings', description: 'Access the settings page to view organization configuration.', category: 'Settings' },
  'settings.team': { label: 'Manage Team', description: 'View and manage team members, roles, and invitations.', category: 'Settings' },
  'settings.invites': { label: 'Send Invites', description: 'Invite new team members to join the organization.', category: 'Settings' },
  'settings.org': { label: 'Organization Settings', description: 'Modify organization name, preferences, billing, and critical settings.', category: 'Settings' },

  // Audit
  'audit.view': { label: 'View Audit Log', description: 'Access the audit trail showing all actions performed by team members.', category: 'Audit' },
};

/** Get human-readable label for a permission */
export function getPermissionLabel(perm: Permission): string {
  return PERMISSION_METADATA[perm]?.label ?? perm;
}

/** Get tooltip description for a permission */
export function getPermissionDescription(perm: Permission): string {
  return PERMISSION_METADATA[perm]?.description ?? '';
}

/** Get category for a permission */
export function getPermissionCategory(perm: Permission): string {
  return PERMISSION_METADATA[perm]?.category ?? 'Other';
}

/** Group permissions by category */
export function getPermissionsByCategory(): Record<string, Permission[]> {
  const groups: Record<string, Permission[]> = {};
  for (const [perm, meta] of Object.entries(PERMISSION_METADATA)) {
    if (!groups[meta.category]) groups[meta.category] = [];
    groups[meta.category].push(perm as Permission);
  }
  return groups;
}

/** Friendly role descriptions */
export const ROLE_DESCRIPTIONS: Record<OrgRole, string> = {
  owner: 'Full access to everything. Can manage billing, delete the organization, and assign roles.',
  manager: 'Almost full access. Can manage inventory, team, and sales. Cannot delete org or manage billing.',
  cashier: 'POS-focused role. Can process sales, apply discounts, and view inventory. Cannot modify stock or access reports.',
  accountant: 'Finance-focused role. Can manage expenses, view procurement, and access all reports. No POS or inventory editing.',
  viewer: 'Read-only access. Can browse inventory, customers, vendors, and reports. Cannot make changes.',
};

/** Friendly role display names */
export const ROLE_LABELS: Record<OrgRole, string> = {
  owner: 'Owner',
  manager: 'Manager',
  cashier: 'Cashier',
  accountant: 'Accountant',
  viewer: 'Viewer',
};

/** Role icons and colors for visual display */
export const ROLE_STYLE: Record<OrgRole, { color: string; bgColor: string; borderColor: string }> = {
  owner: { color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/30' },
  manager: { color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/30' },
  cashier: { color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/30' },
  accountant: { color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/30' },
  viewer: { color: 'text-slate-600 dark:text-slate-400', bgColor: 'bg-slate-500/10', borderColor: 'border-slate-500/30' },
};
