import { useState, useEffect, useMemo } from 'react';
import { useAccessibility } from './useAccessibility';

interface UsePaginationProps<T> {
  data: T[];
  defaultItemsPerPage?: number;
}

interface PaginationResult<T> {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  paginatedData: T[];
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;
  setItemsPerPage: (items: number) => void;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  startIndex: number;
  endIndex: number;
  totalItems: number;
}

export function usePagination<T>({ 
  data, 
  defaultItemsPerPage = 25 
}: UsePaginationProps<T>): PaginationResult<T> {
  const { settings } = useAccessibility();
  const [currentPage, setCurrentPage] = useState(1);
  
  // Use accessibility setting for items per page
  const itemsPerPage = settings.itemsPerPage || defaultItemsPerPage;

  // Reset to first page when data changes or items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [data.length, itemsPerPage]);

  // Calculate pagination values
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, data.length);
  
  const paginatedData = useMemo(() => {
    return data.slice(startIndex, endIndex);
  }, [data, startIndex, endIndex]);

  const goToPage = (page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);

  const setItemsPerPageHandler = (items: number) => {
    // This will be handled by the accessibility hook
    console.log('Items per page changed to:', items);
  };

  return {
    currentPage,
    totalPages,
    itemsPerPage,
    paginatedData,
    goToPage,
    nextPage,
    prevPage,
    goToFirstPage,
    goToLastPage,
    setItemsPerPage: setItemsPerPageHandler,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
    startIndex: startIndex + 1, // 1-based for display
    endIndex,
    totalItems: data.length,
  };
}