import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  startIndex: number;
  endIndex: number;
  totalItems: number;
  className?: string;
}

export default function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
  hasNextPage,
  hasPrevPage,
  startIndex,
  endIndex,
  totalItems,
  className = ''
}: PaginationControlsProps) {
  // Generate page numbers to show
  const getPageNumbers = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  if (totalPages <= 1) return null;

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}>
      {/* Results Info */}
      <div className="text-sm text-gray-400">
        Showing <span className="font-medium text-white">{startIndex}</span> to{' '}
        <span className="font-medium text-white">{endIndex}</span> of{' '}
        <span className="font-medium text-white">{totalItems}</span> results
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center space-x-2">
        {/* First Page */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onPageChange(1)}
          disabled={!hasPrevPage}
          className={`p-2 rounded-lg transition-all duration-200 ${
            !hasPrevPage
              ? 'bg-gray-600/30 text-gray-500 cursor-not-allowed'
              : 'bg-dark-600/50 text-gray-300 hover:bg-dark-600/70 hover:text-white'
          }`}
          aria-label="Go to first page"
        >
          <ChevronsLeft className="w-4 h-4" />
        </motion.button>

        {/* Previous Page */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!hasPrevPage}
          className={`p-2 rounded-lg transition-all duration-200 ${
            !hasPrevPage
              ? 'bg-gray-600/30 text-gray-500 cursor-not-allowed'
              : 'bg-dark-600/50 text-gray-300 hover:bg-dark-600/70 hover:text-white'
          }`}
          aria-label="Go to previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </motion.button>

        {/* Page Numbers */}
        <div className="flex items-center space-x-1">
          {getPageNumbers().map((pageNum, index) => (
            <motion.button
              key={index}
              whileHover={pageNum !== '...' ? { scale: 1.05 } : {}}
              whileTap={pageNum !== '...' ? { scale: 0.95 } : {}}
              onClick={() => typeof pageNum === 'number' ? onPageChange(pageNum) : undefined}
              disabled={pageNum === '...'}
              className={`min-w-[40px] h-10 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                pageNum === currentPage
                  ? 'bg-primary-600 text-white shadow-glow'
                  : pageNum === '...'
                  ? 'text-gray-500 cursor-default'
                  : 'bg-dark-600/50 text-gray-300 hover:bg-dark-600/70 hover:text-white'
              }`}
              aria-label={pageNum === '...' ? undefined : `Go to page ${pageNum}`}
              aria-current={pageNum === currentPage ? 'page' : undefined}
            >
              {pageNum}
            </motion.button>
          ))}
        </div>

        {/* Next Page */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasNextPage}
          className={`p-2 rounded-lg transition-all duration-200 ${
            !hasNextPage
              ? 'bg-gray-600/30 text-gray-500 cursor-not-allowed'
              : 'bg-dark-600/50 text-gray-300 hover:bg-dark-600/70 hover:text-white'
          }`}
          aria-label="Go to next page"
        >
          <ChevronRight className="w-4 h-4" />
        </motion.button>

        {/* Last Page */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onPageChange(totalPages)}
          disabled={!hasNextPage}
          className={`p-2 rounded-lg transition-all duration-200 ${
            !hasNextPage
              ? 'bg-gray-600/30 text-gray-500 cursor-not-allowed'
              : 'bg-dark-600/50 text-gray-300 hover:bg-dark-600/70 hover:text-white'
          }`}
          aria-label="Go to last page"
        >
          <ChevronsRight className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  );
}