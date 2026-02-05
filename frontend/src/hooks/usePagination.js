import { useState, useCallback } from 'react';

export const usePagination = (initialPage = 1, initialLimit = 30) => {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [itemsPerPage, setItemsPerPageState] = useState(initialLimit);

  const goToPage = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const nextPage = useCallback(() => {
    setCurrentPage((prev) => prev + 1);
  }, []);

  const prevPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  }, []);

  const setItemsPerPage = useCallback((limit) => {
    setItemsPerPageState(limit);
    setCurrentPage(1); // Reset to first page
  }, []);

  const reset = useCallback(() => {
    setCurrentPage(initialPage);
    setItemsPerPageState(initialLimit);
  }, [initialPage, initialLimit]);

  return {
    currentPage,
    itemsPerPage,
    goToPage,
    nextPage,
    prevPage,
    setItemsPerPage,
    reset,
  };
};
