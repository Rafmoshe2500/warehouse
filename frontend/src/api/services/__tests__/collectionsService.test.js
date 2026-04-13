/**
 * Tests for collectionsService with Dependency Injection
 */
import { createCollectionsService } from '../collectionsService';
import { API_ENDPOINTS } from '../../endpoints';

describe('collectionsService with Dependency Injection', () => {
  let mockApiClient;
  let service;

  beforeEach(() => {
    mockApiClient = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    };
    service = createCollectionsService(mockApiClient);
  });

  describe('getCollections', () => {
    it('should fetch all collections', async () => {
      const mockData = [{ id: '1', name: 'Col A' }, { id: '2', name: 'Col B' }];
      mockApiClient.get.mockResolvedValue({ data: mockData });

      const result = await service.getCollections();

      expect(mockApiClient.get).toHaveBeenCalledWith(API_ENDPOINTS.COLLECTIONS);
      expect(result).toEqual(mockData);
    });
  });

  describe('getCollection', () => {
    it('should fetch collection by ID', async () => {
      const mockData = { id: '1', name: 'Col A' };
      mockApiClient.get.mockResolvedValue({ data: mockData });

      const result = await service.getCollection('1');

      expect(mockApiClient.get).toHaveBeenCalledWith(API_ENDPOINTS.COLLECTION_BY_ID('1'));
      expect(result).toEqual(mockData);
    });
  });

  describe('createCollection', () => {
    it('should create a new collection', async () => {
      const newCol = { name: 'New Collection', description: 'Test' };
      const mockData = { id: '3', ...newCol };
      mockApiClient.post.mockResolvedValue({ data: mockData });

      const result = await service.createCollection(newCol);

      expect(mockApiClient.post).toHaveBeenCalledWith(API_ENDPOINTS.COLLECTIONS, newCol);
      expect(result).toEqual(mockData);
    });
  });

  describe('updateCollection', () => {
    it('should update an existing collection', async () => {
      const updates = { name: 'Updated Name' };
      const mockData = { id: '1', name: 'Updated Name' };
      mockApiClient.put.mockResolvedValue({ data: mockData });

      const result = await service.updateCollection('1', updates);

      expect(mockApiClient.put).toHaveBeenCalledWith(API_ENDPOINTS.COLLECTION_BY_ID('1'), updates);
      expect(result).toEqual(mockData);
    });
  });

  describe('deleteCollection', () => {
    it('should delete a collection', async () => {
      mockApiClient.delete.mockResolvedValue({});

      await service.deleteCollection('1');

      expect(mockApiClient.delete).toHaveBeenCalledWith(API_ENDPOINTS.COLLECTION_BY_ID('1'));
    });
  });

  describe('getCollectionItems', () => {
    it('should fetch items in a collection', async () => {
      const mockData = [{ item_id: 'i1' }, { item_id: 'i2' }];
      mockApiClient.get.mockResolvedValue({ data: mockData });

      const result = await service.getCollectionItems('col1');

      expect(mockApiClient.get).toHaveBeenCalledWith(API_ENDPOINTS.COLLECTION_ITEMS('col1'));
      expect(result).toEqual(mockData);
    });
  });

  describe('addItem', () => {
    it('should add a single item to collection', async () => {
      const data = { item_id: 'item1', custom_values: {} };
      const mockData = { success: true };
      mockApiClient.post.mockResolvedValue({ data: mockData });

      const result = await service.addItem('col1', data);

      expect(mockApiClient.post).toHaveBeenCalledWith(API_ENDPOINTS.COLLECTION_ITEMS('col1'), data);
      expect(result).toEqual(mockData);
    });
  });

  describe('bulkAddItem', () => {
    it('should bulk add items to collection', async () => {
      const data = { item_ids: ['i1', 'i2'], custom_values: {} };
      const mockData = { added: 2 };
      mockApiClient.post.mockResolvedValue({ data: mockData });

      const result = await service.bulkAddItem('col1', data);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        `${API_ENDPOINTS.COLLECTIONS}col1/items/bulk`,
        data
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('removeItem', () => {
    it('should remove item from collection', async () => {
      mockApiClient.delete.mockResolvedValue({});

      await service.removeItem('col1', 'item1');

      expect(mockApiClient.delete).toHaveBeenCalledWith(
        API_ENDPOINTS.COLLECTION_ITEM_BY_ID('col1', 'item1')
      );
    });
  });

  describe('bulkRemoveItems', () => {
    it('should bulk remove items from collection', async () => {
      const mockData = { removed: 3 };
      mockApiClient.post.mockResolvedValue({ data: mockData });

      const result = await service.bulkRemoveItems('col1', ['i1', 'i2', 'i3']);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        `${API_ENDPOINTS.COLLECTIONS}col1/items/bulk-delete`,
        { item_ids: ['i1', 'i2', 'i3'] }
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('updateItem', () => {
    it('should update item custom values in collection', async () => {
      const data = { custom_values: { field1: 'value1' } };
      const mockData = { success: true };
      mockApiClient.put.mockResolvedValue({ data: mockData });

      const result = await service.updateItem('col1', 'item1', data);

      expect(mockApiClient.put).toHaveBeenCalledWith(
        API_ENDPOINTS.COLLECTION_ITEM_BY_ID('col1', 'item1'),
        data
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('updatePermissions', () => {
    it('should update collection permissions', async () => {
      const permission = { type: 'user', id: 'user1', level: 'rw' };
      const mockData = { success: true };
      mockApiClient.post.mockResolvedValue({ data: mockData });

      const result = await service.updatePermissions('col1', permission);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        API_ENDPOINTS.COLLECTION_PERMISSIONS('col1'),
        permission
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('removePermission', () => {
    it('should remove a permission from collection', async () => {
      const mockData = { success: true };
      mockApiClient.delete.mockResolvedValue({ data: mockData });

      const result = await service.removePermission('col1', 'user1');

      expect(mockApiClient.delete).toHaveBeenCalledWith(
        `${API_ENDPOINTS.COLLECTIONS}col1/permissions/user1`
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('exportCollection', () => {
    it('should export collection and trigger download', async () => {
      const blobData = new Blob(['test data']);
      mockApiClient.get.mockResolvedValue({ data: blobData });

      // Mock URL.createObjectURL and DOM
      const mockUrl = 'blob:http://localhost/test';
      global.URL.createObjectURL = vi.fn().mockReturnValue(mockUrl);
      const mockLink = { href: '', setAttribute: vi.fn(), click: vi.fn(), remove: vi.fn() };
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink);
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => {});

      await service.exportCollection('col1');

      expect(mockApiClient.get).toHaveBeenCalledWith(
        API_ENDPOINTS.EXPORT_COLLECTION('col1'),
        { responseType: 'blob' }
      );
      expect(mockLink.click).toHaveBeenCalled();
      expect(mockLink.remove).toHaveBeenCalled();

      document.createElement.mockRestore();
      document.body.appendChild.mockRestore();
    });
  });
});
