import { Item } from '../types';

export function checkLowStockNotifications(items: Item[]): string[] {
  const notifications: string[] = [];
  
  items.forEach(item => {
    if (item.quantity <= item.reorder_point) {
      if (item.quantity === 0) {
        notifications.push(`${item.name} is out of stock!`);
      } else {
        notifications.push(`${item.name} is running low (${item.quantity} ${item.unit} remaining)`);
      }
    }
  });
  
  return notifications;
}

import { formatCurrencyWithCode } from './currency';
import { useAuthStore } from '../store';
import { getPOSSettings } from '../api/pos';

export async function formatCurrency(amount: number, currency?: string): Promise<string> {
  // Get user's preferred currency if not specified
  if (!currency) {
    try {
      // Try to get currency from POS settings first
      const posSettings = await getPOSSettings();
      currency = posSettings.currency;
    } catch (error) {
      // Fallback to user profile currency
      const profile = useAuthStore.getState().profile;
      currency = profile?.preferred_currency || 'USD';
    }
  }
  
  return formatCurrencyWithCode(amount, currency);
}

// Synchronous version for immediate use
export function formatCurrencySync(amount: number, currency?: string): string {
  if (!currency) {
    const profile = useAuthStore.getState().profile;
    currency = profile?.preferred_currency || 'USD';
  }
  
  return formatCurrencyWithCode(amount, currency);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

export function formatDate(date: Date | any): string {
  const dateObj = date.toDate ? date.toDate() : new Date(date);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj);
}

export function calculateInventoryValue(items: Item[]): number {
  return items.reduce((total, item) => total + (item.quantity * item.unit_price), 0);
}

export function getInventoryStats(items: Item[]) {
  const totalItems = items.length;
  const totalValue = calculateInventoryValue(items);
  const lowStockItems = items.filter(item => item.quantity <= item.reorder_point);
  const outOfStockItems = items.filter(item => item.quantity === 0);
  
  return {
    totalItems,
    totalValue,
    lowStockCount: lowStockItems.length,
    outOfStockCount: outOfStockItems.length,
    averageValue: totalItems > 0 ? totalValue / totalItems : 0,
  };
}