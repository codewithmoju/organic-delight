import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  readScopedJSON,
  writeScopedJSON,
  getScopedStorageKey,
  clearKnownSessionStorage,
} from '../../lib/utils/storageScope';
import { useAuthStore } from '../../lib/store';
import { useOfflineQueue } from '../../hooks/useOfflineQueue';

const mockCreatePOSTransaction = vi.fn(async () => ({ id: 'tx-1' }));
vi.mock('../../lib/api/pos', () => ({
  createPOSTransaction: (...args: any[]) => mockCreatePOSTransaction(...args),
}));

describe('tenant storage isolation', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({ user: { uid: 'u1' } as any, profile: null });
  });

  it('migrates legacy key to scoped key', () => {
    localStorage.setItem('customers_cache', JSON.stringify([{ id: 'c1' }]));
    const scopedKey = getScopedStorageKey('customers_cache');

    const data = readScopedJSON<any[]>('customers_cache', []);

    expect(data).toEqual([{ id: 'c1' }]);
    expect(localStorage.getItem('customers_cache')).toBeNull();
    expect(localStorage.getItem(scopedKey)).toBeTruthy();
  });

  it('writes only scoped key and removes unscoped key', () => {
    localStorage.setItem('vendors_cache', JSON.stringify([{ id: 'v-old' }]));
    const scopedKey = getScopedStorageKey('vendors_cache');

    writeScopedJSON('vendors_cache', [{ id: 'v-new' }]);

    expect(localStorage.getItem('vendors_cache')).toBeNull();
    expect(JSON.parse(localStorage.getItem(scopedKey) || '[]')).toEqual([{ id: 'v-new' }]);
  });

  it('clears only previous user scoped keys and dynamic keys', () => {
    localStorage.setItem('customers_cache:u1', '[]');
    localStorage.setItem('customers_cache:u2', '["keep"]');
    localStorage.setItem('comm_log_abc:u1', '[]');
    localStorage.setItem('comm_log_abc:u2', '["keep"]');
    localStorage.setItem('pendingVerificationUid', 'temp');

    clearKnownSessionStorage('u1');

    expect(localStorage.getItem('customers_cache:u1')).toBeNull();
    expect(localStorage.getItem('comm_log_abc:u1')).toBeNull();
    expect(localStorage.getItem('customers_cache:u2')).toBe('["keep"]');
    expect(localStorage.getItem('comm_log_abc:u2')).toBe('["keep"]');
    expect(localStorage.getItem('pendingVerificationUid')).toBeNull();
  });
});

describe('offline queue ownership sync', () => {
  beforeEach(() => {
    localStorage.clear();
    mockCreatePOSTransaction.mockClear();
    useAuthStore.setState({ user: { uid: 'u1' } as any, profile: null });
  });

  it('syncs only items queued by current user', async () => {
    const seed = [
      { id: 'OFF-1', queued_by_uid: 'u1', queued_at: '2024-01-01', total_amount: 100 },
      { id: 'OFF-2', queued_by_uid: 'u2', queued_at: '2024-01-01', total_amount: 200 },
    ];
    localStorage.setItem(getScopedStorageKey('offline_pos_transactions', 'u1'), JSON.stringify(seed));

    const { result } = renderHook(() => useOfflineQueue());

    await act(async () => {
      await result.current.syncQueue();
    });

    expect(mockCreatePOSTransaction).toHaveBeenCalledTimes(1);
    expect(mockCreatePOSTransaction).toHaveBeenCalledWith({ total_amount: 100 });

    const remaining = JSON.parse(
      localStorage.getItem(getScopedStorageKey('offline_pos_transactions', 'u1')) || '[]'
    );
    expect(remaining).toHaveLength(1);
    expect(remaining[0].queued_by_uid).toBe('u2');
  });
});
