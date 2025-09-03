import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { auth } from './firebase';
import { signOut as firebaseSignOut } from 'firebase/auth';
import { Item, Category, Transaction } from './types';

interface AuthState {
  user: any | null;
  profile: any | null;
  setUser: (user: any) => void;
  setProfile: (profile: any) => void;
  signOut: () => Promise<void>;
}

interface InventoryState {
  items: Item[];
  categories: Category[];
  transactions: Transaction[];
  searchQuery: string;
  selectedCategory: string | null;
  setItems: (items: Item[]) => void;
  setCategories: (categories: Category[]) => void;
  setTransactions: (transactions: Transaction[]) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (categoryId: string | null) => void;
  addItem: (item: Item) => void;
  updateItem: (id: string, item: Partial<Item>) => void;
  removeItem: (id: string) => void;
  addCategory: (category: Category) => void;
  updateCategory: (id: string, category: Partial<Category>) => void;
  removeCategory: (id: string) => void;
  addTransaction: (transaction: Transaction) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
  user: null,
  profile: null,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  signOut: async () => {
    await firebaseSignOut(auth);
    set({ user: null, profile: null });
  },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ profile: state.profile }),
    }
  )
);

export const useInventoryStore = create<InventoryState>((set, get) => ({
  items: [],
  categories: [],
  transactions: [],
  searchQuery: '',
  selectedCategory: null,
  setItems: (items) => set({ items }),
  setCategories: (categories) => set({ categories }),
  setTransactions: (transactions) => set({ transactions }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedCategory: (selectedCategory) => set({ selectedCategory }),
  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
  updateItem: (id, updatedItem) => set((state) => ({
    items: state.items.map(item => item.id === id ? { ...item, ...updatedItem } : item)
  })),
  removeItem: (id) => set((state) => ({
    items: state.items.filter(item => item.id !== id)
  })),
  addCategory: (category) => set((state) => ({ categories: [...state.categories, category] })),
  updateCategory: (id, updatedCategory) => set((state) => ({
    categories: state.categories.map(cat => cat.id === id ? { ...cat, ...updatedCategory } : cat)
  })),
  removeCategory: (id) => set((state) => ({
    categories: state.categories.filter(cat => cat.id !== id)
  })),
  addTransaction: (transaction) => set((state) => ({ 
    transactions: [transaction, ...state.transactions] 
  })),
}));