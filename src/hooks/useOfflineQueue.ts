import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { createPOSTransaction } from '../lib/api/pos';
import { POSTransaction } from '../lib/types';

const STORAGE_KEY = 'offline_pos_transactions';

export function useOfflineQueue() {
    const [queue, setQueue] = useState<any[]>([]);
    const [isSyncing, setIsSyncing] = useState(false);

    // Load queue on mount
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                setQueue(JSON.parse(stored));
            } catch (e) {
                console.error('Failed to parse offline transactions', e);
            }
        }
    }, []);

    // Save queue on change
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    }, [queue]);

    const addToQueue = (transactionData: any) => {
        const queuedItem = {
            ...transactionData,
            queued_at: new Date().toISOString(),
            id: `OFFLINE-${Date.now()}` // Temporary ID
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

        for (const item of snapshot) {
            try {
                const { id, queued_at, ...data } = item; // Remove offline meta
                await createPOSTransaction(data);
                removeFromQueue(id);
                syncedCount++;
            } catch (error) {
                console.error('Failed to sync transaction', item, error);
                failedCount++;
            }
        }

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
        localStorage.removeItem(STORAGE_KEY);
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
