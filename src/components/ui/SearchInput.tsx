import { Search, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

interface SearchInputProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function SearchInput({ 
  placeholder = "Search...", 
  value, 
  onChange, 
  className = '' 
}: SearchInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className={`relative w-full ${className}`}>
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <Search className="h-5 w-5 text-gray-400" />
      </div>
      
      <motion.input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        whileFocus={{ scale: 1.02 }}
        className={`block w-full rounded-xl border-0 py-2.5 sm:py-3 pl-10 pr-10 input-dark transition-all duration-200 text-sm sm:text-base ${
          isFocused ? 'shadow-glow ring-2 ring-primary-500/20' : ''
        }`}
      />
      
      {value && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          type="button"
          onClick={() => onChange('')}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-200 transition-colors duration-200"
        >
          <X className="h-5 w-5" />
        </motion.button>
      )}
    </div>
  );
}