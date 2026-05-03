import { describe, it, expect, beforeEach } from 'vitest';
import { exportToCSV } from '../../lib/utils/csvExport';
import { exportToExcel } from '../../lib/utils/excelExport';
import { stripUndefined, isTempId } from '../../lib/utils/firestore';
import { formatCurrency } from '../../lib/utils/notifications';

// ── csvExport ─────────────────────────────────────────────────────────────────
describe('exportToCSV', () => {
  it('creates a download link and triggers click', () => {
    const createObjectURL = vi.fn(() => 'blob:test');
    const revokeObjectURL = vi.fn();
    const click = vi.fn();
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });

    const anchor = { href: '', download: '', click } as any;
    vi.spyOn(document, 'createElement').mockReturnValueOnce(anchor);

    exportToCSV([{ Name: 'Item A', Price: 100 }], 'test-export');

    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(anchor.download).toBe('test-export.csv');
    expect(click).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledOnce();
  });

  it('does nothing when data is empty', () => {
    const click = vi.fn();
    vi.spyOn(document, 'createElement').mockReturnValueOnce({ click } as any);
    exportToCSV([], 'empty');
    expect(click).not.toHaveBeenCalled();
  });

  it('escapes commas and quotes in values', () => {
    const createObjectURL = vi.fn(() => 'blob:test');
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL: vi.fn() });
    const anchor = { href: '', download: '', click: vi.fn() } as any;
    vi.spyOn(document, 'createElement').mockReturnValueOnce(anchor);

    exportToCSV([{ Name: 'Item, A', Notes: 'Say "hello"' }], 'test');

    const blob: Blob = createObjectURL.mock.calls[0][0];
    return blob.text().then(text => {
      expect(text).toContain('"Item, A"');
      expect(text).toContain('"Say ""hello"""');
    });
  });
});

// ── excelExport ───────────────────────────────────────────────────────────────
describe('exportToExcel', () => {
  it('creates an .xls blob and triggers download', () => {
    const createObjectURL = vi.fn(() => 'blob:test-excel');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });
    vi.spyOn(document.body, 'appendChild').mockImplementation((el: any) => el);
    vi.spyOn(document.body, 'removeChild').mockImplementation((el: any) => el);

    exportToExcel([{ Product: 'Widget', Qty: 5 }], 'inventory');

    // Verify a blob was created and a URL was generated
    expect(createObjectURL).toHaveBeenCalledOnce();
    const blob: Blob = createObjectURL.mock.calls[0][0];
    expect(blob.type).toContain('ms-excel');
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:test-excel');
  });

  it('does nothing when data is empty', () => {
    const createObjectURL = vi.fn();
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL: vi.fn() });
    exportToExcel([], 'empty');
    expect(createObjectURL).not.toHaveBeenCalled();
  });
});

// ── firestore utils ───────────────────────────────────────────────────────────
describe('stripUndefined', () => {
  it('removes undefined values', () => {
    const result = stripUndefined({ a: 1, b: undefined, c: 'hello', d: null });
    expect(result).toEqual({ a: 1, c: 'hello', d: null });
    expect('b' in result).toBe(false);
  });

  it('keeps falsy non-undefined values', () => {
    const result = stripUndefined({ zero: 0, empty: '', falsy: false, nil: null });
    expect(result).toEqual({ zero: 0, empty: '', falsy: false, nil: null });
  });

  it('returns empty object for all-undefined input', () => {
    expect(stripUndefined({ a: undefined, b: undefined })).toEqual({});
  });
});

describe('isTempId', () => {
  it('returns true for temp_ prefixed IDs', () => {
    expect(isTempId('temp_1234567890')).toBe(true);
    expect(isTempId('temp_abc')).toBe(true);
  });

  it('returns false for real Firestore IDs', () => {
    expect(isTempId('TUtSb4a8Qsb3WoiJXIc2')).toBe(false);
    expect(isTempId('abc123')).toBe(false);
    expect(isTempId('')).toBe(false);
  });
});

// ── formatCurrency ────────────────────────────────────────────────────────────
describe('formatCurrency', () => {
  it('formats positive numbers', () => {
    const result = formatCurrency(1500);
    expect(result).toContain('1,500');
  });

  it('formats zero', () => {
    const result = formatCurrency(0);
    expect(result).toContain('0');
  });

  it('formats decimal values', () => {
    const result = formatCurrency(99.99);
    expect(result).toContain('99');
  });
});
