import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import collectionsService from '../api/services/collectionsService';

export const useMyComponents = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: collections = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['collections'],
    queryFn: collectionsService.getCollections
  });

  const filteredCollections = useMemo(() => {
    if (!searchQuery) return collections;
    return collections.filter(col => 
      col.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      col.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [collections, searchQuery]);

  // Derived state to determine if we should show the "main" create button
  // We hide it if there are no collections AND no search query (because we show the empty state button instead)
  const showHeaderCreateButton = collections.length > 0 || searchQuery.length > 0;

  return {
    collections,
    filteredCollections,
    isLoading,
    isError,
    refetch,
    searchQuery,
    setSearchQuery,
    isCreateOpen,
    setIsCreateOpen,
    showHeaderCreateButton
  };
};
