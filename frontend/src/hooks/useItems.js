import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import itemService from '../api/services/itemService';
import { QUERY_KEYS } from '../lib/queryKeys';

export const useItems = (queryParams = null) => {
  const queryClient = useQueryClient();

  // --- Query (Read) ---
  // Only run query if queryParams is provided
  const { 
    data, 
    isLoading: loading, 
    error: queryError,
    refetch 
  } = useQuery({
    queryKey: QUERY_KEYS.items.list(queryParams),
    queryFn: () => itemService.getItems(queryParams),
    enabled: !!queryParams, // Only fetch when params are available
    placeholderData: (previousData) => previousData, // Keep previous data while fetching new page
  });

  const items = data?.items || [];
  const totalItems = data?.total || 0;
  const error = queryError?.response?.data?.detail || queryError?.message || '';

  // --- Mutations (Write) ---
  
  const invalidateItems = () => {
    return queryClient.invalidateQueries({ queryKey: QUERY_KEYS.items.all });
  };

  const createItemMutation = useMutation({
    mutationFn: (itemData) => itemService.createItem(itemData),
    onSuccess: () => invalidateItems(),
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ itemId, field, value, isUndo }) => 
      itemService.updateItem(itemId, field, value, isUndo),
    onSuccess: () => invalidateItems(),
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: ({ itemIds, field, value }) => 
      itemService.bulkUpdate(itemIds, field, value),
    onSuccess: () => invalidateItems(),
  });

  const deleteItemMutation = useMutation({
    mutationFn: ({ itemId, confirmation }) => 
      itemService.deleteItem(itemId, confirmation),
    onSuccess: () => invalidateItems(),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: ({ itemIds, confirmation }) => 
      itemService.bulkDelete(itemIds, confirmation),
    onSuccess: () => invalidateItems(),
  });

  const restoreItems = async (deletedItems) => {
    const results = [];
    for (const item of deletedItems) {
      try {
        const { _id, id, created_at, updated_at, ...itemData } = item;
        // isUndo=true
        const result = await itemService.createItem(itemData, true);
        results.push(result);
      } catch (err) {
        console.error('Error restoring item:', err);
      }
    }
    if (results.length > 0) {
      await invalidateItems();
    }
    return results;
  };

  return {
    items,
    totalItems,
    loading,
    error,
    // Wrapper functions to maintain similar API, but returns Promises
    loadItems: refetch, // Note: loadItems no longer takes params here!
    createItem: createItemMutation.mutateAsync,
    updateItem: (itemId, field, value, isUndo) => 
      updateItemMutation.mutateAsync({ itemId, field, value, isUndo }),
    bulkUpdate: (itemIds, field, value) => 
      bulkUpdateMutation.mutateAsync({ itemIds, field, value }),
    deleteItem: (itemId, confirmation) => 
      deleteItemMutation.mutateAsync({ itemId, confirmation }),
    bulkDelete: (itemIds, confirmation) => 
      bulkDeleteMutation.mutateAsync({ itemIds, confirmation }),
    restoreItems,
  };
};
