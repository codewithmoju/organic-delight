import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ThemeMode } from '../lib/theme';

interface ThemeContextType {
    theme: ThemeMode;
    resolvedTheme: 'light' | 'dark';
    setTheme: (theme: ThemeMode) => void;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'organic-delight-theme-v2';

interface ThemeProviderProps {
    children: React.ReactNode;
    defaultTheme?: ThemeMode;
}

export function ThemeProvider({ children, defaultTheme = 'light' }: ThemeProviderProps) {
    const [theme, setThemeState] = useState<ThemeMode>(() => {
        // Check localStorage first
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
            if (stored && ['light', 'dark', 'system'].includes(stored)) {
                return stored;
            }
        }
        return defaultTheme;
    });

    const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

    // Resolve the actual theme (handles 'system' preference)
    const resolveTheme = useCallback((themeMode: ThemeMode): 'light' | 'dark' => {
        if (themeMode === 'system') {
            if (typeof window !== 'undefined') {
                return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            }
            return 'light';
        }
        return themeMode;
    }, []);

    // Apply theme to document
    const applyTheme = useCallback((resolved: 'light' | 'dark') => {
        const root = document.documentElement;

        if (resolved === 'dark') {
            root.classList.add('dark');
            root.style.colorScheme = 'dark';
        } else {
            root.classList.remove('dark');
            root.style.colorScheme = 'light';
        }

        setResolvedTheme(resolved);
    }, []);

    // Set theme and persist to localStorage
    const setTheme = useCallback((newTheme: ThemeMode) => {
        setThemeState(newTheme);
        localStorage.setItem(THEME_STORAGE_KEY, newTheme);
        applyTheme(resolveTheme(newTheme));
    }, [applyTheme, resolveTheme]);

    // Toggle between light and dark
    const toggleTheme = useCallback(() => {
        const newTheme = resolvedTheme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
    }, [resolvedTheme, setTheme]);

    // Initial theme application
    useEffect(() => {
        applyTheme(resolveTheme(theme));
    }, [theme, applyTheme, resolveTheme]);

    // Listen for system preference changes
    useEffect(() => {
        if (theme !== 'system') return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const handleChange = (e: MediaQueryListEvent) => {
            applyTheme(e.matches ? 'dark' : 'light');
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme, applyTheme]);

    // Prevent flash of wrong theme on initial load
    useEffect(() => {
        // Remove any initial hiding class if present
        document.documentElement.classList.remove('theme-loading');
    }, []);

    return (
        <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}

// Export the context for advanced use cases
export { ThemeContext };
