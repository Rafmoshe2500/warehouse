import { renderHook, act } from '@testing-library/react';
import { useAddToCollection } from '../useAddToCollection';

// Mock the collectionsService module
vi.mock('../../api/services/collectionsService', () => ({
  default: {
    getCollections: vi.fn(),
    bulkAddItem: vi.fn(),
  },
}));

import collectionsService from '../../api/services/collectionsService';

describe('useAddToCollection', () => {
  const mockAddToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    collectionsService.getCollections.mockResolvedValue([
      { id: 'col1', name: 'Collection A', role: 'owner' },
      { id: 'col2', name: 'Collection B', role: 'rw' },
      { id: 'col3', name: 'Collection C', role: 'ro' },
    ]);
  });

  it('should fetch writable collections on mount', async () => {
    const { result } = renderHook(() => useAddToCollection(true, mockAddToast));

    // Wait for useEffect to complete
    await vi.waitFor(() => {
      expect(result.current.userCollections).toHaveLength(2);
    });

    // Only owner and rw collections
    expect(result.current.userCollections[0].id).toBe('col1');
    expect(result.current.userCollections[1].id).toBe('col2');
  });

  it('should filter out read-only collections', async () => {
    const { result } = renderHook(() => useAddToCollection(true, mockAddToast));

    await vi.waitFor(() => {
      expect(result.current.userCollections).toHaveLength(2);
    });

    const roles = result.current.userCollections.map(c => c.role.toLowerCase());
    expect(roles).not.toContain('ro');
  });

  it('should handle fetch error gracefully', async () => {
    collectionsService.getCollections.mockRejectedValue(new Error('Network error'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useAddToCollection(true, mockAddToast));

    await vi.waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });

    expect(result.current.userCollections).toEqual([]);
    consoleSpy.mockRestore();
  });

  it('should add items to collection successfully', async () => {
    collectionsService.bulkAddItem.mockResolvedValue({ added: 3 });
    const onSuccess = vi.fn();

    const { result } = renderHook(() => useAddToCollection(true, mockAddToast));

    await act(async () => {
      await result.current.handleAddToCollection(
        { id: 'col1', name: 'Collection A' },
        ['item1', 'item2', 'item3'],
        onSuccess
      );
    });

    expect(collectionsService.bulkAddItem).toHaveBeenCalledWith('col1', {
      item_ids: ['item1', 'item2', 'item3'],
      custom_values: {},
    });
    expect(mockAddToast).toHaveBeenCalledWith('הפריטים נוספו בהצלחה ל-Collection A', 'success');
    expect(onSuccess).toHaveBeenCalled();
  });

  it('should not add when no items selected', async () => {
    const { result } = renderHook(() => useAddToCollection(true, mockAddToast));

    await act(async () => {
      await result.current.handleAddToCollection(
        { id: 'col1', name: 'Collection A' },
        [],
        vi.fn()
      );
    });

    expect(collectionsService.bulkAddItem).not.toHaveBeenCalled();
  });

  it('should show warning toast on duplicate items', async () => {
    collectionsService.bulkAddItem.mockRejectedValue({
      response: { data: { detail: 'Some items already in collection' } },
    });

    const { result } = renderHook(() => useAddToCollection(true, mockAddToast));

    await act(async () => {
      await result.current.handleAddToCollection(
        { id: 'col1', name: 'Collection A' },
        ['item1'],
        vi.fn()
      );
    });

    expect(mockAddToast).toHaveBeenCalledWith(expect.stringContaining('כבר קיימים'), 'warning');
  });

  it('should show error toast on generic failure', async () => {
    collectionsService.bulkAddItem.mockRejectedValue({
      response: { data: { detail: 'Server error' } },
    });

    const { result } = renderHook(() => useAddToCollection(true, mockAddToast));

    await act(async () => {
      await result.current.handleAddToCollection(
        { id: 'col1', name: 'Collection A' },
        ['item1'],
        vi.fn()
      );
    });

    expect(mockAddToast).toHaveBeenCalledWith('Server error', 'error');
  });

  it('should open and close collections modal', () => {
    const { result } = renderHook(() => useAddToCollection(true, mockAddToast));
    const mockItem = { _id: 'item1', catalog_number: 'CAT-001' };

    act(() => {
      result.current.openCollectionsModal(mockItem);
    });
    expect(result.current.collectionsModalItem).toEqual(mockItem);

    act(() => {
      result.current.closeCollectionsModal();
    });
    expect(result.current.collectionsModalItem).toBeNull();
  });
});
