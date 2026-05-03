import { describe, it, expect, vi, beforeEach } from 'vitest';
import { stripUndefined, isTempId } from '../../lib/utils/firestore';

// Mock Firestore
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => 'expenses-col'),
  addDoc: vi.fn(() => Promise.resolve({ id: 'expense-abc123' })),
  getDoc: vi.fn(() => Promise.resolve({
    exists: () => true,
    data: () => ({
      category: 'rent',
      description: 'Monthly rent',
      amount: 5000,
      payment_method: 'cash',
      created_by: 'test-user-123',
      expense_date: { toDate: () => new Date() },
      created_at: { toDate: () => new Date() },
    }),
    id: 'expense-abc123',
  })),
  updateDoc: vi.fn(() => Promise.resolve()),
  deleteDoc: vi.fn(() => Promise.resolve()),
  getDocs: vi.fn(() => Promise.resolve({ docs: [] })),
  query: vi.fn((...args) => args),
  where: vi.fn((...args) => args),
  orderBy: vi.fn((...args) => args),
  doc: vi.fn(() => 'mock-doc-ref'),
  Timestamp: { fromDate: vi.fn(d => ({ toDate: () => d })) },
}));

vi.mock('../../lib/api/userScope', () => ({
  getCurrentUserId: () => 'test-user-123',
  requireCurrentUserId: () => 'test-user-123',
  assertOwnership: vi.fn(),
}));

describe('Expense API integration', () => {
  it('recordExpense strips undefined fields before writing', async () => {
    const { addDoc } = await import('firebase/firestore');
    const { recordExpense } = await import('../../lib/api/expenses');

    await recordExpense({
      category: 'rent',
      description: 'Monthly rent',
      amount: 5000,
      expense_date: new Date(),
      payment_method: 'cash',
      reference_number: undefined, // should be stripped
      notes: undefined,            // should be stripped
      created_by: 'test-user-123',
    });

    expect(addDoc).toHaveBeenCalledOnce();
    const writtenData = vi.mocked(addDoc).mock.calls[0][1] as Record<string, any>;
    // undefined fields are converted to null (Firestore-safe), not kept as undefined
    expect(writtenData.reference_number).toBeNull();
    expect(writtenData.notes).toBeNull();
    expect(writtenData.category).toBe('rent');
    expect(writtenData.amount).toBe(5000);
  });

  it('updateExpense builds clean payload without undefined', async () => {
    const { updateDoc } = await import('firebase/firestore');
    const { updateExpense } = await import('../../lib/api/expenses');

    await updateExpense('expense-abc123', {
      description: 'Updated rent',
      amount: 6000,
      notes: undefined, // should be excluded
    });

    expect(updateDoc).toHaveBeenCalledOnce();
    const payload = vi.mocked(updateDoc).mock.calls[0][1] as Record<string, any>;
    expect(payload.description).toBe('Updated rent');
    expect(payload.amount).toBe(6000);
    expect('notes' in payload).toBe(false);
  });
});

// ── Firestore utility integration ─────────────────────────────────────────────
describe('stripUndefined integration', () => {
  it('produces Firestore-safe objects', () => {
    const input = {
      name: 'Test',
      reference: undefined,
      notes: undefined,
      amount: 100,
      category: 'rent',
    };
    const result = stripUndefined(input);
    const keys = Object.keys(result);
    expect(keys).not.toContain('reference');
    expect(keys).not.toContain('notes');
    expect(result.name).toBe('Test');
    expect(result.amount).toBe(100);
  });
});
