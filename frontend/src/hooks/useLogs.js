import { useQuery } from '@tanstack/react-query';
import logService from '../api/services/logService';
import { QUERY_KEYS } from '../lib/queryKeys';

export const useLogs = (filters = {}, page = 1, limit = 50) => {
  const queryParams = {
    ...filters,
    target_resource: 'item', // Default for Inventory Logs context
    page,
    limit,
  };

  const {
    data,
    isLoading: loading,
    error: queryError,
    refetch
  } = useQuery({
    queryKey: QUERY_KEYS.logs.list(queryParams),
    queryFn: () => logService.getLogs(queryParams),
    placeholderData: (previousData) => previousData,
    keepPreviousData: true, // Keep showing logs while filtering
  });

  const logs = data?.logs || [];
  const totalLogs = data?.total || 0;
  const error = queryError?.message || '';

  return {
    logs,
    totalLogs,
    loading,
    error,
    refetch
  };
};
