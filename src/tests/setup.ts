import '@testing-library/jest-dom';
import { vi } from 'vitest';

// ── Mock Firebase so tests never hit the network ──────────────────────────────
vi.mock('../lib/firebase', () => ({
  db: {},
  auth: {
    currentUser: { uid: 'test-user-123', email: 'test@example.com' },
    onAuthStateChanged: vi.fn(),
  },
}));

// ── Mock react-router-dom navigation ─────────────────────────────────────────
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({ id: 'test-id' }),
  };
});

// ── Silence console.error in tests (keeps output clean) ──────────────────────
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (typeof args[0] === 'string' && args[0].includes('Warning:')) return;
    originalError(...args);
  };
});
afterAll(() => {
  console.error = originalError;
});

// ── Mock localStorage ─────────────────────────────────────────────────────────
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    key: (index: number) => Object.keys(store)[index] ?? null,
    get length() { return Object.keys(store).length; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });
