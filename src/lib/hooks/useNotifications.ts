import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createScopedZustandStorage } from '../utils/storageScope';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  created_at: string; // ISO string
  link?: string;      // optional navigation target
}

interface NotificationState {
  notifications: AppNotification[];
  addNotification: (n: Omit<AppNotification, 'id' | 'read' | 'created_at'>) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  dismiss: (id: string) => void;
  clearAll: () => void;
}

export const useNotifications = create<NotificationState>()(
  persist(
    (set) => ({
      notifications: [],

      addNotification: (n) => set(state => ({
        notifications: [
          {
            ...n,
            id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            read: false,
            created_at: new Date().toISOString(),
          },
          ...state.notifications,
        ].slice(0, 100), // keep last 100
      })),

      markRead: (id) => set(state => ({
        notifications: state.notifications.map(n =>
          n.id === id ? { ...n, read: true } : n
        ),
      })),

      markAllRead: () => set(state => ({
        notifications: state.notifications.map(n => ({ ...n, read: true })),
      })),

      dismiss: (id) => set(state => ({
        notifications: state.notifications.filter(n => n.id !== id),
      })),

      clearAll: () => set({ notifications: [] }),
    }),
    {
      name: 'app-notifications',
      storage: createJSONStorage(() => createScopedZustandStorage()),
      partialize: (state) => ({ notifications: state.notifications }),
    }
  )
);

// ── Convenience helpers ───────────────────────────────────────────────────────

export function notify(
  type: NotificationType,
  title: string,
  message: string,
  link?: string
) {
  useNotifications.getState().addNotification({ type, title, message, link });
}

export function notifyLowStock(itemName: string, qty: number) {
  notify('warning', 'Low Stock Alert', `${itemName} is running low (${qty} remaining)`, '/inventory/alerts');
}

export function notifyExpiry(itemName: string, daysLeft: number) {
  const msg = daysLeft < 0
    ? `${itemName} has expired`
    : `${itemName} expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`;
  notify('error', 'Expiry Alert', msg, '/inventory/expiry');
}

export function notifyPaymentDue(vendorName: string, amount: string) {
  notify('warning', 'Payment Due', `Payment of ${amount} due to ${vendorName}`, '/vendors');
}

export function notifySaleComplete(amount: string, txNumber: string) {
  notify('success', 'Sale Completed', `Transaction ${txNumber} — ${amount}`, '/transactions');
}
