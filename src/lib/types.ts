import { Timestamp } from 'firebase/firestore';

export interface Item {
  id: string;
  name: string;
  description: string | null;
  categoryId: string | null;
  quantity: number;
  unit: 'kg' | 'g' | 'lbs' | 'oz' | 'pieces' | 'units';
  currency: string;
  unitPrice: number;
  reorderPoint: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  category?: Category;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

export interface Transaction {
  id: string;
  itemId: string;
  quantityChanged: number;
  type: 'in' | 'out';
  notes: string | null;
  createdAt: Timestamp;
  createdBy: string;
  item?: Item;
}

export interface Profile {
  id: string;
  fullName: string;
  email: string;
  preferredCurrency: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Notification {
  id: string;
  message: string;
  type: 'low_stock' | 'system';
  isRead: boolean;
  createdAt: Timestamp;
}

export const SUPPORTED_CURRENCIES = [
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
  { code: 'GBP', symbol: '£' },
  { code: 'JPY', symbol: '¥' },
  { code: 'PKR', symbol: 'Rs' }
];

export const SUPPORTED_UNITS = [
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'g', label: 'Grams (g)' },
  { value: 'lbs', label: 'Pounds (lbs)' },
  { value: 'oz', label: 'Ounces (oz)' },
  { value: 'pieces', label: 'Pieces' },
  { value: 'units', label: 'Units' }
];