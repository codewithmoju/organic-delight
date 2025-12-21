import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi, X } from 'lucide-react';

export default function OfflineIndicator() {
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const [showOnlineStatus, setShowOnlineStatus] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setIsOffline(false);
            setShowOnlineStatus(true);
            setTimeout(() => setShowOnlineStatus(false), 5000);
        };

        const handleOffline = () => {
            setIsOffline(true);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return (
        <div className="fixed bottom-6 left-6 z-[9999] pointer-events-none">
            <AnimatePresence>
                {isOffline && (
                    <motion.div
                        initial={{ opacity: 0, x: -50, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -50, scale: 0.9 }}
                        className="pointer-events-auto flex items-center gap-3 px-4 py-3 bg-red-500 text-white rounded-2xl shadow-2xl border border-red-400/50 backdrop-blur-md"
                    >
                        <div className="p-2 bg-white/20 rounded-xl">
                            <WifiOff className="w-5 h-5 flex-shrink-0" />
                        </div>
                        <div>
                            <p className="font-bold text-sm">Working Offline</p>
                            <p className="text-xs text-red-100">Changes will sync when online</p>
                        </div>
                    </motion.div>
                )}

                {showOnlineStatus && (
                    <motion.div
                        initial={{ opacity: 0, x: -50, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -50, scale: 0.9 }}
                        className="pointer-events-auto flex items-center gap-3 px-4 py-3 bg-emerald-500 text-white rounded-2xl shadow-2xl border border-emerald-400/50 backdrop-blur-md"
                    >
                        <div className="p-2 bg-white/20 rounded-xl">
                            <Wifi className="w-5 h-5 flex-shrink-0" />
                        </div>
                        <div>
                            <p className="font-bold text-sm">Back Online</p>
                            <p className="text-xs text-emerald-100">Synchronizing data...</p>
                        </div>
                        <button
                            onClick={() => setShowOnlineStatus(false)}
                            className="ml-2 hover:bg-white/20 p-1 rounded-lg transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
