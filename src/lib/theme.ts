/**
 * Centralized Theme Configuration
 * 
 * This file contains all color definitions, gradients, and theme tokens
 * extracted from the dashboard design. Use these values throughout the app
 * for consistent theming and easy light/dark mode switching.
 */

// ============================================================================
// COLOR PALETTE
// ============================================================================

export const colors = {
    // Primary Orange Palette (from dashboard active states)
    orange: {
        50: '#FFF7ED',
        100: '#FFEDD5',
        200: '#FED7AA',
        300: '#FDBA74',
        400: '#FB923C',
        500: '#F97316',
        600: '#EA580C',
        700: '#C2410C',
        800: '#9A3412',
        900: '#7C2D12',
    },

    // Neutral/Slate colors (for text and backgrounds)
    slate: {
        50: '#F8FAFC',
        100: '#F1F5F9',
        200: '#E2E8F0',
        300: '#CBD5E1',
        400: '#94A3B8',
        500: '#64748B',
        600: '#475569',
        700: '#334155',
        800: '#1E293B',
        900: '#0F172A',
        950: '#020617',
    },

    // Semantic colors
    success: {
        light: '#86EFAC',
        DEFAULT: '#22C55E',
        dark: '#16A34A',
    },
    warning: {
        light: '#FDE68A',
        DEFAULT: '#F59E0B',
        dark: '#D97706',
    },
    error: {
        light: '#FCA5A5',
        DEFAULT: '#EF4444',
        dark: '#DC2626',
    },
    info: {
        light: '#93C5FD',
        DEFAULT: '#3B82F6',
        dark: '#2563EB',
    },

    // Chart/Accent colors (from dashboard)
    purple: {
        light: '#E9D5FF',
        DEFAULT: '#A855F7',
        dark: '#7C3AED',
    },
} as const;

// ============================================================================
// GRADIENTS
// ============================================================================

export const gradients = {
    // Header gradient (warm peach to orange)
    headerWarm: 'linear-gradient(135deg, #FDBA74 0%, #FB923C 50%, #F97316 100%)',

    // Active button gradient
    primaryButton: 'linear-gradient(135deg, #F97316, #EA580C)',
    primaryButtonHover: 'linear-gradient(135deg, #EA580C, #C2410C)',

    // Sidebar active state
    sidebarActive: 'linear-gradient(90deg, rgba(249, 115, 22, 0.1), rgba(249, 115, 22, 0.05))',

    // Card hover effects
    cardGlow: 'linear-gradient(135deg, rgba(249, 115, 22, 0.05), rgba(251, 146, 60, 0.1))',

    // Dark mode gradients
    darkPrimaryButton: 'linear-gradient(135deg, #FB923C, #F97316)',
    darkHeaderWarm: 'linear-gradient(135deg, #7C2D12 0%, #9A3412 50%, #C2410C 100%)',
} as const;

// ============================================================================
// THEME TOKENS (Light/Dark)
// ============================================================================

export const lightTheme = {
    // Backgrounds
    background: colors.orange[50],           // #FFF7ED - warm cream
    backgroundSecondary: '#FEF3C7',          // Pale yellow/cream
    card: '#FFFFFF',
    cardHover: '#FFFBF5',
    sidebar: '#FFFBF5',
    sidebarActive: colors.orange[50],

    // Text
    foreground: colors.slate[800],           // #1E293B
    foregroundSecondary: colors.slate[500],  // #64748B
    foregroundMuted: colors.slate[400],      // #94A3B8

    // Primary
    primary: colors.orange[500],             // #F97316
    primaryLight: colors.orange[300],        // #FDBA74
    primaryDark: colors.orange[600],         // #EA580C
    primaryForeground: '#FFFFFF',

    // Borders
    border: colors.slate[200],               // #E2E8F0
    borderLight: colors.slate[100],          // #F1F5F9
    borderAccent: colors.orange[200],        // #FED7AA

    // Shadows
    shadowSm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    shadowMd: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    shadowLg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    shadowGlow: '0 0 20px rgba(249, 115, 22, 0.15)',
} as const;

export const darkTheme = {
    // Backgrounds
    background: colors.slate[900],           // #0F172A
    backgroundSecondary: colors.slate[800],  // #1E293B
    card: colors.slate[800],
    cardHover: colors.slate[700],
    sidebar: colors.slate[900],
    sidebarActive: 'rgba(249, 115, 22, 0.1)',

    // Text
    foreground: colors.slate[50],            // #F8FAFC
    foregroundSecondary: colors.slate[300],  // #CBD5E1
    foregroundMuted: colors.slate[400],      // #94A3B8

    // Primary (slightly brighter for dark mode)
    primary: colors.orange[400],             // #FB923C
    primaryLight: colors.orange[300],        // #FDBA74
    primaryDark: colors.orange[500],         // #F97316
    primaryForeground: '#FFFFFF',

    // Borders
    border: colors.slate[700],               // #334155
    borderLight: colors.slate[600],          // #475569
    borderAccent: colors.orange[700],        // #C2410C

    // Shadows
    shadowSm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    shadowMd: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
    shadowLg: '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
    shadowGlow: '0 0 20px rgba(251, 146, 60, 0.2)',
} as const;

// ============================================================================
// THEME TYPE EXPORTS
// ============================================================================

export type ThemeMode = 'light' | 'dark' | 'system';
export type Theme = typeof lightTheme;

export const themes = {
    light: lightTheme,
    dark: darkTheme,
} as const;

// ============================================================================
// CSS VARIABLE HELPERS
// ============================================================================

/**
 * Convert hex color to RGB values for use with Tailwind's opacity modifiers
 */
export function hexToRgb(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return '0 0 0';
    return `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}`;
}

/**
 * Generate CSS custom properties for a theme
 */
export function generateCssVariables(theme: Theme): Record<string, string> {
    return {
        '--background': hexToRgb(theme.background),
        '--background-secondary': hexToRgb(theme.backgroundSecondary),
        '--card': hexToRgb(theme.card),
        '--card-hover': hexToRgb(theme.cardHover),
        '--sidebar': hexToRgb(theme.sidebar),
        '--foreground': hexToRgb(theme.foreground),
        '--foreground-secondary': hexToRgb(theme.foregroundSecondary),
        '--foreground-muted': hexToRgb(theme.foregroundMuted),
        '--primary': hexToRgb(theme.primary),
        '--primary-light': hexToRgb(theme.primaryLight),
        '--primary-dark': hexToRgb(theme.primaryDark),
        '--primary-foreground': hexToRgb(theme.primaryForeground),
        '--border': hexToRgb(theme.border),
        '--border-light': hexToRgb(theme.borderLight),
        '--border-accent': hexToRgb(theme.borderAccent),
    };
}
