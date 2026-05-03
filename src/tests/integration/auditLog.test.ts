import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logAudit, getAuditLogs } from '../../lib/api/auditLog';

// Mock Firestore operations
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => 'mock-collection'),
  addDoc: vi.fn(() => Promise.resolve({ id: 'new-audit-id' })),
  getDocs: vi.fn(() => Promise.resolve({
    docs: [
      {
        id: 'audit-1',
        data: () => ({
          user_id: 'test-user-123',
          action: 'create',
          resource: 'item',
          resource_name: 'Test Item',
          details: 'Created new item',
          created_at: { toDate: () => new Date('2026-01-01') },
        }),
      },
      {
        id: 'audit-2',
        data: () => ({
          user_id: 'test-user-123',
          action: 'sale',
          resource: 'pos_transaction',
          resource_name: 'TRX-001',
          details: 'Sale of PKR 500',
          created_at: { toDate: () => new Date('2026-01-02') },
        }),
      },
    ],
  })),
  query: vi.fn((...args) => args),
  where: vi.fn((...args) => args),
  orderBy: vi.fn((...args) => args),
  limit: vi.fn((...args) => args),
  Timestamp: { fromDate: vi.fn(d => d) },
}));

describe('logAudit', () => {
  it('writes an audit entry without throwing', async () => {
    const { addDoc } = await import('firebase/firestore');
    await expect(
      logAudit({
        action: 'create',
        resource: 'item',
        resource_name: 'New Product',
        details: 'Created via inventory form',
      })
    ).resolves.not.toThrow();
    expect(addDoc).toHaveBeenCalledOnce();
  });

  it('silently fails when not authenticated', async () => {
    // Override getCurrentUserId to return null
    vi.doMock('../../lib/api/userScope', () => ({
      getCurrentUserId: () => null,
      requireCurrentUserId: () => { throw new Error('Not authenticated'); },
      assertOwnership: vi.fn(),
    }));
    // Should not throw
    await expect(
      logAudit({ action: 'delete', resource: 'item' })
    ).resolves.not.toThrow();
  });
});

describe('getAuditLogs', () => {
  it('returns audit entries for current user', async () => {
    const logs = await getAuditLogs();
    expect(logs).toHaveLength(2);
    expect(logs[0].action).toBe('create');
    expect(logs[1].action).toBe('sale');
  });

  it('filters by action', async () => {
    const logs = await getAuditLogs({ action: 'sale' });
    expect(logs.every(l => l.action === 'sale')).toBe(true);
  });

  it('filters by resource', async () => {
    const logs = await getAuditLogs({ resource: 'item' });
    expect(logs.every(l => l.resource === 'item')).toBe(true);
  });

  it('returns empty array on error', async () => {
    const { getDocs } = await import('firebase/firestore');
    vi.mocked(getDocs).mockRejectedValueOnce(new Error('Firestore error'));
    const logs = await getAuditLogs();
    expect(logs).toEqual([]);
  });
});
