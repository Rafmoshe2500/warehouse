import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import api from '../../client';
import bomAnalyticsService from '../bomAnalyticsService';

describe('bomAnalyticsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── seedHistoricalData ────────────────────────────────────
  describe('seedHistoricalData', () => {
    it('should post to seed endpoint', async () => {
      api.post.mockResolvedValue({ data: { seeded: 100 } });

      const result = await bomAnalyticsService.seedHistoricalData();

      expect(api.post).toHaveBeenCalledWith('/bom-analytics/seed');
      expect(result).toEqual({ seeded: 100 });
    });
  });

  // ── getPartTrends ─────────────────────────────────────────
  describe('getPartTrends', () => {
    it('should fetch trends for a part number', async () => {
      const trends = { trends: [{ recorded_at: '2025-01-01', unit_net_price: 100 }] };
      api.get.mockResolvedValue({ data: trends });

      const result = await bomAnalyticsService.getPartTrends('FAS2750');

      expect(api.get).toHaveBeenCalledWith('/bom-analytics/trends/FAS2750', { params: {} });
      expect(result).toEqual(trends);
    });

    it('should pass itemType when provided', async () => {
      api.get.mockResolvedValue({ data: { trends: [] } });

      await bomAnalyticsService.getPartTrends('X6589A', 'component');

      expect(api.get).toHaveBeenCalledWith('/bom-analytics/trends/X6589A', {
        params: { item_type: 'component' },
      });
    });

    it('should not pass itemType when null', async () => {
      api.get.mockResolvedValue({ data: { trends: [] } });

      await bomAnalyticsService.getPartTrends('P1', null);

      expect(api.get).toHaveBeenCalledWith('/bom-analytics/trends/P1', { params: {} });
    });
  });

  // ── getVendorDiscounts ────────────────────────────────────
  describe('getVendorDiscounts', () => {
    it('should fetch with default months', async () => {
      api.get.mockResolvedValue({ data: { discounts: [] } });

      await bomAnalyticsService.getVendorDiscounts();

      expect(api.get).toHaveBeenCalledWith('/bom-analytics/vendor-discounts', {
        params: { months: 12 },
      });
    });

    it('should pass custom months', async () => {
      api.get.mockResolvedValue({ data: { discounts: [] } });

      await bomAnalyticsService.getVendorDiscounts(6);

      expect(api.get).toHaveBeenCalledWith('/bom-analytics/vendor-discounts', {
        params: { months: 6 },
      });
    });
  });

  // ── searchParts ───────────────────────────────────────────
  describe('searchParts', () => {
    it('should search with query', async () => {
      api.get.mockResolvedValue({ data: { parts: ['FAS2750', 'FAS8300'] } });

      const result = await bomAnalyticsService.searchParts('FAS');

      expect(api.get).toHaveBeenCalledWith('/bom-analytics/search-parts', {
        params: { q: 'FAS' },
      });
      expect(result.parts).toHaveLength(2);
    });

    it('should pass itemType filter', async () => {
      api.get.mockResolvedValue({ data: { parts: [] } });

      await bomAnalyticsService.searchParts('X6589', 'main');

      expect(api.get).toHaveBeenCalledWith('/bom-analytics/search-parts', {
        params: { q: 'X6589', item_type: 'main' },
      });
    });

    it('should omit itemType when null', async () => {
      api.get.mockResolvedValue({ data: { parts: [] } });

      await bomAnalyticsService.searchParts('test', null);

      expect(api.get).toHaveBeenCalledWith('/bom-analytics/search-parts', {
        params: { q: 'test' },
      });
    });
  });

  // ── getAggregatedTrends ───────────────────────────────────
  describe('getAggregatedTrends', () => {
    it('should post aggregation params', async () => {
      const trends = { trends: [{ recorded_at: '2025-01-01', total_price: 5000 }] };
      api.post.mockResolvedValue({ data: trends });

      const result = await bomAnalyticsService.getAggregatedTrends('FAS2750', ['X6589A', 'X6590A']);

      expect(api.post).toHaveBeenCalledWith('/bom-analytics/aggregate-trends', {
        main_part: 'FAS2750',
        secondary_parts: ['X6589A', 'X6590A'],
      });
      expect(result).toEqual(trends);
    });

    it('should handle empty secondary parts', async () => {
      api.post.mockResolvedValue({ data: { trends: [] } });

      await bomAnalyticsService.getAggregatedTrends('P1', []);

      expect(api.post).toHaveBeenCalledWith('/bom-analytics/aggregate-trends', {
        main_part: 'P1',
        secondary_parts: [],
      });
    });
  });

  // ── getVendorSpending ─────────────────────────────────────
  describe('getVendorSpending', () => {
    it('should fetch with default resolution', async () => {
      api.get.mockResolvedValue({ data: { data: [] } });

      await bomAnalyticsService.getVendorSpending();

      expect(api.get).toHaveBeenCalledWith('/bom-analytics/vendor-spending', {
        params: { resolution: 'monthly' },
      });
    });

    it('should pass date range params', async () => {
      api.get.mockResolvedValue({ data: { data: [] } });

      await bomAnalyticsService.getVendorSpending('daily', '2025-01-01', '2025-12-31');

      expect(api.get).toHaveBeenCalledWith('/bom-analytics/vendor-spending', {
        params: { resolution: 'daily', start_date: '2025-01-01', end_date: '2025-12-31' },
      });
    });
  });
});
