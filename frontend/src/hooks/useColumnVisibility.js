import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for managing column visibility in tables
 * Handles state, localStorage persistence, and outside click detection
 * 
 * @param {string} storageKey - Unique key for localStorage (e.g., 'collection_columns_123')
 * @param {Array} columns - Array of column objects with { key, label } structure
 * @returns {Object} - { visibleColumns, toggleColumn, showFilter, setShowFilter, filterRef }
 */
export const useColumnVisibility = (storageKey, columns) => {
  const [showFilter, setShowFilter] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState(() => {
    // Default: all columns visible
    const defaults = columns.reduce((acc, col) => ({ ...acc, [col.key]: true }), {});

    if (!storageKey) return defaults;

    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsedStored = JSON.parse(stored);
        // Bug #23: merge stored with defaults so newly added columns are visible
        return { ...defaults, ...parsedStored };
      } catch (error) {
        console.error('Failed to parse stored columns:', error);
      }
    }

    return defaults;
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

