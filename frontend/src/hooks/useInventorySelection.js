import { useState, useCallback } from 'react';

/**
 * Hook for managing inventory item selection
 * @param {Array} items - The current list of items in the table
 * @returns {Object} Selection state and handlers
 */
export const useInventorySelection = (items = []) => {
    const [selectedItems, setSelectedItems] = useState([]);
    const [lastSelectedId, setLastSelectedId] = useState(null);

    const handleSelectItem = useCallback((id) => {
        setSelectedItems(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
        setLastSelectedId(id);
    }, []);

    const handleSelectAll = useCallback(() => {
        if (!items || items.length === 0) return;
        
        const allIds = items.map(i => i._id);
        const isAllSelected = allIds.every(id => selectedItems.includes(id));
        
        if (isAllSelected) {
            setSelectedItems([]);
        } else {
            setSelectedItems(allIds);
        }
    }, [items, selectedItems]);

    // Helper to clear selection
    const clearSelection = useCallback(() => {
        setSelectedItems([]);
        setLastSelectedId(null);
    }, []);

    return {
        selectedItems,
        setSelectedItems,
        lastSelectedId,
        setLastSelectedId,
        handleSelectItem,
        handleSelectAll,
        clearSelection
    };
};
