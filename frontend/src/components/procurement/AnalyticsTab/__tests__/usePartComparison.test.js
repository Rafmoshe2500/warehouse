import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock bomAnalyticsService
vi.mock('../../../../api/services/bomAnalyticsService', () => ({
  default: {
    getPartTrends: vi.fn(),
  },
}));

// Mock useToast
vi.mock('../../../../hooks/useToast', () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
}));

import bomAnalyticsService from '../../../../api/services/bomAnalyticsService';
import { usePartComparison } from '../usePartComparison';

describe('usePartComparison', () => {
  const defaultDateRange = { startDate: '2025-01-01', endDate: '2025-12-31' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with empty state', () => {
    const { result } = renderHook(() => usePartComparison('main', defaultDateRange));

    expect(result.current.activeParts).toEqual([]);
    expect(result.current.chartData).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('should add a part and populate chart data', async () => {
    bomAnalyticsService.getPartTrends.mockResolvedValue({
      trends: [
        { part_number: 'FAS2750', recorded_at: '2025-06-15', unit_net_price: 5000 },
        { part_number: 'FAS2750', recorded_at: '2025-07-20', unit_net_price: 4800 },
      ],
    });

    const { result } = renderHook(() => usePartComparison('main', defaultDateRange, 'monthly'));

    await act(async () => {
      await result.current.addPart('FAS2750');
    });

    expect(bomAnalyticsService.getPartTrends).toHaveBeenCalledWith('FAS2750', 'main');
    expect(result.current.activeParts).toContain('FAS2750');
    expect(result.current.chartData.length).toBeGreaterThan(0);
  });

  it('should remove a part', async () => {
    bomAnalyticsService.getPartTrends.mockResolvedValue({
      trends: [{ part_number: 'P1', recorded_at: '2025-06-15', unit_net_price: 100 }],
    });

    const { result } = renderHook(() => usePartComparison('main', defaultDateRange));

    await act(async () => {
      await result.current.addPart('P1');
    });
    expect(result.current.activeParts).toContain('P1');

    act(() => result.current.removePart('P1'));
    expect(result.current.activeParts).not.toContain('P1');
  });

  it('should handle empty trends gracefully', async () => {
    bomAnalyticsService.getPartTrends.mockResolvedValue({ trends: [] });

    const { result } = renderHook(() => usePartComparison('main', defaultDateRange));

    await act(async () => {
      await result.current.addPart('UNKNOWN');
    });

    expect(result.current.activeParts).toEqual([]);
  });

  it('should handle API errors gracefully', async () => {
    bomAnalyticsService.getPartTrends.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => usePartComparison('main', defaultDateRange));

    await act(async () => {
      await result.current.addPart('P1');
    });

    expect(result.current.activeParts).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('should not mutate the dateRange object', async () => {
    const dateRange = { startDate: '2025-01-01', endDate: '2025-12-31' };
    const originalEndDate = dateRange.endDate;

    bomAnalyticsService.getPartTrends.mockResolvedValue({
      trends: [{ part_number: 'P1', recorded_at: '2025-06-15', unit_net_price: 100 }],
    });

    const { result } = renderHook(() => usePartComparison('main', dateRange, 'monthly'));

    await act(async () => {
      await result.current.addPart('P1');
    });

    // Date range should not have been mutated
    expect(dateRange.endDate).toBe(originalEndDate);
  });

  it('should filter chart data by date range', async () => {
    bomAnalyticsService.getPartTrends.mockResolvedValue({
      trends: [
        { part_number: 'P1', recorded_at: '2024-01-15', unit_net_price: 100 },
        { part_number: 'P1', recorded_at: '2025-06-15', unit_net_price: 200 },
        { part_number: 'P1', recorded_at: '2026-12-15', unit_net_price: 300 },
      ],
    });

    const { result } = renderHook(() => usePartComparison('main', defaultDateRange, 'monthly'));

    await act(async () => {
      await result.current.addPart('P1');
    });

    // Only the trend within 2025 should be in chart data
    expect(result.current.chartData).toHaveLength(1);
    expect(result.current.chartData[0]).toHaveProperty('P1', 200);
  });

  it('should group by monthly resolution', async () => {
    bomAnalyticsService.getPartTrends.mockResolvedValue({
      trends: [
        { part_number: 'P1', recorded_at: '2025-06-05', unit_net_price: 100 },
        { part_number: 'P1', recorded_at: '2025-06-20', unit_net_price: 110 },
      ],
    });

    const { result } = renderHook(() => usePartComparison('main', defaultDateRange, 'monthly'));

    await act(async () => {
      await result.current.addPart('P1');
    });

    // Both should merge into same month bucket, last one wins
    expect(result.current.chartData).toHaveLength(1);
  });

  it('should trim and uppercase query', async () => {
    bomAnalyticsService.getPartTrends.mockResolvedValue({ trends: [] });

    const { result } = renderHook(() => usePartComparison('main', defaultDateRange));

    await act(async () => {
      await result.current.addPart('  fas2750  ');
    });

    expect(bomAnalyticsService.getPartTrends).toHaveBeenCalledWith('FAS2750', 'main');
  });

  it('should not fetch for empty query', async () => {
    const { result } = renderHook(() => usePartComparison('main', defaultDateRange));

    await act(async () => {
      await result.current.addPart('   ');
    });

    expect(bomAnalyticsService.getPartTrends).not.toHaveBeenCalled();
  });
});
