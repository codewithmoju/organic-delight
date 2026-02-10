import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import type { ThemeMode } from '../../lib/theme';

interface ThemeToggleProps {
    showLabels?: boolean;
    className?: string;
}

export function ThemeToggle({ showLabels = false, className = '' }: ThemeToggleProps) {
    const { theme, setTheme } = useTheme();

    const themes: { value: ThemeMode; icon: React.ReactNode; label: string }[] = [
        { value: 'light', icon: <Sun className="w-4 h-4" />, label: 'Light' },
        { value: 'dark', icon: <Moon className="w-4 h-4" />, label: 'Dark' },
        { value: 'system', icon: <Monitor className="w-4 h-4" />, label: 'System' },
    ];

    return (
        <div className={`flex items-center gap-1 p-1 rounded-xl bg-[rgb(var(--secondary))] ${className}`}>
            {themes.map(({ value, icon, label }) => (
                <button
                    key={value}
                    onClick={() => setTheme(value)}
                    className={`
            flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
            ${theme === value
                            ? 'bg-[rgb(var(--card))] text-[rgb(var(--primary))] shadow-sm'
                            : 'text-[rgb(var(--foreground-secondary))] hover:text-[rgb(var(--foreground))]'
                        }
          `}
                    aria-label={`Switch to ${label} mode`}
                    title={`${label} mode`}
                >
                    {icon}
                    {showLabels && <span>{label}</span>}
                </button>
            ))}
        </div>
    );
}

interface SimpleThemeToggleProps {
    className?: string;
}

export function SimpleThemeToggle({ className = '' }: SimpleThemeToggleProps) {
    const { toggleTheme, resolvedTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className={`
        p-2.5 rounded-xl transition-all duration-200
        bg-[rgb(var(--secondary))] hover:bg-[rgb(var(--card))]
        text-[rgb(var(--foreground-secondary))] hover:text-[rgb(var(--primary))]
        ${className}
      `}
            aria-label={`Switch to ${resolvedTheme === 'light' ? 'dark' : 'light'} mode`}
            title={`Switch to ${resolvedTheme === 'light' ? 'dark' : 'light'} mode`}
        >
            {resolvedTheme === 'light' ? (
                <Moon className="w-5 h-5" />
            ) : (
                <Sun className="w-5 h-5" />
            )}
        </button>
    );
}

export default ThemeToggle;
