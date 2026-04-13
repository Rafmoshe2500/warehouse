import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('../../../../api/services/bomAnalyticsService', () => ({
  default: {
    getAggregatedTrends: vi.fn(),
    getPartTrends: vi.fn(),
  },
}));

vi.mock('../../../../hooks/useToast', () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
}));

import bomAnalyticsService from '../../../../api/services/bomAnalyticsService';
import { useModelChain } from '../useModelChain';

describe('useModelChain', () => {
  const dateRange = { startDate: '2025-01-01', endDate: '2025-12-31' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with empty chains', () => {
    const { result } = renderHook(() => useModelChain(dateRange));

    expect(result.current.chains).toEqual([]);
    expect(result.current.isAdding).toBe(false);
    expect(result.current.chainChartRows).toEqual([]);
  });

  it('should add a chain with simple (no secondary) slots', async () => {
    bomAnalyticsService.getPartTrends.mockResolvedValue({
      trends: [
        { recorded_at: '2025-06-15', unit_net_price: 5000 },
      ],
    });

    const { result } = renderHook(() => useModelChain(dateRange));

    const slots = [{ mainPart: 'FAS2750', secondaryParts: [] }];
    await act(async () => {
      await result.current.addChain('NetApp Gen1', slots);
    });

    expect(bomAnalyticsService.getPartTrends).toHaveBeenCalledWith('FAS2750', null);
    expect(result.current.chains).toHaveLength(1);
    expect(result.current.chains[0].label).toBe('NetApp Gen1');
  });

  it('should add a chain with aggregation slots', async () => {
    bomAnalyticsService.getAggregatedTrends.mockResolvedValue({
      trends: [
        { recorded_at: '2025-06-15', total_price: 8000 },
      ],
    });

    const { result } = renderHook(() => useModelChain(dateRange));

    const slots = [{ mainPart: 'FAS2750', secondaryParts: ['X6589A', 'X6590A'] }];
    await act(async () => {
      await result.current.addChain('Bundle Chain', slots);
    });

    expect(bomAnalyticsService.getAggregatedTrends).toHaveBeenCalledWith('FAS2750', ['X6589A', 'X6590A']);
    expect(result.current.chains).toHaveLength(1);
  });

  it('should remove chain by id', async () => {
    bomAnalyticsService.getPartTrends.mockResolvedValue({
      trends: [{ recorded_at: '2025-06-15', unit_net_price: 100 }],
    });

    const { result } = renderHook(() => useModelChain(dateRange));

    await act(async () => {
      await result.current.addChain('C1', [{ mainPart: 'P1', secondaryParts: [] }]);
    });

    const chainId = result.current.chains[0].id;
    act(() => result.current.removeChain(chainId));

    expect(result.current.chains).toHaveLength(0);
  });

  it('should not add chain with empty label', async () => {
    const { result } = renderHook(() => useModelChain(dateRange));

    await act(async () => {
      await result.current.addChain('', [{ mainPart: 'P1', secondaryParts: [] }]);
    });

    expect(result.current.chains).toHaveLength(0);
  });

  it('should not add chain with empty slots', async () => {
    const { result } = renderHook(() => useModelChain(dateRange));

    await act(async () => {
      await result.current.addChain('C1', []);
    });

    expect(result.current.chains).toHaveLength(0);
  });

  it('should handle slots without mainPart (empty validSlots) and reset isAdding', async () => {
    const { result } = renderHook(() => useModelChain(dateRange));

    await act(async () => {
      await result.current.addChain('C1', [{ mainPart: '', secondaryParts: [] }]);
    });

    // isAdding should be reset even for empty validSlots
    expect(result.current.isAdding).toBe(false);
    expect(result.current.chains).toHaveLength(0);
  });

  it('should handle partial slot failures with Promise.allSettled', async () => {
    // First slot succeeds, second fails
    bomAnalyticsService.getPartTrends
      .mockResolvedValueOnce({
        trends: [{ recorded_at: '2025-06-15', unit_net_price: 100 }],
      })
      .mockRejectedValueOnce(new Error('Not found'));

    const { result } = renderHook(() => useModelChain(dateRange));

    const slots = [
      { mainPart: 'P1', secondaryParts: [] },
      { mainPart: 'P2', secondaryParts: [] },
    ];

    await act(async () => {
      await result.current.addChain('Mixed', slots);
    });

    // Chain should still be added with data from the successful slot
    expect(result.current.chains).toHaveLength(1);
    expect(result.current.isAdding).toBe(false);
  });

  it('should handle API error in addChain and reset isAdding', async () => {
    bomAnalyticsService.getPartTrends.mockRejectedValue(new Error('Server error'));

    const { result } = renderHook(() => useModelChain(dateRange));

    await act(async () => {
      await result.current.addChain('C1', [{ mainPart: 'P1', secondaryParts: [] }]);
    });

    expect(result.current.isAdding).toBe(false);
  });

  it('should not mutate the dateRange object', async () => {
    const dr = { startDate: '2025-01-01', endDate: '2025-12-31' };
    const originalEnd = dr.endDate;

    bomAnalyticsService.getPartTrends.mockResolvedValue({
      trends: [{ recorded_at: '2025-06-15', unit_net_price: 100 }],
    });

    const { result } = renderHook(() => useModelChain(dr));

    await act(async () => {
      await result.current.addChain('C1', [{ mainPart: 'P1', secondaryParts: [] }]);
    });

    expect(dr.endDate).toBe(originalEnd);
  });

  it('should build chart rows for chains', async () => {
    bomAnalyticsService.getPartTrends.mockResolvedValue({
      trends: [
        { recorded_at: '2025-06-15', unit_net_price: 100 },
        { recorded_at: '2025-07-15', unit_net_price: 110 },
      ],
    });

    const { result } = renderHook(() => useModelChain(dateRange, 'monthly'));

    await act(async () => {
      await result.current.addChain('C1', [{ mainPart: 'P1', secondaryParts: [] }]);
    });

    expect(result.current.chainChartRows.length).toBeGreaterThan(0);
    const row = result.current.chainChartRows[0];
    expect(row.shortDate).toBeDefined();
    expect(row._ts).toBeDefined();
  });
});
