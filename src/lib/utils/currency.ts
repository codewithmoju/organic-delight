import { SUPPORTED_CURRENCIES } from '../types';

export interface CurrencyRate {
  [key: string]: number;
}

// Mock exchange rates - in production, fetch from a real API
const MOCK_EXCHANGE_RATES: CurrencyRate = {
  USD: 1.0,
  EUR: 0.85,
  GBP: 0.73,
  JPY: 110.0,
  CAD: 1.25,
  AUD: 1.35,
  CHF: 0.92,
  CNY: 6.45,
  INR: 74.5,
  PKR: 278.0,
  SGD: 1.35,
  HKD: 7.8,
  SEK: 8.5,
  NOK: 8.8,
  DKK: 6.3,
  NZD: 1.42,
  MXN: 20.1,
  BRL: 5.2,
  ZAR: 14.8,
  KRW: 1180.0,
};

export function getCurrencySymbol(currencyCode: string): string {
  const currency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode);
  return currency?.symbol || currencyCode;
}

export function getCurrencyName(currencyCode: string): string {
  const currency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode);
  return currency?.name || currencyCode;
}

export function getCurrencyFlag(currencyCode: string): string {
  const currency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode);
  return currency?.flag || '🌍';
}

export function formatCurrencyWithCode(
  amount: number, 
  currencyCode: string = 'USD',
  showCode: boolean = false
): string {
  const currency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode);
  const symbol = currency?.symbol || currencyCode;
  
  // Special formatting for different currencies
  const formatOptions: Intl.NumberFormatOptions = {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  };

  // Adjust decimal places for certain currencies
  if (['JPY', 'KRW'].includes(currencyCode)) {
    formatOptions.minimumFractionDigits = 0;
    formatOptions.maximumFractionDigits = 0;
  }

  const formattedAmount = new Intl.NumberFormat('en-US', formatOptions).format(amount);
  
  if (showCode) {
    return `${symbol}${formattedAmount} ${currencyCode}`;
  }
  
  return `${symbol}${formattedAmount}`;
}

export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): number {
  if (fromCurrency === toCurrency) return amount;
  
  const fromRate = MOCK_EXCHANGE_RATES[fromCurrency] || 1;
  const toRate = MOCK_EXCHANGE_RATES[toCurrency] || 1;
  
  // Convert to USD first, then to target currency
  const usdAmount = amount / fromRate;
  return usdAmount * toRate;
}

export async function fetchExchangeRates(): Promise<CurrencyRate> {
  // In production, replace with actual API call
  // Example: https://api.exchangerate-api.com/v4/latest/USD
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(MOCK_EXCHANGE_RATES);
    }, 500);
  });
}

export function getPopularCurrencies(): string[] {
  return ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'];
}

export function searchCurrencies(query: string): typeof SUPPORTED_CURRENCIES {
  const searchTerm = query.toLowerCase();
  return SUPPORTED_CURRENCIES.filter(currency =>
    currency.code.toLowerCase().includes(searchTerm) ||
    currency.name.toLowerCase().includes(searchTerm)
  );
}