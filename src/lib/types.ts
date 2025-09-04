export interface Item {
  id: string;
  name: string;
  description: string;
  category_id: string;
  created_at: Date;
  updated_at: Date;
  created_by: string;
  category?: Category;
  // Stock tracking fields (calculated from transactions)
  current_quantity?: number;
  average_unit_cost?: number;
  last_transaction_date?: Date;
  total_value?: number;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  created_at: Date;
  updated_at: Date;
  created_by: string;
  color?: string;
  item_count?: number;
}

export interface Transaction {
  id: string;
  item_id: string;
  type: 'stock_in' | 'stock_out';
  quantity: number;
  unit_price: number;
  total_value: number; // quantity × unit_price
  transaction_date: Date;
  supplier_customer: string; // Supplier for stock_in, Customer for stock_out
  reference_number?: string;
  notes?: string;
  created_at: Date;
  created_by: string;
  item?: Item;
}

export interface StockLevel {
  item_id: string;
  current_quantity: number;
  average_unit_cost: number;
  last_transaction_date: Date;
  total_value: number;
  item?: Item;
}

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  preferred_currency: string;
  created_at: Date;
  updated_at: Date;
  role?: 'admin' | 'manager' | 'user';
  company?: string;
  phone?: string;
}

export interface DashboardMetrics {
  totalStockIn: number;
  totalStockOut: number;
  revenueSpentOnStockIn: number;
  revenueEarnedFromStockOut: number;
}

export const SUPPORTED_CURRENCIES = [
  { code: 'USD', symbol: '$' },
  { code: 'PKR', symbol: '₨' },
  { code: 'EUR', symbol: '€' },
  { code: 'GBP', symbol: '£' },
  { code: 'JPY', symbol: '¥' },
  { code: 'CAD', symbol: 'C$' },
  { code: 'AUD', symbol: 'A$' },
  { code: 'CHF', symbol: 'CHF' },
  { code: 'CNY', symbol: '¥' },
  { code: 'INR', symbol: '₹' },
];

export const SUPPORTED_UNITS = [
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'g', label: 'Grams (g)' },
  { value: 'lbs', label: 'Pounds (lbs)' },
  { value: 'oz', label: 'Ounces (oz)' },
  { value: 'pieces', label: 'Pieces' },
  { value: 'units', label: 'Units' },
  { value: 'liters', label: 'Liters (L)' },
  { value: 'ml', label: 'Milliliters (mL)' },
  { value: 'boxes', label: 'Boxes' },
  { value: 'packs', label: 'Packs' },
];

export const CATEGORY_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6366f1'
];