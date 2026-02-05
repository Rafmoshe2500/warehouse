/**
 * Tests for itemService with Dependency Injection
 * Demonstrates how factory pattern enables easy testing with mock apiClient
 */

import { createItemService } from '../itemService';
import { API_ENDPOINTS } from '../../endpoints';

describe('itemService with Dependency Injection', () => {
  let mockApiClient;
  let itemService;

  beforeEach(() => {
    // Create a mock apiClient for testing
    mockApiClient = {
      get: jest.fn(),
      post: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
    };

    // Create service instance with mock client
    itemService = createItemService(mockApiClient);
  });

  describe('getItems', () => {
    it('should fetch items with params', async () => {
      const mockResponse = {
        data: { items: [], total: 0 },
      };
      mockApiClient.get.mockResolvedValue(mockResponse);

      const params = { page: 1, limit: 10, search: 'test' };
      const result = await itemService.getItems(params);

      expect(mockApiClient.get).toHaveBeenCalled();
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle search parameter', async () => {
      const mockResponse = {
        data: { items: [{ id: 1, name: 'Item' }] },
      };
      mockApiClient.get.mockResolvedValue(mockResponse);

      await itemService.getItems({ search: 'item' });

      expect(mockApiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('search=item'),
        undefined
      );
    });

    it('should convert serial_number to serial param', async () => {
      const mockResponse = { data: { items: [] } };
      mockApiClient.get.mockResolvedValue(mockResponse);

      await itemService.getItems({ serial_number: '123' });

      expect(mockApiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('serial=123'),
        undefined
      );
    });
  });

  describe('createItem', () => {
    it('should create new item', async () => {
      const mockResponse = {
        data: { id: 1, name: 'New Item' },
      };
      mockApiClient.post.mockResolvedValue(mockResponse);

      const itemData = { name: 'New Item' };
      const result = await itemService.createItem(itemData);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        API_ENDPOINTS.ITEMS,
        itemData
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('updateItem', () => {
    it('should update item field', async () => {
      const mockResponse = { data: { id: 1, stock: 5 } };
      mockApiClient.patch.mockResolvedValue(mockResponse);

      const result = await itemService.updateItem(1, 'current_stock', 5);

      expect(mockApiClient.patch).toHaveBeenCalledWith(
        API_ENDPOINTS.ITEM_BY_ID(1),
        { field: 'current_stock', value: 5 }
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('bulkUpdate', () => {
    it('should update multiple items', async () => {
      const mockResponse = { data: { updated: 2 } };
      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await itemService.bulkUpdate([1, 2], 'status', 'active');

      expect(mockApiClient.post).toHaveBeenCalledWith(
        API_ENDPOINTS.BULK_UPDATE,
        { ids: [1, 2], field: 'status', value: 'active' }
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('deleteItem', () => {
    it('should delete item with confirmation', async () => {
      const mockResponse = { data: { deleted: true } };
      mockApiClient.delete.mockResolvedValue(mockResponse);

      const result = await itemService.deleteItem(1, 'confirmed');

      expect(mockApiClient.delete).toHaveBeenCalledWith(
        API_ENDPOINTS.ITEM_BY_ID(1),
        { data: { confirmation: 'confirmed' } }
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('bulkDelete', () => {
    it('should delete multiple items', async () => {
      const mockResponse = { data: { deleted: 3 } };
      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await itemService.bulkDelete([1, 2, 3], 'confirmed');

      expect(mockApiClient.post).toHaveBeenCalledWith(
        API_ENDPOINTS.BULK_DELETE,
        { ids: [1, 2, 3], confirmation: 'confirmed' }
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getStatistics', () => {
    it('should fetch statistics', async () => {
      const mockResponse = { data: { total: 100, active: 95 } };
      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await itemService.getStatistics();

      expect(mockApiClient.get).toHaveBeenCalledWith('/items/statistics');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('DI Benefits', () => {
    it('should support multiple instances with different clients', () => {
      const mockClient1 = { get: jest.fn() };
      const mockClient2 = { get: jest.fn() };

      const service1 = createItemService(mockClient1);
      const service2 = createItemService(mockClient2);

      // Each service has its own client
      expect(service1).not.toBe(service2);
      // But both have the same interface
      expect(typeof service1.getItems).toBe('function');
      expect(typeof service2.getItems).toBe('function');
    });

    it('should allow testing with custom apiClient implementations', async () => {
      // Test with logging client
      const loggingClient = {
        get: jest.fn(async () => ({ data: { items: [] } })),
        logs: [],
      };

      const service = createItemService(loggingClient);
      await service.getItems();

      expect(loggingClient.get).toHaveBeenCalled();
    });
  });
});
