import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuthStore } from '../store';
import { updateUserProfile } from '../api/auth';
import { toast } from 'sonner';
import { debounce } from '../utils/debounce';

// Deep comparison utility for preference objects
function deepEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true;
  if (obj1 == null || obj2 == null) return false;
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return false;
  
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) return false;
  
  for (const key of keys1) {
    if (!keys2.includes(key)) return false;
    if (!deepEqual(obj1[key], obj2[key])) return false;
  }
  
  return true;
}

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
  preferred_currency: 'USD',
  language: 'en',
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
        timezone: profile.timezone || DEFAULT_PREFERENCES.timezone,
        notifications_enabled: profile.notifications_enabled ?? DEFAULT_PREFERENCES.notifications_enabled,
        email_notifications: profile.email_notifications ?? DEFAULT_PREFERENCES.email_notifications,
        push_notifications: profile.push_notifications ?? DEFAULT_PREFERENCES.push_notifications,
      };
      
      setPreferences(prev => {
        // Create new preferences object with profile data
        const newPreferences = { ...prev, ...profilePreferences };
        
        // Only update if there are actual changes using deep comparison
        if (deepEqual(prev, newPreferences)) {
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
      // Don't update if value is the same
      if (prev[key] === value) {
        return prev;
      }
      
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
      // Check if any values are actually different
      const hasChanges = Object.keys(updates).some(
        key => prev[key as keyof PreferenceSettings] !== updates[key as keyof PreferenceSettings]
      );
      
      if (!hasChanges) {
        return prev; // No changes, return same reference
      }
      
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