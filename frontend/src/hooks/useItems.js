import { useState, useCallback } from 'react';
import itemService from '../api/services/itemService';

export const useItems = () => {
  const [items, setItems] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadItems = async (params = {}) => {
    setLoading(true);
    setError('');
    try {
      const data = await itemService.getItems(params);

      setItems(data.items || []);
      setTotalItems(data.total || 0);
    } catch (err) {
      console.error('Error loading items:', err);
      setError(err.response?.data?.detail || err.message || 'שגיאה בטעינת פריטים');
      setItems([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  const createItem = async (itemData) => await itemService.createItem(itemData);
  const updateItem = useCallback(async (itemId, field, value, isUndo = false) => {
    return await itemService.updateItem(itemId, field, value, isUndo);
  }, []);
  const bulkUpdate = async (itemIds, field, value) => await itemService.bulkUpdate(itemIds, field, value);
  const deleteItem = async (itemId, confirmation) => await itemService.deleteItem(itemId, confirmation);
  const bulkDelete = async (itemIds, confirmation) => await itemService.bulkDelete(itemIds, confirmation);
  const deleteAll = async (confirmation) => await itemService.deleteAll(confirmation);

  // Restore deleted items (for undo functionality)
  const restoreItems = async (deletedItems) => {
    const results = [];
    for (const item of deletedItems) {
      try {
        // Remove _id and timestamps before creating
        const { _id, id, created_at, updated_at, ...itemData } = item;
        // Pass isUndo=true to prevent regular CREATE log
        const result = await itemService.createItem(itemData, true);
        results.push(result);
      } catch (err) {
        console.error('Error restoring item:', err);
      }
    }
    // Refresh the list after restoration
    if (results.length > 0) {
      await loadItems();
    }
    return results;
  };

  return {
    items,
    totalItems,
    loading,
    error,
    loadItems,
    createItem,
    updateItem,
    bulkUpdate,
    deleteItem,
    bulkDelete,
    deleteAll,
    restoreItems,
  };
};
