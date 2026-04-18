import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useItems } from '../useItems';

// Mock itemService
vi.mock('../../api/services/itemService', () => ({
  default: {
    getItems: vi.fn(),
    createItem: vi.fn(),
    updateItem: vi.fn(),
    bulkUpdate: vi.fn(),
    deleteItem: vi.fn(),
    bulkDelete: vi.fn(),
  },
}));

import itemService from '../../api/services/itemService';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useItems', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('returns empty items and 0 total when no queryParams', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useItems(null), { wrapper });

      expect(result.current.items).toEqual([]);
      expect(result.current.totalItems).toBe(0);
    });

    it('does not fetch when queryParams is null (disabled)', () => {
      const wrapper = createWrapper();
      renderHook(() => useItems(null), { wrapper });

      expect(itemService.getItems).not.toHaveBeenCalled();
    });
  });

  describe('fetching items', () => {
    it('fetches items when queryParams is provided', async () => {
      const mockItems = [
        { _id: '1', catalog_number: 'CAT-001', description: 'Item 1' },
        { _id: '2', catalog_number: 'CAT-002', description: 'Item 2' },
      ];
      itemService.getItems.mockResolvedValue({ items: mockItems, total: 2 });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useItems({ page: 1, limit: 20 }), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.items).toEqual(mockItems);
      expect(result.current.totalItems).toBe(2);
      expect(itemService.getItems).toHaveBeenCalledWith({ page: 1, limit: 20 });
    });

    it('sets error message on fetch failure', async () => {
      const errorMsg = 'Server error';
      itemService.getItems.mockRejectedValue({ message: errorMsg });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useItems({ page: 1 }), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.error).toBe(errorMsg);
      expect(result.current.items).toEqual([]);
    });

    it('returns detail from response.data.detail if present', async () => {
      itemService.getItems.mockRejectedValue({
        response: { data: { detail: 'Forbidden' } },
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useItems({ page: 1 }), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.error).toBe('Forbidden');
    });
  });

  describe('createItem', () => {
    it('calls itemService.createItem and invalidates queries', async () => {
      const newItem = { catalog_number: 'NEW-001', description: 'New' };
      itemService.getItems.mockResolvedValue({ items: [], total: 0 });
      itemService.createItem.mockResolvedValue({ _id: '3', ...newItem });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useItems({ page: 1 }), { wrapper });

      await act(async () => {
        await result.current.createItem(newItem);
      });

      expect(itemService.createItem).toHaveBeenCalledWith(newItem);
    });
  });

  describe('updateItem', () => {
    it('calls itemService.updateItem with correct args', async () => {
      itemService.getItems.mockResolvedValue({ items: [], total: 0 });
      itemService.updateItem.mockResolvedValue({ _id: '1', name: 'Updated' });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useItems({ page: 1 }), { wrapper });

      await act(async () => {
        await result.current.updateItem('1', 'description', 'Updated value', false);
      });

      expect(itemService.updateItem).toHaveBeenCalledWith('1', 'description', 'Updated value', false);
    });
  });

  describe('deleteItem', () => {
    it('calls itemService.deleteItem with id and confirmation', async () => {
      itemService.getItems.mockResolvedValue({ items: [], total: 0 });
      itemService.deleteItem.mockResolvedValue({ message: 'Deleted' });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useItems({ page: 1 }), { wrapper });

      await act(async () => {
        await result.current.deleteItem('1', 'delete');
      });

      expect(itemService.deleteItem).toHaveBeenCalledWith('1', 'delete');
    });
  });

  describe('bulkUpdate', () => {
    it('calls itemService.bulkUpdate with ids, field, value', async () => {
      itemService.getItems.mockResolvedValue({ items: [], total: 0 });
      itemService.bulkUpdate.mockResolvedValue({ updated: 2 });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useItems({ page: 1 }), { wrapper });

      await act(async () => {
        await result.current.bulkUpdate(['1', '2'], 'location', 'Lab');
      });

      expect(itemService.bulkUpdate).toHaveBeenCalledWith(['1', '2'], 'location', 'Lab');
    });
  });

  describe('bulkDelete', () => {
    it('calls itemService.bulkDelete with ids and confirmation', async () => {
      itemService.getItems.mockResolvedValue({ items: [], total: 0 });
      itemService.bulkDelete.mockResolvedValue({ deleted: 3 });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useItems({ page: 1 }), { wrapper });

      await act(async () => {
        await result.current.bulkDelete(['1', '2', '3'], 'delete');
      });

      expect(itemService.bulkDelete).toHaveBeenCalledWith(['1', '2', '3'], 'delete');
    });
  });

  describe('restoreItems', () => {
    it('creates each deleted item via itemService.createItem', async () => {
      itemService.getItems.mockResolvedValue({ items: [], total: 0 });
      itemService.createItem.mockResolvedValue({ _id: 'new-1' });

      const deletedItems = [
        { _id: 'old-1', id: 'old-1', catalog_number: 'CAT-001', created_at: '2024-01-01', updated_at: '2024-01-02' },
      ];

      const wrapper = createWrapper();
      const { result } = renderHook(() => useItems({ page: 1 }), { wrapper });

      await act(async () => {
        await result.current.restoreItems(deletedItems);
      });

      // Should have been called without _id, id, created_at, updated_at
      expect(itemService.createItem).toHaveBeenCalledWith({ catalog_number: 'CAT-001' }, true);
    });
  });
});
