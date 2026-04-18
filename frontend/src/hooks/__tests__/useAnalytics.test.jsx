import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAnalytics } from '../useAnalytics';

vi.mock('../../api/services/analyticsService', () => ({
  default: {
    getDashboardStats: vi.fn(),
    getActivityStats: vi.fn(),
    getItemProjectStats: vi.fn(),
  },
}));

import analyticsService from '../../api/services/analyticsService';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useAnalytics', () => {
  beforeEach(() => vi.clearAllMocks());

  it('exposes useDashboardStats, useActivityStats, useItemProjectStats', () => {
    analyticsService.getDashboardStats.mockResolvedValue({});

    const wrapper = createWrapper();
    const { result } = renderHook(() => useAnalytics(), { wrapper });

    expect(typeof result.current.useDashboardStats).toBe('function');
    expect(typeof result.current.useActivityStats).toBe('function');
    expect(typeof result.current.useItemProjectStats).toBe('function');
  });

  describe('useDashboardStats', () => {
    it('fetches dashboard stats and returns data', async () => {
      const mockStats = { total_items: 200, allocated: 80 };
      analyticsService.getDashboardStats.mockResolvedValue(mockStats);

      const wrapper = createWrapper();

      // useDashboardStats is a hook returned by useAnalytics — use inline
      const { result } = renderHook(
        () => {
          const { useDashboardStats } = useAnalytics();
          return useDashboardStats({});
        },
        { wrapper }
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.data).toEqual(mockStats);
      expect(analyticsService.getDashboardStats).toHaveBeenCalledWith({});
    });

    it('passes date range params when provided', async () => {
      analyticsService.getDashboardStats.mockResolvedValue({});

      const wrapper = createWrapper();
      renderHook(
        () => {
          const { useDashboardStats } = useAnalytics();
          return useDashboardStats({ startDate: '2024-01-01', endDate: '2024-12-31' });
        },
        { wrapper }
      );

      await waitFor(() => expect(analyticsService.getDashboardStats).toHaveBeenCalled());

      expect(analyticsService.getDashboardStats).toHaveBeenCalledWith({
        start_date: '2024-01-01',
        end_date: '2024-12-31',
      });
    });
  });

  describe('useActivityStats', () => {
    it('fetches activity stats for given days', async () => {
      const mockActivity = { created: 5, updated: 10 };
      analyticsService.getActivityStats.mockResolvedValue(mockActivity);

      const wrapper = createWrapper();
      const { result } = renderHook(
        () => {
          const { useActivityStats } = useAnalytics();
          return useActivityStats(30);
        },
        { wrapper }
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.data).toEqual(mockActivity);
      expect(analyticsService.getActivityStats).toHaveBeenCalledWith(30);
    });
  });

  describe('useItemProjectStats', () => {
    it('fetches item project stats when catalogNumber provided', async () => {
      const mockData = { catalog_number: 'CAT-001', projects: [] };
      analyticsService.getItemProjectStats.mockResolvedValue(mockData);

      const wrapper = createWrapper();
      const { result } = renderHook(
        () => {
          const { useItemProjectStats } = useAnalytics();
          return useItemProjectStats('CAT-001');
        },
        { wrapper }
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.data).toEqual(mockData);
      expect(analyticsService.getItemProjectStats).toHaveBeenCalledWith('CAT-001');
    });

    it('does not fetch when catalogNumber is null (disabled)', () => {
      const wrapper = createWrapper();
      renderHook(
        () => {
          const { useItemProjectStats } = useAnalytics();
          return useItemProjectStats(null);
        },
        { wrapper }
      );

      expect(analyticsService.getItemProjectStats).not.toHaveBeenCalled();
    });
  });
});
