import { Item } from '../types';

export function checkLowStockNotifications(items: Item[]): string[] {
  const notifications: string[] = [];

  items.forEach(item => {
    const quantity = item.current_quantity || item.quantity || 0;
    const threshold = item.low_stock_threshold || item.reorder_point || 0;

    if (quantity <= threshold) {
      if (quantity === 0) {
        notifications.push(`${item.name} is out of stock!`);
      } else {
        notifications.push(`${item.name} is running low (${quantity} ${item.unit || 'units'} remaining)`);
      }
    }
  });

  return notifications;
}

import { formatCurrencyWithCode } from './currency';
import { useAuthStore } from '../store';

export function formatCurrency(amount: number, currency?: string): string {
  // Get user's preferred currency if not specified
  if (!currency) {
    const profile = useAuthStore.getState().profile;
    currency = profile?.preferred_currency || 'PKR';
  }

  return formatCurrencyWithCode(amount, currency);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

export function formatDate(date: Date | any): string {
  if (!date) return 'N/A';
  try {
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    if (isNaN(dateObj.getTime())) return 'Invalid Date';

    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(dateObj);
  } catch (error) {
    return 'Invalid Date';
  }
}

export function calculateInventoryValue(items: Item[]): number {
  return items.reduce((total, item) => {
    const quantity = item.current_quantity || item.quantity || 0;
    const price = item.average_unit_cost || item.unit_price || 0;
    return total + (quantity * price);
  }, 0);
}

export function getInventoryStats(items: Item[]) {
  const totalItems = items.length;
  const totalValue = calculateInventoryValue(items);
  const lowStockItems = items.filter(item => {
    const quantity = item.current_quantity || item.quantity || 0;
    const threshold = item.low_stock_threshold || item.reorder_point || 0;
    return quantity <= threshold;
  });
  const outOfStockItems = items.filter(item => (item.current_quantity || item.quantity || 0) === 0);

  return {
    totalItems,
    totalValue,
    lowStockCount: lowStockItems.length,
    outOfStockCount: outOfStockItems.length,
    averageValue: totalItems > 0 ? totalValue / totalItems : 0,
  };
}