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

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
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