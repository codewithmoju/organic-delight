import React, { createContext, useContext, useEffect, useState } from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { toast } from 'sonner';
import { useAuthStore } from '../lib/store';
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

    const syncData = async () => {
        if (!isOnline || isSyncing) return;
        setIsSyncing(true);

        try {
            // 1. Sync POS Transactions
            const posQueue = JSON.parse(localStorage.getItem(storageKey) || '[]');
            if (posQueue.length > 0) {
                // This logic is currently handled in POSInterface or useOfflineQueue.
                // In a full implementation, we'd move the sync logic here or trigger it.
                // For now, we'll let existing hooks handle their specific syncs, 
                // but this provider acts as a global monitor.
            }

            // Future: Add other sync logic here (e.g. new products, customer updates)

            // Simulate sync delay for UX
            await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
            console.error('Global sync failed:', error);
            toast.error('Sync failed. Please check connection.');
        } finally {
            setIsSyncing(false);
        }
    };

    // Auto-sync when coming online
    useEffect(() => {
        if (isOnline && pendingChanges > 0) {
            syncData();
        }
    }, [isOnline, pendingChanges, storageKey]);

    return (
        <SyncContext.Provider value={{ isSyncing, pendingChanges, syncData }}>
            {children}
        </SyncContext.Provider>
    );
}
