import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for managing column visibility in tables
 * Handles state, localStorage persistence, and outside click detection
 * 
 * @param {string} storageKey - Unique key for localStorage (e.g., 'collection_columns_123')
 * @param {Array} columns - Array of column objects with { key, label } structure
 * @returns {Object} - { visibleColumns, toggleColumn, showFilter, setShowFilter, filterRef }
 */
const useColumnVisibility = (storageKey, columns) => {
  const [showFilter, setShowFilter] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState(() => {
    // Load from localStorage or default to all visible
    if (!storageKey) {
      return columns.reduce((acc, col) => ({ ...acc, [col.key]: true }), {});
    }
    
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.error('Failed to parse stored columns:', error);
      }
    }
    
    // Default: all columns visible
    return columns.reduce((acc, col) => ({ ...acc, [col.key]: true }), {});
  });
  
  const filterRef = useRef(null);

  // Save to localStorage whenever visibleColumns changes
  useEffect(() => {
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(visibleColumns));
    }
  }, [visibleColumns, storageKey]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setShowFilter(false);
      }
    };
    
    if (showFilter) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showFilter]);

  const toggleColumn = (columnKey) => {
    setVisibleColumns(prev => ({
      ...prev,
      [columnKey]: !prev[columnKey]
    }));
  };

  const resetColumns = () => {
    const allVisible = columns.reduce((acc, col) => ({ ...acc, [col.key]: true }), {});
    setVisibleColumns(allVisible);
  };

  return {
    visibleColumns,
    toggleColumn,
    resetColumns,
    showFilter,
    setShowFilter,
    filterRef
  };
};

export default useColumnVisibility;
