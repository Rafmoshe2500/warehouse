import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('../../../../api/services/bomAnalyticsService', () => ({
  default: {
    getAggregatedTrends: vi.fn(),
  },
}));

vi.mock('../../../../hooks/useToast', () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
}));

import bomAnalyticsService from '../../../../api/services/bomAnalyticsService';
import { useAggregation } from '../useAggregation';

describe('useAggregation', () => {
  const dateRange = { startDate: '2025-01-01', endDate: '2025-12-31' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with empty groups', () => {
    const { result } = renderHook(() => useAggregation(dateRange));

    expect(result.current.groups).toEqual([]);
    expect(result.current.isAdding).toBe(false);
    expect(result.current.aggregatedChartRows).toEqual([]);
  });

  it('should add a group with trends', async () => {
    bomAnalyticsService.getAggregatedTrends.mockResolvedValue({
      trends: [
        { recorded_at: '2025-06-15', total_price: 5000 },
        { recorded_at: '2025-07-15', total_price: 4800 },
      ],
    });

    const { result } = renderHook(() => useAggregation(dateRange));

    await act(async () => {
      await result.current.addGroup('NetApp Bundle', 'FAS2750', ['X6589A']);
    });

    expect(bomAnalyticsService.getAggregatedTrends).toHaveBeenCalledWith('FAS2750', ['X6589A']);
    expect(result.current.groups).toHaveLength(1);
    expect(result.current.groups[0].label).toBe('NetApp Bundle');
    expect(result.current.groups[0].trends).toHaveLength(2);
  });

  it('should remove a group by id', async () => {
    bomAnalyticsService.getAggregatedTrends.mockResolvedValue({
      trends: [{ recorded_at: '2025-06-15', total_price: 100 }],
    });

    const { result } = renderHook(() => useAggregation(dateRange));

    await act(async () => {
      await result.current.addGroup('G1', 'P1', ['P2']);
    });

    const groupId = result.current.groups[0].id;
    act(() => result.current.removeGroup(groupId));

    expect(result.current.groups).toHaveLength(0);
  });

  it('should not add group with empty label', async () => {
    const { result } = renderHook(() => useAggregation(dateRange));

    await act(async () => {
      await result.current.addGroup('', 'P1', ['P2']);
    });

    expect(bomAnalyticsService.getAggregatedTrends).not.toHaveBeenCalled();
    expect(result.current.groups).toHaveLength(0);
  });

  it('should not add group with empty secondaryParts', async () => {
    const { result } = renderHook(() => useAggregation(dateRange));

    await act(async () => {
      await result.current.addGroup('G1', 'P1', []);
    });

    expect(bomAnalyticsService.getAggregatedTrends).not.toHaveBeenCalled();
  });

  it('should not add group without mainPart', async () => {
    const { result } = renderHook(() => useAggregation(dateRange));

    await act(async () => {
      await result.current.addGroup('G1', '', ['P2']);
    });

    expect(bomAnalyticsService.getAggregatedTrends).not.toHaveBeenCalled();
  });

  it('should handle empty trends response', async () => {
    bomAnalyticsService.getAggregatedTrends.mockResolvedValue({ trends: [] });

    const { result } = renderHook(() => useAggregation(dateRange));

    await act(async () => {
      await result.current.addGroup('G1', 'P1', ['P2']);
    });

    // Group should not be added when no trends found
    expect(result.current.groups).toHaveLength(0);
  });

  it('should reset isAdding on error', async () => {
    bomAnalyticsService.getAggregatedTrends.mockRejectedValue(new Error('API error'));

    const { result } = renderHook(() => useAggregation(dateRange));

    await act(async () => {
      await result.current.addGroup('G1', 'P1', ['P2']);
    });

    expect(result.current.isAdding).toBe(false);
  });

  it('should not mutate the dateRange object', async () => {
    const dr = { startDate: '2025-01-01', endDate: '2025-12-31' };
    const originalEnd = dr.endDate;

    bomAnalyticsService.getAggregatedTrends.mockResolvedValue({
      trends: [{ recorded_at: '2025-06-15', total_price: 100 }],
    });

    const { result } = renderHook(() => useAggregation(dr));

    await act(async () => {
      await result.current.addGroup('G1', 'P1', ['P2']);
    });

    expect(dr.endDate).toBe(originalEnd);
  });

  it('should build chart rows grouped by month', async () => {
    bomAnalyticsService.getAggregatedTrends.mockResolvedValue({
      trends: [
        { recorded_at: '2025-06-10', total_price: 5000 },
        { recorded_at: '2025-07-20', total_price: 4800 },
      ],
    });

    const { result } = renderHook(() => useAggregation(dateRange, 'monthly'));

    await act(async () => {
      await result.current.addGroup('Bundle', 'P1', ['P2']);
    });

    expect(result.current.aggregatedChartRows).toHaveLength(2);
    // Each row should have the aggregation key
    const row = result.current.aggregatedChartRows[0];
    expect(row.shortDate).toBeDefined();
  });
});
