import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { createPOSTransaction } from '../lib/api/pos';
import { useAuthStore } from '../lib/store';
import { getScopedStorageKey, readScopedJSON, writeScopedJSON, removeScopedKey } from '../lib/utils/storageScope';

const STORAGE_KEY = 'offline_pos_transactions';

export function useOfflineQueue() {
    const userId = useAuthStore((state) => state.user?.uid || state.profile?.id || null);
    const [queue, setQueue] = useState<any[]>([]);
    const [isSyncing, setIsSyncing] = useState(false);
    const storageKey = getScopedStorageKey(STORAGE_KEY, userId || undefined);

    // Load queue for current authenticated user
    useEffect(() => {
        // Never migrate legacy global queue — it could belong to another account on shared devices.
        const loaded = readScopedJSON<any[]>(STORAGE_KEY, [], userId || undefined);
        setQueue(Array.isArray(loaded) ? loaded : []);
    }, [userId]);

    // Save queue per user
    useEffect(() => {
        writeScopedJSON(STORAGE_KEY, queue, userId || undefined);
    }, [queue, userId]);

    const addToQueue = (transactionData: any) => {
        const queuedItem = {
            ...transactionData,
            queued_at: new Date().toISOString(),
            id: `OFFLINE-${Date.now()}`, // Temporary ID
            queued_by_uid: userId
        };
        setQueue(prev => [...prev, queuedItem]);
        toast.warning('Transaction saved offline. Will sync when online.');
        return queuedItem;
    };

    const removeFromQueue = (tempId: string) => {
        setQueue(prev => prev.filter(item => item.id !== tempId));
    };

    const syncQueue = async () => {
        if (queue.length === 0) return;
        if (isSyncing) return;

        setIsSyncing(true);
        let syncedCount = 0;
        let failedCount = 0;

        const snapshot = [...queue]; // Copy to avoid mutation issues during iteration
        const remaining: any[] = [];

        for (const item of snapshot) {
            try {
                if (!userId || item.queued_by_uid !== userId) {
                    remaining.push(item);
                    continue;
                }
                const { id, queued_at, queued_by_uid: _qb, ...data } = item; // Remove offline meta
                await createPOSTransaction(data);
                syncedCount++;
            } catch (error) {
                console.error('Failed to sync transaction', item, error);
                failedCount++;
                remaining.push(item);
            }
        }
        setQueue(remaining);

        setIsSyncing(false);

        if (syncedCount > 0) {
            toast.success(`Synced ${syncedCount} offline transactions.`);
        }
        if (failedCount > 0) {
            toast.error(`Failed to sync ${failedCount} transactions. Please try again.`);
        }
    };

    const clearQueue = () => {
        setQueue([]);
        removeScopedKey(STORAGE_KEY, userId || undefined);
    };

    return {
        queue,
        addToQueue,
        removeFromQueue,
        syncQueue,
        clearQueue,
        isSyncing
    };
}
