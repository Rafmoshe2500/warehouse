import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import collectionsService from '../api/services/collectionsService';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';

export const useCollectionDetails = (collectionId) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('items');

  // Fetch Collection Details
  const { data: collection, isLoading: isCollectionLoading } = useQuery({
    queryKey: ['collection', collectionId],
    queryFn: () => collectionsService.getCollection(collectionId),
    enabled: !!collectionId
  });

  // Fetch Collection Items
  const { data: items = [], isLoading: isItemsLoading } = useQuery({
    queryKey: ['collectionItems', collectionId],
    queryFn: () => collectionsService.getCollectionItems(collectionId),
    enabled: !!collectionId
  });

  // Mutations
  const unassignMutation = useMutation({
    mutationFn: (itemId) => collectionsService.removeItem(collectionId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries(['collectionItems', collectionId]);
      showToast('הפריט הוסר מהאוסף בהצלחה', 'success');
    },
    onError: () => showToast('שגיאה בהסרת הפריט', 'error')
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ itemId, data }) => collectionsService.updateItem(collectionId, itemId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['collectionItems', collectionId]);
      showToast('הפריט עודכן בהצלחה', 'success');
    },
    onError: () => showToast('שגיאה בעדכון הפריט', 'error')
  });

  const bulkRemoveMutation = useMutation({
    mutationFn: (itemIds) => collectionsService.bulkRemoveItems(collectionId, itemIds),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['collectionItems', collectionId]);
      showToast(`נמחקו ${data.deleted} פריטים בהצלחה`, 'success');
    },
    onError: () => showToast('שגיאה במחיקת פריטים', 'error')
  });

  const handleUnassignItem = (item) => {
    const itemId = item.item_id || item; // Handle object or ID fallback
    const sku = item.catalog_number || 'Unknown';
    if (window.confirm(`האם אתה בטוח שברצונך להסיר את פריט ${sku} מהאוסף?`)) {
      unassignMutation.mutate(itemId);
    }
  };

  const handleBulkRemoveItems = (itemIds) => {
      if (window.confirm(`האם אתה בטוח שברצונך להסיר ${itemIds.length} פריטים מהאוסף?`)) {
          bulkRemoveMutation.mutate(itemIds);
      }
  };

  const handleUpdateItem = (itemId, data) => {
    updateItemMutation.mutate({ itemId, data });
  };

  const isOwner = collection?.role?.toUpperCase() === 'OWNER';
  const canEdit = collection?.role?.toUpperCase() === 'OWNER' || collection?.role?.toUpperCase() === 'RW';

  return {
    collection,
    items,
    isCollectionLoading,
    isItemsLoading,
    activeTab,
    setActiveTab,
    isOwner,
    canEdit,
    handleUnassignItem,
    handleBulkRemoveItems,
    handleUpdateItem,
    navigate
  };
};
