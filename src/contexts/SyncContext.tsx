import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { toast } from 'sonner';
import { useAuthStore } from '../lib/store';
import { useEntityStore } from '../lib/store/entities';
import { getScopedStorageKey } from '../lib/utils/storageScope';

interface SyncContextType {
    isSyncing: boolean;
    pendingChanges: number;
    syncData: () => Promise<void>;
}

const SyncContext = createContext<SyncContextType>({
    isSyncing: false,
    pendingChanges: 0,
    syncData: async () => { },
});

export const useSync = () => useContext(SyncContext);

export function SyncProvider({ children }: { children: React.ReactNode }) {
    const isOnline = useOnlineStatus();
    const userId = useAuthStore((state) => state.user?.uid || state.profile?.id || null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [pendingChanges, setPendingChanges] = useState(0);
    const storageKey = getScopedStorageKey('offline_pos_transactions', userId || undefined);

    // Load pending changes count per authenticated user
    useEffect(() => {
        const checkPending = () => {
            try {
                const posQueue = JSON.parse(localStorage.getItem(storageKey) || '[]');
                setPendingChanges(Array.isArray(posQueue) ? posQueue.length : 0);
            } catch {
                setPendingChanges(0);
            }
        };
        checkPending();

        const onStorage = (event: StorageEvent) => {
            if (event.key === storageKey) checkPending();
        };

        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, [storageKey]);

    const syncData = useCallback(async () => {
        if (!isOnline || isSyncing) return;
        setIsSyncing(true);

        try {
            // Mark all entity store slices stale so next reads revalidate from Firestore
            const store = useEntityStore.getState();
            store.markItemsStale();
            store.markCategoriesStale();
            store.markCustomersStale();
            store.markVendorsStale();
            store.markTransactionsStale();

            // POS queue sync is handled by useOfflineQueue — trigger it via storage event
            const posQueue = JSON.parse(localStorage.getItem(storageKey) || '[]');
            if (posQueue.length > 0) {
                // Notify useOfflineQueue to process its queue
                window.dispatchEvent(new StorageEvent('storage', { key: storageKey }));
            }
        } catch (error) {
            console.error('Global sync failed:', error);
            toast.error('Sync failed. Please check connection.');
        } finally {
            setIsSyncing(false);
        }
    }, [isOnline, isSyncing, storageKey]);

    // Auto-sync when coming online
    useEffect(() => {
        if (isOnline && pendingChanges > 0) {
            syncData();
        }
    }, [isOnline, pendingChanges, syncData]);

    // Revalidate stale data when tab regains focus
    useEffect(() => {
        const onVisibilityChange = () => {
            if (document.visibilityState === 'visible' && isOnline) {
                const store = useEntityStore.getState();
                // Only mark stale if data is actually stale (older than stale threshold)
                const now = Date.now();
                const STALE_MS = 5 * 60 * 1000; // 5 minutes
                if (store.items.loadedAt && now - store.items.loadedAt > STALE_MS) {
                    store.markItemsStale();
                }
                if (store.categories.loadedAt && now - store.categories.loadedAt > STALE_MS) {
                    store.markCategoriesStale();
                }
                if (store.customers.loadedAt && now - store.customers.loadedAt > STALE_MS) {
                    store.markCustomersStale();
                }
                if (store.vendors.loadedAt && now - store.vendors.loadedAt > STALE_MS) {
                    store.markVendorsStale();
                }
                if (store.transactions.loadedAt && now - store.transactions.loadedAt > STALE_MS) {
                    store.markTransactionsStale();
                }
            }
        };

        document.addEventListener('visibilitychange', onVisibilityChange);
        return () => document.removeEventListener('visibilitychange', onVisibilityChange);
    }, [isOnline]);

    const value = useMemo<SyncContextType>(() => ({
        isSyncing,
        pendingChanges,
        syncData,
    }), [isSyncing, pendingChanges, syncData]);

    return (
        <SyncContext.Provider value={value}>
            {children}
        </SyncContext.Provider>
    );
}
