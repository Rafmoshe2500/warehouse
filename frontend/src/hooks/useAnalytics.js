import { useQuery } from '@tanstack/react-query';
import analyticsService from '../api/services/analyticsService';
import { QUERY_KEYS } from '../lib/queryKeys';

export const useAnalytics = () => {
    
    // 1. Dashboard General Stats
    const useDashboardStats = (dateRange = {}) => {
        return useQuery({
            // Include dateRange in queryKey to trigger refetch when dates change
            queryKey: [...QUERY_KEYS.analytics.dashboard, dateRange],
            queryFn: async () => {
                const params = {};
                if (dateRange?.startDate) params.start_date = dateRange.startDate;
                if (dateRange?.endDate) params.end_date = dateRange.endDate;
                const data = await analyticsService.getDashboardStats(params);
                return data;
            },
            staleTime: 1000 * 60 * 5, // 5 minutes cache
            placeholderData: (previousData) => previousData,
        });
    };

    // 2. Activity Stats (for specific days range)
    const useActivityStats = (days) => {
        return useQuery({
            queryKey: QUERY_KEYS.analytics.activity(days),
            queryFn: async () => {
                const data = await analyticsService.getActivityStats(days);
                return data;
            },
            staleTime: 1000 * 60 * 5,
            placeholderData: (previousData) => previousData, // Keep old data while fetching
        });
    };

    // 3. Item Project Stats (Search specific chart)
    const useItemProjectStats = (catalogNumber) => {
        return useQuery({
            queryKey: QUERY_KEYS.analytics.itemProject(catalogNumber),
            queryFn: async () => {
                if (!catalogNumber) return null;
                const data = await analyticsService.getItemProjectStats(catalogNumber);
                return data;
            },
            enabled: !!catalogNumber, // Only fetch if catalog number exists
            staleTime: 1000 * 60 * 2, // 2 minutes
        });
    };

    return {
        useDashboardStats,
        useActivityStats,
        useItemProjectStats
    };
};
