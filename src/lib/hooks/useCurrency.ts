import { useState, useEffect } from 'react';
import { useAuthStore } from '../store';
import { getPOSSettings } from '../api/pos';
import { formatCurrencyWithCode } from '../utils/currency';

export function useCurrency() {
  const profile = useAuthStore((state) => state.profile);
  const [currency, setCurrency] = useState<string>('USD');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCurrency();
  }, [profile]);

  const loadCurrency = async () => {
    try {
      // Priority: POS settings > User profile > Default
      const posSettings = await getPOSSettings();
      setCurrency(posSettings.currency || profile?.preferred_currency || 'USD');
    } catch (error) {
      // Fallback to user profile or default
      setCurrency(profile?.preferred_currency || 'USD');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number, currencyOverride?: string) => {
    return formatCurrencyWithCode(amount, currencyOverride || currency);
  };

  return {
    currency,
    formatCurrency,
    isLoading,
    refreshCurrency: loadCurrency
  };
}