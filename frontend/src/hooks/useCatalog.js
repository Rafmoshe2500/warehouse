import { useQuery } from '@tanstack/react-query';
import { catalogService } from '../api/services';
import { QUERY_KEYS } from '../lib/queryKeys';

export const useCatalog = (queryParams = {}) => {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching
  } = useQuery({
    queryKey: QUERY_KEYS.catalog.list(queryParams),
    queryFn: async () => {
      const result = await catalogService.getCatalog(queryParams);
      return result;
    },
    keepPreviousData: true,
    staleTime: 30000, // 30 seconds
  });

  return {
    items: data?.items || [],
    totalItems: data?.total || 0,
    totalPages: data?.pages || 0,
    currentPage: data?.page || 1,
    loading: isLoading || isFetching,
    isError,
    error,
    refetch
  };
};
