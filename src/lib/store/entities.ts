import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createScopedZustandStorage } from '../utils/storageScope';
import type { Category, Customer, Vendor, Transaction, EnhancedItem } from '../types';

interface EntityState<T> {
  data: T[];
  loadedAt: number | null;
}

interface EntityActions<T> {
  setAll: (items: T[]) => void;
  add: (item: T) => void;
  update: (id: string, changes: Partial<T>) => void;
  remove: (id: string) => void;
  markStale: () => void;
}

type EntitySlice<T> = EntityState<T> & EntityActions<T>;

function createEntityActions<T extends { id: string }>(
  get: () => EntityStore,
  set: (fn: (state: EntityStore) => Partial<EntityStore>) => void,
  key: keyof EntityState<any>,
): EntityActions<T> {
  return {
    setAll(items: T[]) {
      set((s) => ({ ...s, [key]: { data: items, loadedAt: Date.now() } } as any));
    },
    add(item: T) {
      set((s) => ({
        ...s,
        [key]: {
          data: [...(s[key] as EntityState<T>).data, item],
          loadedAt: (s[key] as EntityState<T>).loadedAt,
        },
      } as any));
    },
    update(id: string, changes: Partial<T>) {
      set((s) => ({
        ...s,
        [key]: {
          data: (s[key] as EntityState<T>).data.map((item) =>
            item.id === id ? { ...item, ...changes } : item
          ),
          loadedAt: (s[key] as EntityState<T>).loadedAt,
        },
      } as any));
    },
    remove(id: string) {
      set((s) => ({
        ...s,
        [key]: {
          data: (s[key] as EntityState<T>).data.filter((item) => item.id !== id),
          loadedAt: (s[key] as EntityState<T>).loadedAt,
        },
      } as any));
    },
    markStale() {
      set((s) => ({ ...s, [key]: { ...(s[key] as EntityState<T>), loadedAt: null } } as any));
    },
  };
}

interface EntityStore {
  // State
  items: EntityState<EnhancedItem>;
  categories: EntityState<Category>;
  customers: EntityState<Customer>;
  vendors: EntityState<Vendor>;
  transactions: EntityState<Transaction>;

  // Actions — Items
  setItems: (items: EnhancedItem[]) => void;
  addItem: (item: EnhancedItem) => void;
  updateItem: (id: string, changes: Partial<EnhancedItem>) => void;
  removeItem: (id: string) => void;
  markItemsStale: () => void;

  // Actions — Categories
  setCategories: (categories: Category[]) => void;
  addCategory: (category: Category) => void;
  updateCategory: (id: string, changes: Partial<Category>) => void;
  removeCategory: (id: string) => void;
  markCategoriesStale: () => void;

  // Actions — Customers
  setCustomers: (customers: Customer[]) => void;
  addCustomer: (customer: Customer) => void;
  updateCustomer: (id: string, changes: Partial<Customer>) => void;
  removeCustomer: (id: string) => void;
  markCustomersStale: () => void;

  // Actions — Vendors
  setVendors: (vendors: Vendor[]) => void;
  addVendor: (vendor: Vendor) => void;
  updateVendor: (id: string, changes: Partial<Vendor>) => void;
  removeVendor: (id: string) => void;
  markVendorsStale: () => void;

  // Actions — Transactions
  setTransactions: (transactions: Transaction[]) => void;
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (id: string, changes: Partial<Transaction>) => void;
  removeTransaction: (id: string) => void;
  markTransactionsStale: () => void;

  // Bulk operations
  markAllStale: () => void;
  clearAll: () => void;
}

const emptyState = <T>(): EntityState<T> => ({ data: [], loadedAt: null });

export const useEntityStore = create<EntityStore>()(
  persist(
    (set, get) => ({
      // Initial state
      items: emptyState<EnhancedItem>(),
      categories: emptyState<Category>(),
      customers: emptyState<Customer>(),
      vendors: emptyState<Vendor>(),
      transactions: emptyState<Transaction>(),

      // Items
      setItems: (items) => set((s) => ({ ...s, items: { data: items, loadedAt: Date.now() } })),
      addItem: (item) => set((s) => ({ ...s, items: { data: [...s.items.data, item], loadedAt: s.items.loadedAt } })),
      updateItem: (id, changes) => set((s) => ({
        ...s,
        items: { data: s.items.data.map((i) => i.id === id ? { ...i, ...changes } : i), loadedAt: s.items.loadedAt },
      })),
      removeItem: (id) => set((s) => ({
        ...s,
        items: { data: s.items.data.filter((i) => i.id !== id), loadedAt: s.items.loadedAt },
      })),
      markItemsStale: () => set((s) => ({ ...s, items: { ...s.items, loadedAt: null } })),

      // Categories
      setCategories: (categories) => set((s) => ({ ...s, categories: { data: categories, loadedAt: Date.now() } })),
      addCategory: (category) => set((s) => ({ ...s, categories: { data: [...s.categories.data, category], loadedAt: s.categories.loadedAt } })),
      updateCategory: (id, changes) => set((s) => ({
        ...s,
        categories: { data: s.categories.data.map((c) => c.id === id ? { ...c, ...changes } : c), loadedAt: s.categories.loadedAt },
      })),
      removeCategory: (id) => set((s) => ({
        ...s,
        categories: { data: s.categories.data.filter((c) => c.id !== id), loadedAt: s.categories.loadedAt },
      })),
      markCategoriesStale: () => set((s) => ({ ...s, categories: { ...s.categories, loadedAt: null } })),

      // Customers
      setCustomers: (customers) => set((s) => ({ ...s, customers: { data: customers, loadedAt: Date.now() } })),
      addCustomer: (customer) => set((s) => ({ ...s, customers: { data: [...s.customers.data, customer], loadedAt: s.customers.loadedAt } })),
      updateCustomer: (id, changes) => set((s) => ({
        ...s,
        customers: { data: s.customers.data.map((c) => c.id === id ? { ...c, ...changes } : c), loadedAt: s.customers.loadedAt },
      })),
      removeCustomer: (id) => set((s) => ({
        ...s,
        customers: { data: s.customers.data.filter((c) => c.id !== id), loadedAt: s.customers.loadedAt },
      })),
      markCustomersStale: () => set((s) => ({ ...s, customers: { ...s.customers, loadedAt: null } })),

      // Vendors
      setVendors: (vendors) => set((s) => ({ ...s, vendors: { data: vendors, loadedAt: Date.now() } })),
      addVendor: (vendor) => set((s) => ({ ...s, vendors: { data: [...s.vendors.data, vendor], loadedAt: s.vendors.loadedAt } })),
      updateVendor: (id, changes) => set((s) => ({
        ...s,
        vendors: { data: s.vendors.data.map((v) => v.id === id ? { ...v, ...changes } : v), loadedAt: s.vendors.loadedAt },
      })),
      removeVendor: (id) => set((s) => ({
        ...s,
        vendors: { data: s.vendors.data.filter((v) => v.id !== id), loadedAt: s.vendors.loadedAt },
      })),
      markVendorsStale: () => set((s) => ({ ...s, vendors: { ...s.vendors, loadedAt: null } })),

      // Transactions
      setTransactions: (transactions) => set((s) => ({ ...s, transactions: { data: transactions, loadedAt: Date.now() } })),
      addTransaction: (transaction) => set((s) => ({ ...s, transactions: { data: [...s.transactions.data, transaction], loadedAt: s.transactions.loadedAt } })),
      updateTransaction: (id, changes) => set((s) => ({
        ...s,
        transactions: { data: s.transactions.data.map((t) => t.id === id ? { ...t, ...changes } : t), loadedAt: s.transactions.loadedAt },
      })),
      removeTransaction: (id) => set((s) => ({
        ...s,
        transactions: { data: s.transactions.data.filter((t) => t.id !== id), loadedAt: s.transactions.loadedAt },
      })),
      markTransactionsStale: () => set((s) => ({ ...s, transactions: { ...s.transactions, loadedAt: null } })),

      // Bulk
      markAllStale: () => set((s) => ({
        ...s,
        items: { ...s.items, loadedAt: null },
        categories: { ...s.categories, loadedAt: null },
        customers: { ...s.customers, loadedAt: null },
        vendors: { ...s.vendors, loadedAt: null },
        transactions: { ...s.transactions, loadedAt: null },
      })),
      clearAll: () => set({
        items: emptyState(),
        categories: emptyState(),
        customers: emptyState(),
        vendors: emptyState(),
        transactions: emptyState(),
      }),
    }),
    {
      name: 'entity-store',
      storage: createScopedZustandStorage(),
      partialize: (state) => ({
        items: { data: state.items.data, loadedAt: null },
        categories: { data: state.categories.data, loadedAt: null },
        customers: { data: state.customers.data, loadedAt: null },
        vendors: { data: state.vendors.data, loadedAt: null },
        transactions: { data: state.transactions.data, loadedAt: null },
      }),
    }
  )
);
