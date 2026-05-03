import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNotifications, notify } from '../../lib/hooks/useNotifications';
import { usePOSPermissions } from '../../lib/hooks/usePOSPermissions';
import { useAuthStore } from '../../lib/store';

// ── useNotifications ──────────────────────────────────────────────────────────
describe('useNotifications', () => {
  beforeEach(() => {
    useNotifications.getState().clearAll();
  });

  it('starts with empty notifications', () => {
    const { result } = renderHook(() => useNotifications());
    expect(result.current.notifications).toHaveLength(0);
  });

  it('adds a notification', () => {
    act(() => {
      notify('info', 'Test Title', 'Test message');
    });
    const { result } = renderHook(() => useNotifications());
    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0].title).toBe('Test Title');
    expect(result.current.notifications[0].read).toBe(false);
  });

  it('marks a notification as read', () => {
    act(() => notify('success', 'Sale', 'Completed'));
    const { result } = renderHook(() => useNotifications());
    const id = result.current.notifications[0].id;

    act(() => result.current.markRead(id));
    expect(result.current.notifications[0].read).toBe(true);
  });

  it('marks all notifications as read', () => {
    act(() => {
      notify('info', 'A', 'msg');
      notify('warning', 'B', 'msg');
    });
    const { result } = renderHook(() => useNotifications());
    act(() => result.current.markAllRead());
    expect(result.current.notifications.every(n => n.read)).toBe(true);
  });

  it('dismisses a notification', () => {
    act(() => notify('error', 'Error', 'Something failed'));
    const { result } = renderHook(() => useNotifications());
    const id = result.current.notifications[0].id;

    act(() => result.current.dismiss(id));
    expect(result.current.notifications).toHaveLength(0);
  });

  it('clears all notifications', () => {
    act(() => {
      notify('info', 'A', 'msg');
      notify('info', 'B', 'msg');
      notify('info', 'C', 'msg');
    });
    const { result } = renderHook(() => useNotifications());
    act(() => result.current.clearAll());
    expect(result.current.notifications).toHaveLength(0);
  });

  it('caps notifications at 100', () => {
    act(() => {
      for (let i = 0; i < 110; i++) {
        notify('info', `Notif ${i}`, 'msg');
      }
    });
    const { result } = renderHook(() => useNotifications());
    expect(result.current.notifications.length).toBeLessThanOrEqual(100);
  });

  it('assigns unique IDs to each notification', () => {
    act(() => {
      notify('info', 'A', 'msg');
      notify('info', 'B', 'msg');
    });
    const { result } = renderHook(() => useNotifications());
    const ids = result.current.notifications.map(n => n.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ── usePOSPermissions ─────────────────────────────────────────────────────────
describe('usePOSPermissions', () => {
  it('admin can do everything', () => {
    useAuthStore.setState({ profile: { id: '1', full_name: 'Admin', email: 'a@b.com', preferred_currency: 'PKR', created_at: new Date(), updated_at: new Date(), role: 'admin' } });
    const { result } = renderHook(() => usePOSPermissions());
    expect(result.current.can('void_transaction')).toBe(true);
    expect(result.current.can('process_return')).toBe(true);
    expect(result.current.can('close_shift')).toBe(true);
    expect(result.current.can('change_settings')).toBe(true);
    expect(result.current.isAdmin).toBe(true);
  });

  it('manager cannot void or change settings', () => {
    useAuthStore.setState({ profile: { id: '2', full_name: 'Manager', email: 'm@b.com', preferred_currency: 'PKR', created_at: new Date(), updated_at: new Date(), role: 'manager' } });
    const { result } = renderHook(() => usePOSPermissions());
    expect(result.current.can('void_transaction')).toBe(false);
    expect(result.current.can('change_settings')).toBe(false);
    expect(result.current.can('process_return')).toBe(true);
    expect(result.current.can('close_shift')).toBe(true);
    expect(result.current.isManager).toBe(true);
  });

  it('user (cashier) has minimal permissions', () => {
    useAuthStore.setState({ profile: { id: '3', full_name: 'Cashier', email: 'c@b.com', preferred_currency: 'PKR', created_at: new Date(), updated_at: new Date(), role: 'user' } });
    const { result } = renderHook(() => usePOSPermissions());
    expect(result.current.can('apply_discount')).toBe(true);
    expect(result.current.can('hold_cart')).toBe(true);
    expect(result.current.can('process_return')).toBe(false);
    expect(result.current.can('credit_sale')).toBe(false);
    expect(result.current.can('close_shift')).toBe(false);
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isManager).toBe(false);
  });

  it('canApplyDiscount respects threshold for user role', () => {
    useAuthStore.setState({ profile: { id: '3', full_name: 'Cashier', email: 'c@b.com', preferred_currency: 'PKR', created_at: new Date(), updated_at: new Date(), role: 'user' } });
    const { result } = renderHook(() => usePOSPermissions());
    expect(result.current.canApplyDiscount(5)).toBe(true);   // under threshold
    expect(result.current.canApplyDiscount(15)).toBe(false); // over threshold
  });

  it('canApplyDiscount allows large discounts for manager', () => {
    useAuthStore.setState({ profile: { id: '2', full_name: 'Manager', email: 'm@b.com', preferred_currency: 'PKR', created_at: new Date(), updated_at: new Date(), role: 'manager' } });
    const { result } = renderHook(() => usePOSPermissions());
    expect(result.current.canApplyDiscount(50)).toBe(true);
  });
});
