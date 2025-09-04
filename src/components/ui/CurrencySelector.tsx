import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Check, Globe, Star } from 'lucide-react';
import { SUPPORTED_CURRENCIES } from '../../lib/types';
import { searchCurrencies, getPopularCurrencies, getCurrencyFlag } from '../../lib/utils/currency';

interface CurrencySelectorProps {
  selectedCurrency: string;
  onCurrencyChange: (currency: string) => void;
  showPopular?: boolean;
  className?: string;
}

export default function CurrencySelector({
  selectedCurrency,
  onCurrencyChange,
  showPopular = true,
  className = ''
}: CurrencySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCurrencies, setFilteredCurrencies] = useState(SUPPORTED_CURRENCIES);

  const popularCurrencies = getPopularCurrencies();
  const selectedCurrencyData = SUPPORTED_CURRENCIES.find(c => c.code === selectedCurrency);

  useEffect(() => {
    if (searchQuery) {
      setFilteredCurrencies(searchCurrencies(searchQuery));
    } else {
      setFilteredCurrencies(SUPPORTED_CURRENCIES);
    }
  }, [searchQuery]);

  const handleCurrencySelect = (currencyCode: string) => {
    onCurrencyChange(currencyCode);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className={`relative ${className}`}>
      {/* Currency Selector Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 sm:p-4 rounded-xl bg-dark-700/50 border border-dark-600/50 hover:border-primary-500/50 transition-all duration-200 text-left"
      >
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{getCurrencyFlag(selectedCurrency)}</span>
          <div>
            <div className="text-white font-semibold">
              {selectedCurrencyData?.name || selectedCurrency}
            </div>
            <div className="text-gray-400 text-sm">
              {selectedCurrencyData?.symbol} {selectedCurrency}
            </div>
          </div>
        </div>
        <Globe className="w-5 h-5 text-gray-400" />
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 bg-dark-800 border border-dark-600/50 rounded-xl shadow-dark-lg z-50 max-h-96 overflow-hidden"
            >
              {/* Search */}
              <div className="p-4 border-b border-dark-700/50">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search currencies..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-dark-700/50 border border-dark-600/50 rounded-lg text-white placeholder-gray-400 focus:border-primary-500/50 focus:outline-none"
                  />
                </div>
              </div>

              {/* Popular Currencies */}
              {showPopular && !searchQuery && (
                <div className="p-4 border-b border-dark-700/50">
                  <div className="flex items-center mb-3">
                    <Star className="w-4 h-4 text-warning-400 mr-2" />
                    <span className="text-sm font-medium text-gray-300">Popular</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {popularCurrencies.map((currencyCode) => {
                      const currency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode);
                      if (!currency) return null;
                      
                      return (
                        <motion.button
                          key={currencyCode}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleCurrencySelect(currencyCode)}
                          className={`p-2 rounded-lg text-center transition-all duration-200 ${
                            selectedCurrency === currencyCode
                              ? 'bg-primary-500/20 text-primary-400 border border-primary-500/50'
                              : 'bg-dark-700/30 text-gray-300 hover:bg-dark-600/50'
                          }`}
                        >
                          <div className="text-lg mb-1">{currency.flag}</div>
                          <div className="text-xs font-medium">{currency.code}</div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* All Currencies */}
              <div className="max-h-64 overflow-y-auto">
                {filteredCurrencies.length === 0 ? (
                  <div className="p-4 text-center text-gray-400">
                    No currencies found
                  </div>
                ) : (
                  filteredCurrencies.map((currency) => (
                    <motion.button
                      key={currency.code}
                      whileHover={{ backgroundColor: 'rgba(51, 65, 85, 0.5)' }}
                      onClick={() => handleCurrencySelect(currency.code)}
                      className={`w-full flex items-center justify-between p-3 text-left transition-all duration-200 ${
                        selectedCurrency === currency.code
                          ? 'bg-primary-500/10 text-primary-400'
                          : 'text-gray-300 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">{currency.flag}</span>
                        <div>
                          <div className="font-medium">{currency.name}</div>
                          <div className="text-sm opacity-75">
                            {currency.symbol} {currency.code}
                          </div>
                        </div>
                      </div>
                      {selectedCurrency === currency.code && (
                        <Check className="w-5 h-5 text-primary-400" />
                      )}
                    </motion.button>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}