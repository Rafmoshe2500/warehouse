import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLogs } from '../useLogs';

vi.mock('../../api/services/logService', () => ({
  default: {
    getLogs: vi.fn(),
  },
}));

import logService from '../../api/services/logService';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useLogs', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches logs with default params', async () => {
    const mockLogs = [
      { _id: '1', action: 'create', username: 'alice' },
      { _id: '2', action: 'update', username: 'bob' },
    ];
    logService.getLogs.mockResolvedValue({ logs: mockLogs, total: 2 });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useLogs(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.logs).toEqual(mockLogs);
    expect(result.current.totalLogs).toBe(2);
    expect(result.current.error).toBe('');
  });

  it('returns empty logs array initially', () => {
    logService.getLogs.mockResolvedValue({ logs: [], total: 0 });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useLogs(), { wrapper });

    // Before fetch resolves
    expect(result.current.logs).toEqual([]);
    expect(result.current.totalLogs).toBe(0);
  });

  it('passes filters to logService.getLogs', async () => {
    logService.getLogs.mockResolvedValue({ logs: [], total: 0 });

    const filters = { action: 'create', username: 'alice' };
    const wrapper = createWrapper();
    renderHook(() => useLogs(filters, 2, 25), { wrapper });

    await waitFor(() => {
      expect(logService.getLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'create',
          username: 'alice',
          page: 2,
          limit: 25,
        })
      );
    });
  });

  it('always includes target_resource: "item" in query params', async () => {
    logService.getLogs.mockResolvedValue({ logs: [], total: 0 });

    const wrapper = createWrapper();
    renderHook(() => useLogs({}, 1, 50), { wrapper });

    await waitFor(() => {
      expect(logService.getLogs).toHaveBeenCalledWith(
        expect.objectContaining({ target_resource: 'item' })
      );
    });
  });

  it('exposes error message on failure', async () => {
    logService.getLogs.mockRejectedValue(new Error('Network failure'));

    const wrapper = createWrapper();
    const { result } = renderHook(() => useLogs(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('Network failure');
    expect(result.current.logs).toEqual([]);
  });
});
