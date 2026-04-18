import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMyComponents } from '../useMyComponents';

vi.mock('../../api/services/collectionsService', () => ({
  default: {
    getCollections: vi.fn(),
    createCollection: vi.fn(),
    deleteCollection: vi.fn(),
  },
}));

import collectionsService from '../../api/services/collectionsService';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useMyComponents', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns fetched collections', async () => {
    const mockCollections = [
      { _id: '1', name: 'My Collection', description: 'A test collection' },
    ];
    collectionsService.getCollections.mockResolvedValue(mockCollections);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useMyComponents(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.collections).toEqual(mockCollections);
  });

  it('returns empty array when API returns empty list', async () => {
    collectionsService.getCollections.mockResolvedValue([]);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useMyComponents(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.collections).toEqual([]);
  });

  it('sets isError=true when API call fails', async () => {
    collectionsService.getCollections.mockRejectedValue(new Error('API Error'));

    const wrapper = createWrapper();
    const { result } = renderHook(() => useMyComponents(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isError).toBe(true);
  });

  it('filteredCollections filters by name (case-insensitive)', async () => {
    const mockCollections = [
      { _id: '1', name: 'NetApp Storage', description: 'desc' },
      { _id: '2', name: 'Dell Servers', description: 'desc' },
    ];
    collectionsService.getCollections.mockResolvedValue(mockCollections);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useMyComponents(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.setSearchQuery('netapp'));

    expect(result.current.filteredCollections).toHaveLength(1);
    expect(result.current.filteredCollections[0].name).toBe('NetApp Storage');
  });

  it('filteredCollections filters by description', async () => {
    const mockCollections = [
      { _id: '1', name: 'Collection A', description: 'production gear' },
      { _id: '2', name: 'Collection B', description: 'staging env' },
    ];
    collectionsService.getCollections.mockResolvedValue(mockCollections);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useMyComponents(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.setSearchQuery('production'));

    expect(result.current.filteredCollections).toHaveLength(1);
  });

  it('returns all collections when searchQuery is empty', async () => {
    const mockCollections = [
      { _id: '1', name: 'A', description: '' },
      { _id: '2', name: 'B', description: '' },
    ];
    collectionsService.getCollections.mockResolvedValue(mockCollections);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useMyComponents(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.filteredCollections).toHaveLength(2);
  });

  it('showHeaderCreateButton is false when no collections and no search query', async () => {
    collectionsService.getCollections.mockResolvedValue([]);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useMyComponents(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.showHeaderCreateButton).toBe(false);
  });

  it('showHeaderCreateButton is true when collections exist', async () => {
    collectionsService.getCollections.mockResolvedValue([{ _id: '1', name: 'A' }]);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useMyComponents(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.showHeaderCreateButton).toBe(true);
  });

  it('showHeaderCreateButton is true when there is a search query (even with empty collections)', async () => {
    collectionsService.getCollections.mockResolvedValue([]);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useMyComponents(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.setSearchQuery('some query'));

    expect(result.current.showHeaderCreateButton).toBe(true);
  });

  it('isCreateOpen defaults to false and can be toggled', () => {
    collectionsService.getCollections.mockResolvedValue([]);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useMyComponents(), { wrapper });

    expect(result.current.isCreateOpen).toBe(false);

    act(() => result.current.setIsCreateOpen(true));

    expect(result.current.isCreateOpen).toBe(true);
  });
});
