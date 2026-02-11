import React, { createContext, useContext, useEffect, useState } from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { toast } from 'sonner';

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
    const [isSyncing, setIsSyncing] = useState(false);
    const [pendingChanges, setPendingChanges] = useState(0);

    // Load pending changes count on mount
    useEffect(() => {
        // Check localStorage or IndexedDB for pending items
        const checkPending = () => {
            const posQueue = JSON.parse(localStorage.getItem('offline_pos_transactions') || '[]');
            setPendingChanges(posQueue.length);
        };
        checkPending();
        const interval = setInterval(checkPending, 2000);
        return () => clearInterval(interval);
    }, []);

    const syncData = async () => {
        if (!isOnline || isSyncing) return;
        setIsSyncing(true);

        try {
            // 1. Sync POS Transactions
            const posQueue = JSON.parse(localStorage.getItem('offline_pos_transactions') || '[]');
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
    }, [isOnline, pendingChanges]);

    return (
        <SyncContext.Provider value={{ isSyncing, pendingChanges, syncData }}>
            {children}
        </SyncContext.Provider>
    );
}
