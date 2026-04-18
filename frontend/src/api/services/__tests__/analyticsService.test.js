import { analyticsService } from '../analyticsService';

vi.mock('../../client', () => ({
  default: {
    get: vi.fn(),
  },
}));

import apiClient from '../../client';

describe('analyticsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDashboardStats', () => {
    it('fetches dashboard stats without params', async () => {
      const mockData = { total_items: 100, allocated: 50 };
      apiClient.get.mockResolvedValue({ data: mockData });

      const result = await analyticsService.getDashboardStats();

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.any(String),
        { params: {} }
      );
      expect(result).toEqual(mockData);
    });

    it('passes date range params when provided', async () => {
      apiClient.get.mockResolvedValue({ data: {} });

      await analyticsService.getDashboardStats({
        start_date: '2024-01-01',
        end_date: '2024-12-31',
      });

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.any(String),
        { params: { start_date: '2024-01-01', end_date: '2024-12-31' } }
      );
    });
  });

  describe('getItemProjectStats', () => {
    it('fetches item project stats for a catalog number', async () => {
      const mockData = { catalog_number: 'CAT-001', projects: [] };
      apiClient.get.mockResolvedValue({ data: mockData });

      const result = await analyticsService.getItemProjectStats('CAT-001');

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('CAT-001')
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('getActivityStats', () => {
    it('fetches activity stats for given days', async () => {
      const mockData = { created: 10, updated: 5 };
      apiClient.get.mockResolvedValue({ data: mockData });

      const result = await analyticsService.getActivityStats(30);

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.any(String),
        { params: { days: 30 } }
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('getActivityTimeline', () => {
    it('fetches timeline with default params', async () => {
      const mockData = [{ date: '2024-01-01', count: 5 }];
      apiClient.get.mockResolvedValue({ data: mockData });

      const result = await analyticsService.getActivityTimeline();

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.any(String),
        { params: { days: 30 } }
      );
      expect(result).toEqual(mockData);
    });

    it('includes catalog_number param when provided', async () => {
      apiClient.get.mockResolvedValue({ data: [] });

      await analyticsService.getActivityTimeline(7, 'CAT-001');

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.any(String),
        { params: { days: 7, catalog_number: 'CAT-001' } }
      );
    });

    it('does not include catalog_number param when null', async () => {
      apiClient.get.mockResolvedValue({ data: [] });

      await analyticsService.getActivityTimeline(14, null);

      const callParams = apiClient.get.mock.calls[0][1].params;
      expect(callParams).not.toHaveProperty('catalog_number');
    });
  });
});
