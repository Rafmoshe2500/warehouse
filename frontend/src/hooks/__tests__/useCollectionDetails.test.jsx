import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { useCollectionDetails } from '../useCollectionDetails';

// Mock collectionsService
vi.mock('../../api/services/collectionsService', () => ({
  default: {
    getCollection: vi.fn(),
    getCollectionItems: vi.fn(),
    removeItem: vi.fn(),
    updateItem: vi.fn(),
    bulkRemoveItems: vi.fn(),
  },
}));

// Mock itemService
vi.mock('../../api/services/itemService', () => ({
  default: {
    bulkUpdate: vi.fn(),
  },
}));

// Mock ToastContext (useCollectionDetails uses showToast from ToastContext)
vi.mock('../../context/ToastContext', () => ({
  useToast: () => ({
    showToast: vi.fn(),
    addToast: vi.fn(),
  }),
}));

import collectionsService from '../../api/services/collectionsService';
import itemService from '../../api/services/itemService';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }) => (
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </MemoryRouter>
  );
};

const MOCK_COLLECTION_ID = 'col-abc-123';

describe('useCollectionDetails - Data Fetching', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches collection details on mount', async () => {
    const mockCollection = { _id: MOCK_COLLECTION_ID, name: 'My Collection', role: 'OWNER' };
    collectionsService.getCollection.mockResolvedValue(mockCollection);
    collectionsService.getCollectionItems.mockResolvedValue([]);

    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useCollectionDetails(MOCK_COLLECTION_ID),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isCollectionLoading).toBe(false));

    expect(result.current.collection).toEqual(mockCollection);
    expect(collectionsService.getCollection).toHaveBeenCalledWith(MOCK_COLLECTION_ID);
  });

  it('fetches collection items on mount', async () => {
    const mockItems = [{ item_id: 'item-1', catalog_number: 'CAT-001' }];
    collectionsService.getCollection.mockResolvedValue({ _id: MOCK_COLLECTION_ID, role: 'OWNER' });
    collectionsService.getCollectionItems.mockResolvedValue(mockItems);

    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useCollectionDetails(MOCK_COLLECTION_ID),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isItemsLoading).toBe(false));

    expect(result.current.items).toEqual(mockItems);
  });

  it('does NOT fetch when collectionId is null/undefined', () => {
    const wrapper = createWrapper();
    renderHook(() => useCollectionDetails(null), { wrapper });

    expect(collectionsService.getCollection).not.toHaveBeenCalled();
    expect(collectionsService.getCollectionItems).not.toHaveBeenCalled();
  });
});

describe('useCollectionDetails - Permissions', () => {
  beforeEach(() => vi.clearAllMocks());

  it('isOwner is true when collection role is OWNER', async () => {
    collectionsService.getCollection.mockResolvedValue({ role: 'owner' });
    collectionsService.getCollectionItems.mockResolvedValue([]);

    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useCollectionDetails(MOCK_COLLECTION_ID),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isCollectionLoading).toBe(false));

    expect(result.current.isOwner).toBe(true);
  });

  it('isOwner is false when collection role is RW', async () => {
    collectionsService.getCollection.mockResolvedValue({ role: 'rw' });
    collectionsService.getCollectionItems.mockResolvedValue([]);

    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useCollectionDetails(MOCK_COLLECTION_ID),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isCollectionLoading).toBe(false));

    expect(result.current.isOwner).toBe(false);
    expect(result.current.canEdit).toBe(true);
  });

  it('canEdit is false when role is RO', async () => {
    collectionsService.getCollection.mockResolvedValue({ role: 'ro' });
    collectionsService.getCollectionItems.mockResolvedValue([]);

    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useCollectionDetails(MOCK_COLLECTION_ID),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isCollectionLoading).toBe(false));

    expect(result.current.canEdit).toBe(false);
  });
});

describe('useCollectionDetails - Delete Modal State', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    collectionsService.getCollection.mockResolvedValue({ role: 'owner' });
    collectionsService.getCollectionItems.mockResolvedValue([
      { item_id: 'item-1', catalog_number: 'CAT-001' },
    ]);
  });

  it('deleteModal starts closed', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useCollectionDetails(MOCK_COLLECTION_ID),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isCollectionLoading).toBe(false));

    expect(result.current.deleteModal.isOpen).toBe(false);
  });

  it('handleUnassignItem opens delete modal with single item', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useCollectionDetails(MOCK_COLLECTION_ID),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isCollectionLoading).toBe(false));

    act(() => {
      result.current.handleUnassignItem({ item_id: 'item-1', catalog_number: 'CAT-001' });
    });

    expect(result.current.deleteModal.isOpen).toBe(true);
    expect(result.current.deleteModal.itemIds).toEqual(['item-1']);
    expect(result.current.deleteModal.message).toContain('CAT-001');
  });

  it('handleBulkRemoveItems opens delete modal with multiple items', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useCollectionDetails(MOCK_COLLECTION_ID),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isCollectionLoading).toBe(false));

    act(() => {
      result.current.handleBulkRemoveItems(['item-1', 'item-2', 'item-3']);
    });

    expect(result.current.deleteModal.isOpen).toBe(true);
    expect(result.current.deleteModal.itemIds).toHaveLength(3);
    expect(result.current.deleteModal.message).toContain('3');
  });

  it('handleDeleteClose resets modal state', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useCollectionDetails(MOCK_COLLECTION_ID),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isCollectionLoading).toBe(false));

    act(() => result.current.handleUnassignItem({ item_id: 'item-1', catalog_number: 'X' }));
    act(() => result.current.handleDeleteClose());

    expect(result.current.deleteModal.isOpen).toBe(false);
    expect(result.current.deleteModal.itemIds).toHaveLength(0);
  });
});

describe('useCollectionDetails - Tab State', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    collectionsService.getCollection.mockResolvedValue({ role: 'owner' });
    collectionsService.getCollectionItems.mockResolvedValue([]);
  });

  it('activeTab defaults to "items"', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useCollectionDetails(MOCK_COLLECTION_ID),
      { wrapper }
    );

    expect(result.current.activeTab).toBe('items');
  });

  it('setActiveTab updates activeTab', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useCollectionDetails(MOCK_COLLECTION_ID),
      { wrapper }
    );

    act(() => result.current.setActiveTab('details'));

    expect(result.current.activeTab).toBe('details');
  });
});
