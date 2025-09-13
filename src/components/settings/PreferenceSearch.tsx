import { Search } from 'lucide-react';
import { motion } from 'framer-motion';

interface PreferenceSearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
}

export default function PreferenceSearch({
  onSearch,
  placeholder = "Search preferences...",
  className = ''
}: PreferenceSearchProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card-dark p-4 ${className}`}
    >
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder={placeholder}
          onChange={(e) => onSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 input-dark"
        />
      </div>
    </motion.div>
  );
}