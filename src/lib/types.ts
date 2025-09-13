export interface Item {
  id: string;
  name: string;
  description: string;
  category_id: string;
  created_at: Date;
  updated_at: Date;
  created_by: string;
  is_archived?: boolean;
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
  theme: 'light' | 'dark' | 'system';
  updated_at: Date;
  role?: 'admin' | 'manager' | 'user';
  company?: string;
  phone?: string;
  avatar_url?: string;
  address?: string;
  language?: string;
  theme?: 'light' | 'dark' | 'system';
  notifications_enabled?: boolean;
  email_notifications?: boolean;
  push_notifications?: boolean;
  two_factor_enabled?: boolean;
  timezone?: string;
}

export interface DashboardMetrics {
  totalStockIn: number;
  totalStockOut: number;
  revenueSpentOnStockIn: number;
  revenueEarnedFromStockOut: number;
}

export const SUPPORTED_CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', flag: '🇨🇦' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', flag: '🇨🇭' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', flag: '🇨🇳' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳' },
  { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee', flag: '🇵🇰' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', flag: '🇸🇬' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', flag: '🇭🇰' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', flag: '🇸🇪' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone', flag: '🇳🇴' },
  { code: 'DKK', symbol: 'kr', name: 'Danish Krone', flag: '🇩🇰' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', flag: '🇳🇿' },
  { code: 'MXN', symbol: '$', name: 'Mexican Peso', flag: '🇲🇽' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', flag: '🇧🇷' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand', flag: '🇿🇦' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won', flag: '🇰🇷' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', flag: '🇸🇬' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', flag: '🇭🇰' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', flag: '🇸🇪' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone', flag: '🇳🇴' },
  { code: 'DKK', symbol: 'kr', name: 'Danish Krone', flag: '🇩🇰' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', flag: '🇳🇿' },
  { code: 'MXN', symbol: '$', name: 'Mexican Peso', flag: '🇲🇽' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', flag: '🇧🇷' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand', flag: '🇿🇦' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won', flag: '🇰🇷' },
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

// POS System Types
export interface POSTransaction {
  id: string;
  transaction_number: string;
  items: POSTransactionItem[];
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  payment_method: 'cash' | 'card' | 'digital';
  payment_amount: number;
  change_amount: number;
  cashier_id: string;
  customer_name?: string;
  customer_phone?: string;
  created_at: Date;
  status: 'completed' | 'cancelled' | 'refunded';
  receipt_printed: boolean;
  notes?: string;
}

export interface POSTransactionItem {
  id: string;
  item_id: string;
  item_name: string;
  barcode?: string;
  unit_price: number;
  quantity: number;
  line_total: number;
  discount_amount?: number;
  tax_rate?: number;
}

export interface CartItem {
  id: string;
  item_id: string;
  name: string;
  barcode?: string;
  unit_price: number;
  quantity: number;
  line_total: number;
  available_stock: number;
  category?: string;
}

export interface BarcodeProduct {
  id: string;
  name: string;
  barcode: string;
  price: number;
  stock: number;
  category?: string;
}

export interface POSSettings {
  store_name: string;
  store_address: string;
  store_phone: string;
  tax_rate: number;
  currency: string;
  receipt_footer_message: string;
  auto_print_receipt: boolean;
  barcode_scanner_enabled: boolean;
  thermal_printer_enabled: boolean;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'cash' | 'card' | 'digital';
  enabled: boolean;
  icon: string;
}

export interface SalesReport {
  date: Date;
  total_sales: number;
  total_transactions: number;
  average_transaction: number;
  top_selling_items: Array<{
    item_name: string;
    quantity_sold: number;
    revenue: number;
  }>;
  payment_methods: Array<{
    method: string;
    count: number;
    amount: number;
  }>;
}