import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuthStore } from '../store';
import { updateUserProfile } from '../api/auth';
import { toast } from 'sonner';
import { debounce } from '../utils/debounce';

export interface PreferenceSettings {
  preferred_currency: string;
  language: string;
  timezone: string;
  notifications_enabled: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  low_stock_alerts: boolean;
  transaction_alerts: boolean;
  marketing_emails: boolean;
  auto_save: boolean;
  default_currency_display: 'symbol' | 'code' | 'both';
}

const DEFAULT_PREFERENCES: PreferenceSettings = {
  preferred_currency: 'PKR',
  language: 'en',
  theme: 'system',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  notifications_enabled: true,
  email_notifications: true,
  push_notifications: true,
  low_stock_alerts: true,
  transaction_alerts: true,
  marketing_emails: false,
  auto_save: true,
  default_currency_display: 'symbol',
};

// Helper function to compare preference objects
function preferencesEqual(a: Partial<PreferenceSettings>, b: Partial<PreferenceSettings>): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    if (a[key as keyof PreferenceSettings] !== b[key as keyof PreferenceSettings]) {
      return false;
    }
  }
  return true;
}

export function usePreferences() {
  const profile = useAuthStore((state) => state.profile);
  const setProfile = useAuthStore((state) => state.setProfile);
  const [preferences, setPreferences] = useState<PreferenceSettings>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Initialize preferences from profile
  useEffect(() => {
    if (profile) {
      const profilePreferences: Partial<PreferenceSettings> = {
        preferred_currency: profile.preferred_currency || DEFAULT_PREFERENCES.preferred_currency,
        language: profile.language || DEFAULT_PREFERENCES.language,
        theme: profile.theme || DEFAULT_PREFERENCES.theme,
        timezone: profile.timezone || DEFAULT_PREFERENCES.timezone,
        notifications_enabled: profile.notifications_enabled ?? DEFAULT_PREFERENCES.notifications_enabled,
        email_notifications: profile.email_notifications ?? DEFAULT_PREFERENCES.email_notifications,
        push_notifications: profile.push_notifications ?? DEFAULT_PREFERENCES.push_notifications,
      };

      // Only update if preferences have actually changed
      setPreferences(prev => {
        const newPreferences = { ...prev, ...profilePreferences };
        if (preferencesEqual(prev, newPreferences)) {
          return prev; // Return same reference to prevent re-render
        }
        return newPreferences;
      });
    }
  }, [profile]);

  // Debounced save function
  const debouncedSave = useMemo(
    () => debounce(async (newPreferences: Partial<PreferenceSettings>) => {
      if (!profile?.id) return;

      setIsLoading(true);
      try {
        await updateUserProfile(profile.id, newPreferences);
        setProfile({ ...profile, ...newPreferences });
        setHasUnsavedChanges(false);
        setLastSaved(new Date());
        toast.success('Preferences saved successfully');
      } catch (error) {
        console.error('Failed to save preferences:', error);
        toast.error('Failed to save preferences');
      } finally {
        setIsLoading(false);
      }
    }, 1000),
    [profile, setProfile]
  );

  // Update preference function
  const updatePreference = useCallback(<K extends keyof PreferenceSettings>(
    key: K,
    value: PreferenceSettings[K]
  ) => {
    setPreferences(prev => {
      const newPreferences = { ...prev, [key]: value };
      setHasUnsavedChanges(true);

      // Auto-save if enabled
      if (newPreferences.auto_save) {
        debouncedSave({ [key]: value });
      }

      return newPreferences;
    });
  }, [debouncedSave]);

  // Bulk update preferences
  const updatePreferences = useCallback((updates: Partial<PreferenceSettings>) => {
    setPreferences(prev => {
      const newPreferences = { ...prev, ...updates };
      setHasUnsavedChanges(true);

      if (newPreferences.auto_save) {
        debouncedSave(updates);
      }

      return newPreferences;
    });
  }, [debouncedSave]);

  // Manual save function
  const savePreferences = useCallback(async () => {
    if (!hasUnsavedChanges || !profile?.id) return;

    setIsLoading(true);
    try {
      await updateUserProfile(profile.id, preferences);
      setProfile({ ...profile, ...preferences });
      setHasUnsavedChanges(false);
      setLastSaved(new Date());
      toast.success('All preferences saved successfully');
    } catch (error) {
      console.error('Failed to save preferences:', error);
      toast.error('Failed to save preferences');
    } finally {
      setIsLoading(false);
    }
  }, [preferences, profile, setProfile, hasUnsavedChanges]);

  // Reset to defaults
  const resetToDefaults = useCallback(async () => {
    if (!profile?.id) return;

    setIsLoading(true);
    try {
      await updateUserProfile(profile.id, DEFAULT_PREFERENCES);
      setPreferences(DEFAULT_PREFERENCES);
      setProfile({ ...profile, ...DEFAULT_PREFERENCES });
      setHasUnsavedChanges(false);
      setLastSaved(new Date());
      toast.success('Preferences reset to defaults');
    } catch (error) {
      console.error('Failed to reset preferences:', error);
      toast.error('Failed to reset preferences');
    } finally {
      setIsLoading(false);
    }
  }, [profile, setProfile]);

  return {
    preferences,
    updatePreference,
    updatePreferences,
    savePreferences,
    resetToDefaults,
    isLoading,
    hasUnsavedChanges,
    lastSaved,
  };
}