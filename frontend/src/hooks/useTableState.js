import { useState, useMemo } from 'react';

/**
 * Custom hook for managing table state (search, sort, pagination, filters)
 * Provides centralized state management for complex tables
 * 
 * @param {Object} options - Configuration options
 * @param {number} options.initialPageSize - Initial items per page (default: 10)
 * @param {Object} options.initialSortConfig - Initial sort configuration { key, direction }
 * @param {Object} options.initialFilters - Initial filter values
 * @returns {Object} - State and handlers for table management
 */
export const useTableState = ({
  initialPageSize = 10,
  initialSortConfig = { key: 'updated_at', direction: 'desc' },
  initialFilters = {}
} = {}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(initialPageSize);
  const [sortConfig, setSortConfig] = useState(initialSortConfig);
  const [filters, setFilters] = useState(initialFilters);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleFilterChange = (filterKey, value) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: value
    }));
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const clearFilters = () => {
    setFilters(initialFilters);
    setCurrentPage(1);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (size) => {
    setItemsPerPage(size);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const resetTable = () => {
    setSearchQuery('');
    setCurrentPage(1);
    setItemsPerPage(initialPageSize);
    setSortConfig(initialSortConfig);
    setFilters(initialFilters);
  };

  // Helper function to apply filters, search, and sort to data
  const processData = (data) => {
    if (!data || !Array.isArray(data)) return [];

    let processed = [...data];

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      processed = processed.filter(item =>
        Object.values(item).some(value =>
          String(value).toLowerCase().includes(query)
        )
      );
    }

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        processed = processed.filter(item => {
          const itemValue = item[key];
          if (typeof value === 'boolean') {
            return itemValue === value;
          }
          return String(itemValue).toLowerCase().includes(String(value).toLowerCase());
        });
      }
    });

    // Apply sort
    if (sortConfig.key) {
      processed.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue === bValue) return 0;
        
        const comparison = aValue < bValue ? -1 : 1;
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    }

    return processed;
  };

  // Calculate pagination
  const getPaginatedData = (data) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const getTotalPages = (dataLength) => {
    return Math.ceil(dataLength / itemsPerPage);
  };

  return {
    // State
    searchQuery,
    currentPage,
    itemsPerPage,
    sortConfig,
    filters,
    
    // Handlers
    handleSearch,
    handleSort,
    handleFilterChange,
    handlePageChange,
    handleItemsPerPageChange,
    clearFilters,
    resetTable,
    
    // Utilities
    processData,
    getPaginatedData,
    getTotalPages
  };
};

