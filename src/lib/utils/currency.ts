import { SUPPORTED_CURRENCIES } from '../types';

export interface CurrencyRate {
  [key: string]: number;
}

// Mock exchange rates - in production, fetch from a real API
const MOCK_EXCHANGE_RATES: CurrencyRate = {
  PKR: 278.0,
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
  currencyCode: string = 'PKR',
  showCode: boolean = false
): string {
  const resolvedCurrency = currencyCode === 'PKR' ? 'PKR' : 'PKR';
  const currency = SUPPORTED_CURRENCIES.find(c => c.code === resolvedCurrency);
  const symbol = currency?.symbol || currencyCode;

  // Special formatting for different currencies
  const formatOptions: Intl.NumberFormatOptions = {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  };

  const formattedAmount = new Intl.NumberFormat('en-PK', formatOptions).format(amount);

  if (showCode) {
    return `${symbol}${formattedAmount} PKR`;
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
  return ['PKR'];
}

export function searchCurrencies(query: string): typeof SUPPORTED_CURRENCIES {
  const searchTerm = query.toLowerCase();
  return SUPPORTED_CURRENCIES.filter(currency =>
    currency.code.toLowerCase().includes(searchTerm) ||
    currency.name.toLowerCase().includes(searchTerm)
  );
}