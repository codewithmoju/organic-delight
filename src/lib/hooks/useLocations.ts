import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createScopedZustandStorage } from '../utils/storageScope';

export interface Location {
  id: string;
  name: string;
  address?: string;
  is_default: boolean;
  created_at: string;
}

interface LocationState {
  locations: Location[];
  activeLocationId: string | null;
  addLocation: (name: string, address?: string) => Location;
  updateLocation: (id: string, updates: Partial<Pick<Location, 'name' | 'address'>>) => void;
  deleteLocation: (id: string) => void;
  setDefault: (id: string) => void;
  setActive: (id: string | null) => void;
  getActive: () => Location | null;
}

export const useLocations = create<LocationState>()(
  persist(
    (set, get) => ({
      locations: [],
      activeLocationId: null,

      addLocation: (name, address) => {
        const isFirst = get().locations.length === 0;
        const loc: Location = {
          id: `loc_${Date.now()}`,
          name: name.trim(),
          address,
          is_default: isFirst,
          created_at: new Date().toISOString(),
        };
        set(state => ({ locations: [...state.locations, loc] }));
        if (isFirst) set({ activeLocationId: loc.id });
        return loc;
      },

      updateLocation: (id, updates) => {
        set(state => ({
          locations: state.locations.map(l =>
            l.id === id ? { ...l, ...updates } : l
          ),
        }));
      },

      deleteLocation: (id) => {
        set(state => {
          const remaining = state.locations.filter(l => l.id !== id);
          // If deleted was default, make first remaining the default
          if (remaining.length > 0 && !remaining.some(l => l.is_default)) {
            remaining[0].is_default = true;
          }
          return {
            locations: remaining,
            activeLocationId: state.activeLocationId === id
              ? (remaining[0]?.id ?? null)
              : state.activeLocationId,
          };
        });
      },

      setDefault: (id) => {
        set(state => ({
          locations: state.locations.map(l => ({ ...l, is_default: l.id === id })),
        }));
      },

      setActive: (id) => set({ activeLocationId: id }),

      getActive: () => {
        const { locations, activeLocationId } = get();
        return locations.find(l => l.id === activeLocationId) ?? locations.find(l => l.is_default) ?? locations[0] ?? null;
      },
    }),
    {
      name: 'app-locations',
      storage: createJSONStorage(() => createScopedZustandStorage()),
    }
  )
);
