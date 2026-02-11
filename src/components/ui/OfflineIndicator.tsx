import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export default function OfflineIndicator() {
    const isOnline = useOnlineStatus();

    if (isOnline) return null;

    return (
        <div className="bg-error-500 text-white text-xs font-semibold py-1 px-4 text-center flex items-center justify-center gap-2 fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom-5">
            <WifiOff className="w-3 h-3" />
            <span>You are offline. Changes will be synced when you reconnect.</span>
        </div>
    );
}
