/**
 * Tests for logService with Dependency Injection
 * Demonstrates testing patterns for activity/audit logging service
 */

import { createLogService } from '../logService';
import { API_ENDPOINTS } from '../../endpoints';

describe('logService with Dependency Injection', () => {
  let mockApiClient;
  let logService;

  beforeEach(() => {
    // Create a mock apiClient for testing
    mockApiClient = {
      get: jest.fn(),
      post: jest.fn(),
    };

    // Create service instance with mock client
    logService = createLogService(mockApiClient);
  });

  describe('getLogs', () => {
    it('should fetch logs without params', async () => {
      const mockResponse = {
        data: {
          logs: [
            { id: 1, action: 'create', timestamp: '2024-01-01' },
            { id: 2, action: 'update', timestamp: '2024-01-02' },
          ],
          total: 2,
        },
      };
      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await logService.getLogs();

      expect(mockApiClient.get).toHaveBeenCalledWith(
        API_ENDPOINTS.LOGS,
        { params: {} }
      );
      expect(result).toEqual(mockResponse.data);
      expect(result.logs).toHaveLength(2);
    });

    it('should fetch logs with pagination params', async () => {
      const mockResponse = {
        data: {
          logs: [{ id: 1, action: 'create' }],
          total: 100,
          page: 1,
          limit: 10,
        },
      };
      mockApiClient.get.mockResolvedValue(mockResponse);

      const params = { page: 1, limit: 10 };
      const result = await logService.getLogs(params);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        API_ENDPOINTS.LOGS,
        { params }
      );
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should fetch logs with date range filter', async () => {
      const mockResponse = {
        data: {
          logs: [{ id: 1, action: 'delete', timestamp: '2024-01-15' }],
          total: 1,
        },
      };
      mockApiClient.get.mockResolvedValue(mockResponse);

      const params = {
        start_date: '2024-01-01',
        end_date: '2024-01-31',
      };
      const result = await logService.getLogs(params);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        API_ENDPOINTS.LOGS,
        { params }
      );
      expect(result.logs).toHaveLength(1);
    });

    it('should fetch logs with action filter', async () => {
      const mockResponse = {
        data: {
          logs: [
            { id: 1, action: 'create', user: 'admin' },
            { id: 3, action: 'create', user: 'user2' },
          ],
          total: 2,
        },
      };
      mockApiClient.get.mockResolvedValue(mockResponse);

      const params = { action: 'create' };
      const result = await logService.getLogs(params);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        API_ENDPOINTS.LOGS,
        { params }
      );
      expect(result.logs.every((log) => log.action === 'create')).toBe(true);
    });

    it('should fetch logs with user filter', async () => {
      const mockResponse = {
        data: {
          logs: [
            { id: 1, action: 'create', user: 'admin' },
            { id: 2, action: 'update', user: 'admin' },
          ],
          total: 2,
        },
      };
      mockApiClient.get.mockResolvedValue(mockResponse);

      const params = { user: 'admin' };
      const result = await logService.getLogs(params);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        API_ENDPOINTS.LOGS,
        { params }
      );
      expect(result.logs.every((log) => log.user === 'admin')).toBe(true);
    });

    it('should fetch logs with combined filters', async () => {
      const mockResponse = {
        data: {
          logs: [
            {
              id: 5,
              action: 'delete',
              user: 'admin',
              timestamp: '2024-01-15',
            },
          ],
          total: 1,
        },
      };
      mockApiClient.get.mockResolvedValue(mockResponse);

      const params = {
        page: 1,
        limit: 10,
        action: 'delete',
        user: 'admin',
        start_date: '2024-01-01',
        end_date: '2024-01-31',
      };
      const result = await logService.getLogs(params);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        API_ENDPOINTS.LOGS,
        { params }
      );
      expect(result.total).toBe(1);
    });

    it('should handle empty logs', async () => {
      const mockResponse = {
        data: {
          logs: [],
          total: 0,
        },
      };
      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await logService.getLogs();

      expect(result.logs).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should handle logs API errors', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Network error'));

      await expect(logService.getLogs()).rejects.toThrow('Network error');
    });
  });

  describe('getLogById', () => {
    it('should fetch single log entry', async () => {
      const mockResponse = {
        data: {
          id: 1,
          action: 'create',
          user: 'admin',
          timestamp: '2024-01-01T10:00:00Z',
          details: { item_id: 42, item_name: 'Widget' },
        },
      };
      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await logService.getLogById(1);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        `${API_ENDPOINTS.LOGS}/1`
      );
      expect(result.id).toBe(1);
      expect(result.action).toBe('create');
    });

    it('should include log details', async () => {
      const mockResponse = {
        data: {
          id: 5,
          action: 'update',
          user: 'user1',
          timestamp: '2024-01-15T15:30:00Z',
          details: {
            item_id: 42,
            field: 'current_stock',
            old_value: 10,
            new_value: 15,
          },
        },
      };
      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await logService.getLogById(5);

      expect(result.details).toBeDefined();
      expect(result.details.field).toBe('current_stock');
      expect(result.details.old_value).toBe(10);
      expect(result.details.new_value).toBe(15);
    });

    it('should handle not found error', async () => {
      mockApiClient.get.mockRejectedValue(
        new Error('Log not found')
      );

      await expect(logService.getLogById(999)).rejects.toThrow(
        'Log not found'
      );
    });
  });

  describe('Service Methods', () => {
    it('should have getLogs method', () => {
      expect(typeof logService.getLogs).toBe('function');
    });

    it('should have getLogById method', () => {
      expect(typeof logService.getLogById).toBe('function');
    });
  });

  describe('DI Benefits', () => {
    it('should support multiple instances with different clients', () => {
      const mockClient1 = { get: jest.fn() };
      const mockClient2 = { get: jest.fn() };

      const service1 = createLogService(mockClient1);
      const service2 = createLogService(mockClient2);

      // Each service has its own client
      expect(service1).not.toBe(service2);
      // But both have the same interface
      expect(typeof service1.getLogs).toBe('function');
      expect(typeof service2.getLogs).toBe('function');
    });

    it('should allow testing with custom clients', async () => {
      // Create a client with logging capability
      const loggingClient = {
        get: jest.fn(async () => ({
          data: { logs: [], total: 0 },
        })),
        callCount: 0,
      };

      const service = createLogService(loggingClient);
      await service.getLogs({ page: 1 });
      await service.getLogs({ page: 2 });

      // Both calls used the same client
      expect(loggingClient.get).toHaveBeenCalledTimes(2);
    });

    it('should work with different API endpoints via client injection', async () => {
      // Custom client with different endpoint
      const customClient = {
        get: jest.fn(async () => ({ data: { logs: [{ custom: true }] } })),
      };

      const service = createLogService(customClient);
      const result = await service.getLogs();

      expect(customClient.get).toHaveBeenCalled();
      expect(result.logs[0].custom).toBe(true);
    });
  });

  describe('Real-world Scenarios', () => {
    it('should support audit log retrieval for compliance', async () => {
      const mockResponse = {
        data: {
          logs: [
            {
              id: 1,
              action: 'delete_all',
              user: 'admin',
              timestamp: '2024-01-01',
              details: { count: 150 },
            },
          ],
          total: 1,
        },
      };
      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await logService.getLogs({
        action: 'delete_all',
        user: 'admin',
      });

      expect(result.logs[0].action).toBe('delete_all');
      expect(result.logs[0].user).toBe('admin');
    });

    it('should support log timeline queries', async () => {
      const mockResponse = {
        data: {
          logs: [
            { id: 1, timestamp: '2024-01-01' },
            { id: 2, timestamp: '2024-01-02' },
            { id: 3, timestamp: '2024-01-03' },
          ],
          total: 3,
        },
      };
      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await logService.getLogs({
        start_date: '2024-01-01',
        end_date: '2024-01-03',
        limit: 100,
      });

      expect(result.logs).toHaveLength(3);
      expect(result.logs[0].timestamp).toBeLessThanOrEqual(
        result.logs[2].timestamp
      );
    });
  });
});
