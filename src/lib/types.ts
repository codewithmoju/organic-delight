import { Timestamp } from 'firebase/firestore';

export interface Item {
  id: string;
  name: string;
  description: string | null;
  category_id: string | null;
  quantity: number;
  unit: 'kg' | 'g' | 'lbs' | 'oz' | 'pieces' | 'units';
  currency: string;
  unit_price: number;
  reorder_point: number;
  created_at: Timestamp;
  updated_at: Timestamp;
  created_by: string;
  category?: Category;
  sku?: string;
  barcode?: string;
  supplier?: string;
  location?: string;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
  created_by: string;
  color?: string;
}

export interface Transaction {
  id: string;
  item_id: string;
  quantity_changed: number;
  type: 'in' | 'out';
  notes: string | null;
  created_at: Timestamp;
  created_by: string;
  item?: Item;
  reference?: string;
  cost_per_unit?: number;
}

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  preferred_currency: string;
  created_at: Timestamp;
  updated_at: Timestamp;
  role?: 'admin' | 'manager' | 'user';
  company?: string;
  phone?: string;
}

export interface Notification {
  id: string;
  message: string;
  type: 'low_stock' | 'system';
  is_read: boolean;
  created_at: Timestamp;
  user_id: string;
}

export interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

export interface DashboardMetrics {
  totalStockIn: number;
  totalStockOut: number;
  revenueSpentOnStockIn: number;
  revenueEarnedFromStockOut: number;
}

export interface ExportOptions {
  format: 'csv' | 'json' | 'xlsx';
  includeTransactions: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
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