import { useState, useMemo } from 'react';
import { COLLECTION_TABLE_COLUMNS } from '../constants/tableConfig';

/**
 * Manages sort, per-column filters, and global search for the collection items table.
 */
export const useCollectionTableData = (items) => {
  const [sortConfig, setSortConfig]     = useState({ key: null, direction: 'asc' });
  const [filters, setFilters]           = useState({});
  const [showFilters, setShowFilters]   = useState(false);
  const [searchQuery, setSearchQuery]   = useState('');

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleFilterChange = (key, value) =>
    setFilters(prev => ({ ...prev, [key]: value }));

  const processedItems = useMemo(() => {
    let result = [...items];

    // 1. Global search
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(item =>
        COLLECTION_TABLE_COLUMNS.some(col =>
          String(item[col.key] || '').toLowerCase().includes(q)
        )
      );
    }

    // 2. Per-column filters
    result = result.filter(item => {
      for (const key in filters) {
        if (filters[key] && !String(item[key] || '').toLowerCase().includes(filters[key].toLowerCase()))
          return false;
      }
      return true;
    });

    // 3. Sort
    if (sortConfig.key) {
      result.sort((a, b) => {
        const aVal = a[sortConfig.key] ?? '';
        const bVal = b[sortConfig.key] ?? '';
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ?  1 : -1;
        return 0;
      });
    }

    return result;
  }, [items, searchQuery, filters, sortConfig]);

  return {
    processedItems,
    sortConfig,
    filters,
    showFilters,
    searchQuery,
    setShowFilters,
    setSearchQuery,
    handleSort,
    handleFilterChange,
  };
};

