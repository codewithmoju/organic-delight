import { useState, useEffect, useCallback } from 'react';
import { debounce } from '../utils/debounce';

export type FontSize = 'small' | 'medium' | 'large' | 'extra-large';
export type ContrastMode = 'normal' | 'high';
export type ViewMode = 'normal' | 'compact';

export interface AccessibilitySettings {
  fontSize: FontSize;
  animationsEnabled: boolean;
  contrastMode: ContrastMode;
  viewMode: ViewMode;
  itemsPerPage: number;
  reducedMotion: boolean;
}

const DEFAULT_SETTINGS: AccessibilitySettings = {
  fontSize: 'medium',
  animationsEnabled: true,
  contrastMode: 'normal',
  viewMode: 'normal',
  itemsPerPage: 25,
  reducedMotion: false,
};

const STORAGE_KEY = 'stocksuite-accessibility-settings';

export function useAccessibility() {
  const [settings, setSettings] = useState<AccessibilitySettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedSettings = JSON.parse(stored);
        setSettings({ ...DEFAULT_SETTINGS, ...parsedSettings });
      }
    } catch (error) {
      console.error('Failed to load accessibility settings:', error);
    }
  }, []);

  // Apply settings to document
  useEffect(() => {
    applySettingsToDocument(settings);
  }, [settings]);

  // Debounced save to localStorage
  const debouncedSave = useCallback(
    debounce((newSettings: AccessibilitySettings) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
      } catch (error) {
        console.error('Failed to save accessibility settings:', error);
      }
    }, 500),
    []
  );

  // Update individual setting
  const updateSetting = useCallback(<K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: value };
      debouncedSave(newSettings);
      return newSettings;
    });
  }, [debouncedSave]);

  // Update multiple settings
  const updateSettings = useCallback((updates: Partial<AccessibilitySettings>) => {
    setSettings(prev => {
      const newSettings = { ...prev, ...updates };
      debouncedSave(newSettings);
      return newSettings;
    });
  }, [debouncedSave]);

  // Reset to defaults
  const resetToDefaults = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem(STORAGE_KEY);
    applySettingsToDocument(DEFAULT_SETTINGS);
  }, []);

  return {
    settings,
    updateSetting,
    updateSettings,
    resetToDefaults,
    isLoading,
  };
}

function applySettingsToDocument(settings: AccessibilitySettings) {
  const root = document.documentElement;
  
  // Apply font size
  root.setAttribute('data-font-size', settings.fontSize);
  
  // Apply contrast mode
  root.setAttribute('data-contrast', settings.contrastMode);
  
  // Apply view mode
  root.setAttribute('data-view-mode', settings.viewMode);
  
  // Apply animations preference
  root.setAttribute('data-animations', settings.animationsEnabled.toString());
  
  // Apply reduced motion preference
  if (settings.reducedMotion || !settings.animationsEnabled) {
    root.style.setProperty('--animation-duration', '0s');
    root.style.setProperty('--transition-duration', '0s');
  } else {
    root.style.removeProperty('--animation-duration');
    root.style.removeProperty('--transition-duration');
  }

  // Update CSS custom properties for font sizes
  const fontSizeMap = {
    'small': {
      '--font-size-xs': '0.625rem',
      '--font-size-sm': '0.75rem',
      '--font-size-base': '0.875rem',
      '--font-size-lg': '1rem',
      '--font-size-xl': '1.125rem',
      '--font-size-2xl': '1.25rem',
      '--font-size-3xl': '1.5rem',
      '--font-size-4xl': '1.875rem',
    },
    'medium': {
      '--font-size-xs': '0.75rem',
      '--font-size-sm': '0.875rem',
      '--font-size-base': '1rem',
      '--font-size-lg': '1.125rem',
      '--font-size-xl': '1.25rem',
      '--font-size-2xl': '1.5rem',
      '--font-size-3xl': '1.875rem',
      '--font-size-4xl': '2.25rem',
    },
    'large': {
      '--font-size-xs': '0.875rem',
      '--font-size-sm': '1rem',
      '--font-size-base': '1.125rem',
      '--font-size-lg': '1.25rem',
      '--font-size-xl': '1.5rem',
      '--font-size-2xl': '1.875rem',
      '--font-size-3xl': '2.25rem',
      '--font-size-4xl': '3rem',
    },
    'extra-large': {
      '--font-size-xs': '1rem',
      '--font-size-sm': '1.125rem',
      '--font-size-base': '1.25rem',
      '--font-size-lg': '1.5rem',
      '--font-size-xl': '1.875rem',
      '--font-size-2xl': '2.25rem',
      '--font-size-3xl': '3rem',
      '--font-size-4xl': '3.75rem',
    },
  };

  const fontSizes = fontSizeMap[settings.fontSize];
  Object.entries(fontSizes).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });

  // Update spacing for compact view
  if (settings.viewMode === 'compact') {
    root.style.setProperty('--spacing-scale', '0.75');
    root.style.setProperty('--padding-scale', '0.8');
  } else {
    root.style.setProperty('--spacing-scale', '1');
    root.style.setProperty('--padding-scale', '1');
  }
}