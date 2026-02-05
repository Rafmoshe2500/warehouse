import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import itemService from '../api/services/itemService';
import { QUERY_KEYS } from '../lib/queryKeys';

export const useStaleItems = (days, page, limit) => {
  const queryClient = useQueryClient();
  const params = { days, page, limit };

  // --- Query (Read) ---
  const { 
    data, 
    isLoading: loading, 
    error: queryError,
    refetch 
  } = useQuery({
    queryKey: QUERY_KEYS.items.stale(params),
    queryFn: () => itemService.getStaleItems(days, page, limit),
    placeholderData: (previousData) => previousData,
  });

  const items = data?.items || [];
  const totalItems = data?.total || 0;
  const error = queryError?.response?.data?.detail || queryError?.message || '';

  // --- Mutations (Write) ---
  // We can reuse the invalidation logic from useItems or invoke refetch directly
  
  const invalidateStaleItems = () => {
    return queryClient.invalidateQueries({ queryKey: ['items', 'stale'] });
  };

  // Helper mutation specifically for updates from Stale Items page
  // Note: Standard updateItem is often enough, but this ensures our specific list updates
  const updateStaleItemMutation = useMutation({
    mutationFn: ({ itemId, field, value }) => 
      itemService.updateItem(itemId, field, value),
    onSuccess: () => {
        // Invalidate both main items list and stale list
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.items.all });
    },
  });

  return {
    items,
    totalItems,
    loading,
    error,
    refreshParams: params,
    refetchStale: refetch,
    updateStaleItem: updateStaleItemMutation.mutateAsync,
  };
};
