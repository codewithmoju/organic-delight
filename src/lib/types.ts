export interface ItemLocation {
  shelf: string;
  rack?: string;
  bin?: string;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  category_id: string;
  created_at: Date;
  updated_at: Date;
  created_by: string;
  organization_id?: string;
  is_archived?: boolean;
  category?: Category;
  // Stock tracking fields (calculated from transactions)
  current_quantity?: number;
  average_unit_cost?: number;
  last_transaction_date?: Date;
  total_value?: number;
  low_stock_threshold?: number;
  unit?: string; // Unit of measurement (e.g., 'kg', 'pcs')

  // Pricing and Location
  base_price?: number;
  selling_price?: number;
  purchase_rate?: number;
  sale_rate?: number;
  location?: string | ItemLocation;

  // Legacy/Compatibility fields (mapped to new fields or optional)
  quantity?: number; // Mapped to current_quantity
  reorder_point?: number; // Mapped to low_stock_threshold
  sku?: string;
  barcode?: string;
  unit_price?: number; // Mapped to average_unit_cost or separate selling price
}

export interface Category {
  id: string;
  name: string;
  description: string;
  created_at: Date;
  updated_at: Date;
  created_by: string;
  organization_id?: string;
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
  organization_id?: string;
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
  created_by_admin?: boolean;
  company?: string;
  phone?: string;
  phone_number?: string;
  avatar_url?: string;
  address?: string;
  language?: string;
  theme?: 'light' | 'dark' | 'system';
  notifications_enabled?: boolean;
  email_notifications?: boolean;
  push_notifications?: boolean;
  two_factor_enabled?: boolean;
  timezone?: string;

  // Business Personalization Fields
  business_name?: string;
  business_type?: string;          // Electronics, Grocery, Clothing, etc.
  business_tagline?: string;
  business_logo?: string;          // Base64 encoded image
  business_address?: string;
  business_city?: string;
  business_country?: string;
  business_phone?: string;
  business_email?: string;
  tax_number?: string;             // GST/Tax ID
  receipt_header?: string;         // Custom header message for receipts
  receipt_footer?: string;         // Custom footer message for receipts
}

export interface DashboardMetrics {
  totalStockIn: number;
  totalStockOut: number;
  revenueSpentOnStockIn: number;
  revenueEarnedFromStockOut: number;
}

export const SUPPORTED_CURRENCIES = [
  { code: 'PKR', symbol: 'PKR ', name: 'Pakistani Rupee', flag: '🇵🇰' },
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
  organization_id?: string;
  customer_name?: string | null;
  customer_phone?: string | null;
  created_at: Date;
  status: 'completed' | 'cancelled' | 'refunded' | 'voided';
  receipt_printed: boolean;
  bill_type?: string;
  affects_inventory?: boolean;
  affects_accounting?: boolean;
  is_return?: boolean;
  notes?: string | null;
  void_reason?: string;
  voided_at?: Date;
  voided_by?: string;
}

export interface POSTransactionItem {
  id: string;
  item_id: string;
  item_name: string;
  barcode?: string | null;
  unit_price: number;
  quantity: number;
  line_total: number;
  discount_amount?: number;
  purchase_rate?: number;
  tax_rate?: number;
  unit?: string;
}

export interface CartItem {
  id: string;
  item_id: string;
  name: string;
  barcode?: string;
  sku?: string;
  unit_price: number;
  base_price?: number;
  default_selling_price?: number;
  is_price_overridden?: boolean;
  quantity: number;
  line_total: number;
  available_stock: number;
  category?: string;
  unit?: string;
}

export interface BarcodeProduct {
  id: string;
  name: string;
  barcode: string;
  sku?: string;
  price: number;
  base_price?: number;
  selling_price?: number;
  stock: number;
  category?: string;
  unit?: string;
}

export interface POSSettings {
  store_name: string;
  store_address: string;
  store_phone: string;
  store_email?: string;
  store_website?: string;
  store_city?: string;
  store_country?: string;
  tax_rate: number;
  tax_number?: string;
  currency: string;
  receipt_header_message?: string;
  receipt_footer_message: string;
  auto_print_receipt: boolean;
  barcode_scanner_enabled: boolean;
  thermal_printer_enabled: boolean;
  quick_access_items?: string[];
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

// ============================================
// VENDOR MANAGEMENT TYPES
// ============================================

export interface Vendor {
  id: string;
  name: string;
  company: string;
  phone: string;
  email?: string;
  address?: string;
  gst_number?: string;
  outstanding_balance: number; // Amount owed to vendor
  total_purchases: number;
  created_at: Date;
  updated_at: Date;
  created_by: string;
  organization_id?: string;
  is_active: boolean;
}

export interface VendorPayment {
  id: string;
  vendor_id: string;
  amount: number;
  payment_method: 'cash' | 'bank_transfer' | 'cheque';
  reference_number?: string;
  notes?: string;
  payment_date: Date;
  created_at: Date;
  created_by: string;
  organization_id?: string;
}

// ============================================
// PURCHASE MANAGEMENT TYPES
// ============================================

export interface Purchase {
  id: string;
  purchase_number: string;
  bill_number?: string | null;
  vendor_id: string;
  vendor_name: string;
  items: PurchaseItem[];
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  payment_status: 'paid' | 'partial' | 'unpaid';
  paid_amount: number;
  pending_amount: number;
  purchase_date: Date;
  created_at: Date;
  created_by: string;
  organization_id?: string;
  notes?: string | null;
  // Delivery tracking
  delivery_status?: 'pending' | 'partial' | 'received';
  delivered_at?: Date | null;
  delivery_notes?: string | null;
}

export interface PurchaseItem {
  id: string;
  item_id: string;
  item_name: string;
  barcode?: string | null;
  quantity: number;
  received_quantity?: number; // for partial delivery tracking
  purchase_rate: number;
  sale_rate: number;
  expiry_date?: Date | null;
  shelf_location?: string | null;
  line_total: number;
  batch_number?: string | null;
  lot_number?: string | null;
  serial_numbers?: string[] | null;
}

// ============================================
// CUSTOMER CREDIT (UDHAAR) TYPES
// ============================================

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  outstanding_balance: number;
  total_purchases: number;
  credit_limit?: number;        // 0 or undefined = no limit
  group_id?: string;            // customer group/segment
  created_at: Date;
  updated_at: Date;
  created_by: string;
  organization_id?: string;
  is_active: boolean;
}

export interface CustomerPayment {
  id: string;
  customer_id: string;
  type?: 'payment' | 'charge'; // Default 'payment'
  amount: number;
  payment_method: 'cash' | 'bank_transfer' | 'digital' | 'adjustment' | 'opening_balance';
  reference_number?: string;
  notes?: string;
  payment_date: Date;
  created_at: Date;
  created_by: string;
  organization_id?: string;
}

// ============================================
// ENHANCED ITEM TYPES
// ============================================

export interface EnhancedItem extends Item {
  location?: ItemLocation;

  // Retail identifiers
  sku?: string;                    // Unique product code (e.g., PROD-123456-A7F3)
  barcode?: string;                // For POS scanning (EAN-13, UPC, etc.)

  // Dual pricing system
  base_price?: number;             // Cost/reference floor price
  selling_price?: number;          // Current selling price (canonical)
  purchase_rate?: number;          // Last cost from vendor
  sale_rate?: number;              // Current selling price
  unit_price?: number;             // Deprecated: use sale_rate instead

  // Legacy fields (for backward compatibility)
  last_purchase_rate?: number;     // Deprecated: use purchase_rate
  last_sale_rate?: number;         // Deprecated: use sale_rate
  custom_barcode?: string;         // Deprecated: use barcode

  // Stock management
  reorder_point?: number;          // Minimum stock level before reorder
  quantity?: number;               // Current stock quantity (calculated)

  // Batch/Lot tracking
  batch_number?: string;
  lot_number?: string;

  // Serial number tracking
  serial_numbers?: string[]; // array of serial numbers for serialized items
  is_serialized?: boolean;   // if true, track individual serial numbers
}

// ============================================
// EXPENSE TRACKING TYPES
// ============================================

export interface Expense {
  id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  expense_date: Date;
  payment_method: 'cash' | 'bank_transfer' | 'digital';
  reference_number?: string;
  notes?: string;
  created_at: Date;
  created_by: string;
  organization_id?: string;
}

export type ExpenseCategory =
  | 'rent'
  | 'utilities'
  | 'salaries'
  | 'supplies'
  | 'maintenance'
  | 'transport'
  | 'marketing'
  | 'taxes'
  | 'miscellaneous';

export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string; icon: string }[] = [
  { value: 'rent', label: 'Rent', icon: '🏠' },
  { value: 'utilities', label: 'Utilities (Electric/Gas/Water)', icon: '💡' },
  { value: 'salaries', label: 'Salaries & Wages', icon: '👥' },
  { value: 'supplies', label: 'Office Supplies', icon: '📦' },
  { value: 'maintenance', label: 'Maintenance & Repairs', icon: '🔧' },
  { value: 'transport', label: 'Transport & Delivery', icon: '🚚' },
  { value: 'marketing', label: 'Marketing & Advertising', icon: '📢' },
  { value: 'taxes', label: 'Taxes & Fees', icon: '💰' },
  { value: 'miscellaneous', label: 'Miscellaneous', icon: '📝' },
];

// ============================================
// ENHANCED POS TRANSACTION TYPES
// ============================================

export interface BillType {
  id: string;
  name: string;
  code: string;
  affects_inventory: boolean;
  affects_accounting: boolean;
  is_default?: boolean;
  description?: string;
  active: boolean;
}

export interface EnhancedPOSTransaction extends POSTransaction {
  bill_type: string;

  customer_id?: string;
  is_credit_sale: boolean;
  profit_discount: number;  // Discount calculated from profit margin
  price_discount: number;   // Direct discount from sale price
  original_profit: number;  // For profit margin tracking
  cost_of_goods: number;    // Total cost price of items
}

export interface ReturnItem {
  pos_item_id: string;
  item_id: string;
  item_name: string;
  quantity_to_return: number;
  unit_price: number;
  refund_amount: number;
}

export interface POSReturn {
  id: string;
  return_number: string;
  original_transaction_id: string;
  original_transaction_number: string;
  items: ReturnItem[];
  total_refund: number;
  refund_method: 'cash' | 'store_credit';
  reason: string;
  created_at: Date;
  created_by: string;
  organization_id?: string;
}

// ============================================
// DAILY OPERATIONS REPORT TYPES
// ============================================

export interface DailyOperationsReport {
  date: Date;
  cash_sales: number;
  credit_sales: number;
  card_sales: number;
  digital_sales: number;
  total_sales: number;
  total_discounts: number;
  total_returns: number;
  total_expenses: number;
  total_purchases: number;
  vendor_payments: number;
  customer_collections: number;
  cash_on_hand: number;
  gross_profit: number;
  net_profit: number;
  transactions_count: number;
  returns_count: number;
  average_transaction_value: number;
}

// ============================================
// KEYBOARD SHORTCUT TYPES
// ============================================

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  description: string;
  action: () => void;
}