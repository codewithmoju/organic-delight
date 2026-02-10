import { useEffect, useCallback } from 'react';

interface ShortcutConfig {
    key: string;
    ctrlKey?: boolean;
    altKey?: boolean;
    shiftKey?: boolean;
    action: () => void;
    description: string;
}

/**
 * Global keyboard shortcuts hook for POS system
 * 
 * Shortcuts:
 * - F2: New Transaction
 * - F5: Process Payment
 * - F8: Toggle Dummy/Regular Billing
 * - F12: Open Vendor List
 * - Escape: Close Modal
 */
export function useKeyboardShortcuts(shortcuts: ShortcutConfig[], enabled: boolean = true) {
    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        if (!enabled) return;

        // Don't trigger shortcuts when typing in inputs
        const target = event.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
            // Only allow Escape and Function keys (F1-F12) in inputs
            // Also allow Ctrl+F (Search) and Ctrl+P (Print)
            const isFunctionKey = /^F([1-9]|1[0-2])$/.test(event.key);
            const isCtrlShortcut = event.ctrlKey && (event.key === 'p' || event.key === 'f');

            if (event.key !== 'Escape' && !isFunctionKey && !isCtrlShortcut) {
                return;
            }
        }

        for (const shortcut of shortcuts) {
            const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase() ||
                event.code.toLowerCase() === shortcut.key.toLowerCase();
            const ctrlMatch = !!shortcut.ctrlKey === event.ctrlKey;
            const altMatch = !!shortcut.altKey === event.altKey;
            const shiftMatch = !!shortcut.shiftKey === event.shiftKey;

            if (keyMatch && ctrlMatch && altMatch && shiftMatch) {
                event.preventDefault();
                event.stopPropagation();
                shortcut.action();
                return;
            }
        }
    }, [shortcuts, enabled]);

    useEffect(() => {
        if (enabled) {
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [handleKeyDown, enabled]);
}

/**
 * Pre-configured POS shortcuts hook
 */
export function usePOSShortcuts(handlers: {
    onNewTransaction?: () => void;
    onProcessPayment?: () => void;
    onToggleBillType?: () => void;
    onOpenVendors?: () => void;
    onOpenCustomers?: () => void;
    onCloseModal?: () => void;
    onSearch?: () => void;
    onPrint?: () => void;
}) {
    const shortcuts: ShortcutConfig[] = [
        ...(handlers.onNewTransaction ? [{
            key: 'F2',
            action: handlers.onNewTransaction,
            description: 'New Transaction'
        }] : []),
        ...(handlers.onProcessPayment ? [{
            key: 'F5',
            action: handlers.onProcessPayment,
            description: 'Process Payment'
        }] : []),
        ...(handlers.onToggleBillType ? [{
            key: 'F8',
            action: handlers.onToggleBillType,
            description: 'Cycle Bill Type'
        }] : []),
        ...(handlers.onOpenVendors ? [{
            key: 'F12',
            action: handlers.onOpenVendors,
            description: 'Open Vendor List'
        }] : []),
        ...(handlers.onOpenCustomers ? [{
            key: 'F11',
            action: handlers.onOpenCustomers,
            description: 'Open Customer List'
        }] : []),
        ...(handlers.onCloseModal ? [{
            key: 'Escape',
            action: handlers.onCloseModal,
            description: 'Close Modal'
        }] : []),
        ...(handlers.onSearch ? [{
            key: 'f',
            ctrlKey: true,
            action: handlers.onSearch,
            description: 'Search Products'
        }] : []),
        ...(handlers.onPrint ? [{
            key: 'p',
            ctrlKey: true,
            action: handlers.onPrint,
            description: 'Print Receipt'
        }] : []),
    ];

    useKeyboardShortcuts(shortcuts);

    return shortcuts;
}

/**
 * Keyboard shortcuts display component data
 */
export const POS_SHORTCUTS = [
    { key: 'F2', description: 'New Transaction' },
    { key: 'F5', description: 'Process Payment' },
    { key: 'F8', description: 'Cycle Bill Type' },
    { key: 'F11', description: 'Open Customer List' },
    { key: 'F12', description: 'Open Vendor List' },
    { key: 'Esc', description: 'Close Modal' },
    { key: 'Ctrl+F', description: 'Search Products' },
    { key: 'Ctrl+P', description: 'Print Receipt' },
];

export default useKeyboardShortcuts;
