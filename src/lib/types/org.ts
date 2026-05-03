export type OrgRole = 'owner' | 'manager' | 'cashier' | 'accountant' | 'viewer';

export type Permission =
  // Dashboard
  | 'dashboard.view'
  // POS
  | 'pos.access'
  | 'pos.void_transaction'
  | 'pos.process_return'
  | 'pos.apply_discount'
  | 'pos.apply_large_discount'
  | 'pos.credit_sale'
  | 'pos.close_shift'
  | 'pos.open_shift'
  | 'pos.change_settings'
  | 'pos.hold_cart'
  | 'pos.change_bill_type'
  // Inventory
  | 'inventory.view'
  | 'inventory.create'
  | 'inventory.edit'
  | 'inventory.delete'
  | 'inventory.adjust_stock'
  | 'inventory.transfer'
  // Categories
  | 'categories.view'
  | 'categories.create'
  | 'categories.edit'
  | 'categories.delete'
  // Procurement
  | 'procurement.view'
  | 'procurement.create'
  | 'procurement.edit'
  | 'procurement.delete'
  // Customers
  | 'customers.view'
  | 'customers.create'
  | 'customers.edit'
  | 'customers.delete'
  // Vendors
  | 'vendors.view'
  | 'vendors.create'
  | 'vendors.edit'
  | 'vendors.delete'
  // Expenses
  | 'expenses.view'
  | 'expenses.create'
  | 'expenses.edit'
  | 'expenses.delete'
  // Reports
  | 'reports.view'
  | 'reports.sales'
  | 'reports.performance'
  | 'reports.daily'
  // Settings
  | 'settings.view'
  | 'settings.team'
  | 'settings.invites'
  | 'settings.org'
  // Audit
  | 'audit.view';

export interface Organization {
  id: string;
  name: string;
  created_by: string;
  created_at: Date;
  updated_at: Date;
  settings?: OrganizationSettings;
}

export interface OrganizationSettings {
  custom_units?: { name: string; symbol: string; active: boolean }[];
  disabled_payment_methods?: string[];
  custom_bill_types?: { name: string; code: string; affects_inventory: boolean; affects_accounting: boolean }[];
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrgRole;
  permissions_overrides?: Record<Permission, boolean>;
  status: 'active' | 'inactive' | 'pending';
  joined_at: Date;
  invited_by?: string;
  // Denormalized for display
  user_name?: string;
  user_email?: string;
  user_avatar?: string;
}

export interface Invite {
  id: string;
  organization_id: string;
  email: string;
  role: OrgRole;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  created_by: string;
  created_at: Date;
  expires_at: Date;
  accepted_at?: Date;
  // Denormalized
  organization_name?: string;
  inviter_name?: string;
}
