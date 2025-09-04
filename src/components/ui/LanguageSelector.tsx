import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Check, Globe, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from '../../i18n';

interface LanguageSelectorProps {
  variant?: 'dropdown' | 'menu' | 'compact';
  showSearch?: boolean;
  className?: string;
}

export default function LanguageSelector({ 
  variant = 'dropdown', 
  showSearch = true,
  className = '' 
}: LanguageSelectorProps) {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredLanguages, setFilteredLanguages] = useState(SUPPORTED_LANGUAGES);

  const currentLanguage = SUPPORTED_LANGUAGES.find(lang => lang.code === i18n.language) || SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    if (searchQuery) {
      const filtered = SUPPORTED_LANGUAGES.filter(lang =>
        lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lang.code.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredLanguages(filtered);
    } else {
      setFilteredLanguages(SUPPORTED_LANGUAGES);
    }
  }, [searchQuery]);

  const handleLanguageChange = async (languageCode: string) => {
    try {
      await i18n.changeLanguage(languageCode);
      setIsOpen(false);
      setSearchQuery('');
      toast.success(`Language changed to ${SUPPORTED_LANGUAGES.find(l => l.code === languageCode)?.name}`);
      
      // Update user preference in profile if available
      try {
        const authStorage = localStorage.getItem('auth-storage');
        if (authStorage) {
          const { state } = JSON.parse(authStorage);
          if (state?.profile) {
            // Update user's language preference in the database
            console.log('Language preference updated for user:', languageCode);
          }
        }
      } catch (error) {
        console.warn('Could not update user language preference:', error);
      }
    } catch (error) {
      console.error('Failed to change language:', error);
      toast.error('Failed to change language. Please try again.');
    }
  };

  if (variant === 'compact') {
    return (
      <div className={`relative ${className}`}>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 p-2 rounded-lg hover:bg-dark-700/50 transition-colors"
        >
          <span className="text-xl">{currentLanguage.flag}</span>
          <span className="text-sm font-medium text-gray-300 hidden sm:inline">
            {currentLanguage.code.toUpperCase()}
          </span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </motion.button>

        <AnimatePresence>
          {isOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40"
                onClick={() => setIsOpen(false)}
              />
              
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="absolute top-full right-0 mt-2 w-64 bg-dark-800 border border-dark-600/50 rounded-xl shadow-dark-lg z-50 max-h-80 overflow-hidden"
              >
                <div className="p-3 border-b border-dark-700/50">
                  <div className="flex items-center space-x-2">
                    <Globe className="w-4 h-4 text-primary-400" />
                    <span className="text-sm font-medium text-white">Select Language</span>
                  </div>
                </div>
                
                <div className="max-h-64 overflow-y-auto">
                  {filteredLanguages.map((language) => (
                    <motion.button
                      key={language.code}
                      whileHover={{ backgroundColor: 'rgba(51, 65, 85, 0.5)' }}
                      onClick={() => handleLanguageChange(language.code)}
                      className={`w-full flex items-center justify-between p-3 text-left transition-all duration-200 ${
                        currentLanguage.code === language.code
                          ? 'bg-primary-500/10 text-primary-400'
                          : 'text-gray-300 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{language.flag}</span>
                        <div>
                          <div className="font-medium">{language.nativeName}</div>
                          <div className="text-xs opacity-75">{language.name}</div>
                        </div>
                      </div>
                      {currentLanguage.code === language.code && (
                        <Check className="w-4 h-4 text-primary-400" />
                      )}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (variant === 'menu') {
    return (
      <div className={className}>
        {SUPPORTED_LANGUAGES.map((language) => (
          <motion.button
            key={language.code}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleLanguageChange(language.code)}
            className={`w-full flex items-center px-4 py-3 text-left transition-all duration-200 rounded-lg ${
              currentLanguage.code === language.code
                ? 'bg-primary-500/20 text-primary-400'
                : 'text-gray-300 hover:bg-dark-700/50 hover:text-white'
            }`}
          >
            <span className="text-lg mr-3">{language.flag}</span>
            <div className="flex-1">
              <div className="font-medium">{language.nativeName}</div>
              <div className="text-xs opacity-75">{language.name}</div>
            </div>
            {currentLanguage.code === language.code && (
              <Check className="w-4 h-4 text-primary-400" />
            )}
          </motion.button>
        ))}
      </div>
    );
  }

  // Default dropdown variant
  return (
    <div className={`relative ${className}`}>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 sm:p-4 rounded-xl bg-dark-700/50 border border-dark-600/50 hover:border-primary-500/50 transition-all duration-200 text-left"
      >
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{currentLanguage.flag}</span>
          <div>
            <div className="text-white font-semibold">
              {currentLanguage.nativeName}
            </div>
            <div className="text-gray-400 text-sm">
              {currentLanguage.name}
            </div>
          </div>
        </div>
        <ChevronDown className="w-5 h-5 text-gray-400" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 bg-dark-800 border border-dark-600/50 rounded-xl shadow-dark-lg z-50 max-h-96 overflow-hidden"
            >
              {showSearch && (
                <div className="p-4 border-b border-dark-700/50">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search languages..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-dark-700/50 border border-dark-600/50 rounded-lg text-white placeholder-gray-400 focus:border-primary-500/50 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="max-h-64 overflow-y-auto">
                {filteredLanguages.length === 0 ? (
                  <div className="p-4 text-center text-gray-400">
                    No languages found
                  </div>
                ) : (
                  filteredLanguages.map((language) => (
                    <motion.button
                      key={language.code}
                      whileHover={{ backgroundColor: 'rgba(51, 65, 85, 0.5)' }}
                      onClick={() => handleLanguageChange(language.code)}
                      className={`w-full flex items-center justify-between p-3 text-left transition-all duration-200 ${
                        currentLanguage.code === language.code
                          ? 'bg-primary-500/10 text-primary-400'
                          : 'text-gray-300 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">{language.flag}</span>
                        <div>
                          <div className="font-medium">{language.nativeName}</div>
                          <div className="text-sm opacity-75">
                            {language.name}
                          </div>
                        </div>
                      </div>
                      {currentLanguage.code === language.code && (
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