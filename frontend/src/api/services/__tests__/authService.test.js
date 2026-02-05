/**
 * Tests for authService with Dependency Injection
 * Demonstrates testing authentication flows with DI pattern
 */

import { createAuthService } from '../authService';
import { API_ENDPOINTS } from '../../endpoints';

describe('authService with Dependency Injection', () => {
  let mockApiClient;
  let authService;

  beforeEach(() => {
    // Create a mock apiClient for testing
    mockApiClient = {
      get: jest.fn(),
      post: jest.fn(),
    };

    // Create service instance with mock client
    authService = createAuthService(mockApiClient);
  });

  describe('login', () => {
    it('should login user with credentials', async () => {
      const mockResponse = {
        data: {
          token: 'test-token-123',
          user: { id: 1, username: 'admin' },
        },
      };
      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await authService.login('admin', 'password123');

      expect(mockApiClient.post).toHaveBeenCalledWith(
        API_ENDPOINTS.LOGIN,
        { username: 'admin', password: 'password123' }
      );
      expect(result.token).toBe('test-token-123');
      expect(result.user.username).toBe('admin');
    });

    it('should return user data on successful login', async () => {
      const mockResponse = {
        data: {
          token: 'abc-def-ghi',
          user: {
            id: 42,
            username: 'testuser',
            email: 'test@example.com',
            role: 'admin',
          },
        },
      };
      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await authService.login('testuser', 'pass');

      expect(result.user.id).toBe(42);
      expect(result.user.email).toBe('test@example.com');
      expect(result.user.role).toBe('admin');
    });

    it('should handle invalid credentials', async () => {
      mockApiClient.post.mockRejectedValue(
        new Error('Invalid credentials')
      );

      await expect(authService.login('admin', 'wrongpass')).rejects.toThrow(
        'Invalid credentials'
      );
    });

    it('should handle network errors during login', async () => {
      mockApiClient.post.mockRejectedValue(new Error('Network error'));

      await expect(authService.login('admin', 'pass')).rejects.toThrow(
        'Network error'
      );
    });

    it('should handle server errors', async () => {
      mockApiClient.post.mockRejectedValue(
        new Error('Server error: 500')
      );

      await expect(authService.login('admin', 'pass')).rejects.toThrow(
        'Server error'
      );
    });
  });

  describe('logout', () => {
    it('should logout current user', async () => {
      const mockResponse = { data: { success: true } };
      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await authService.logout();

      expect(mockApiClient.post).toHaveBeenCalledWith(API_ENDPOINTS.LOGOUT);
      expect(result.success).toBe(true);
    });

    it('should handle logout success without data', async () => {
      mockApiClient.post.mockResolvedValue({ data: {} });

      const result = await authService.logout();

      expect(mockApiClient.post).toHaveBeenCalledWith(API_ENDPOINTS.LOGOUT);
      expect(result).toBeDefined();
    });

    it('should handle logout errors gracefully', async () => {
      mockApiClient.post.mockRejectedValue(new Error('Logout failed'));

      await expect(authService.logout()).rejects.toThrow('Logout failed');
    });
  });

  describe('getMe', () => {
    it('should get current user info', async () => {
      const mockResponse = {
        data: {
          id: 1,
          username: 'admin',
          email: 'admin@example.com',
          role: 'admin',
        },
      };
      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await authService.getMe();

      expect(mockApiClient.get).toHaveBeenCalledWith(API_ENDPOINTS.ME);
      expect(result.username).toBe('admin');
      expect(result.role).toBe('admin');
    });

    it('should return user with permissions', async () => {
      const mockResponse = {
        data: {
          id: 2,
          username: 'user',
          email: 'user@example.com',
          role: 'user',
          permissions: ['read', 'write'],
        },
      };
      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await authService.getMe();

      expect(result.permissions).toContain('read');
      expect(result.permissions).toContain('write');
    });

    it('should handle unauthorized error', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Unauthorized'));

      await expect(authService.getMe()).rejects.toThrow('Unauthorized');
    });

    it('should handle token expired', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Token expired'));

      await expect(authService.getMe()).rejects.toThrow('Token expired');
    });
  });

  describe('checkAuth', () => {
    it('should return true if authenticated', async () => {
      mockApiClient.get.mockResolvedValue({
        data: { id: 1, username: 'admin' },
      });

      const result = await authService.checkAuth();

      expect(result).toBe(true);
    });

    it('should return false if not authenticated', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Unauthorized'));

      const result = await authService.checkAuth();

      expect(result).toBe(false);
    });

    it('should handle token expired gracefully', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Token expired'));

      const result = await authService.checkAuth();

      expect(result).toBe(false);
    });

    it('should handle network errors gracefully', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Network error'));

      const result = await authService.checkAuth();

      expect(result).toBe(false);
    });

    it('should return false for any error', async () => {
      mockApiClient.get.mockRejectedValue(
        new Error('Server error')
      );

      const result = await authService.checkAuth();

      expect(result).toBe(false);
    });
  });

  describe('Service Interface', () => {
    it('should have all authentication methods', () => {
      expect(typeof authService.login).toBe('function');
      expect(typeof authService.logout).toBe('function');
      expect(typeof authService.getMe).toBe('function');
      expect(typeof authService.checkAuth).toBe('function');
    });

    it('should have correct number of methods', () => {
      const methods = Object.keys(authService);
      expect(methods.length).toBe(4);
    });
  });

  describe('DI Benefits', () => {
    it('should support multiple instances with different clients', () => {
      const mockClient1 = { get: jest.fn(), post: jest.fn() };
      const mockClient2 = { get: jest.fn(), post: jest.fn() };

      const service1 = createAuthService(mockClient1);
      const service2 = createAuthService(mockClient2);

      // Each service has its own client
      expect(service1).not.toBe(service2);
      // But both have the same interface
      expect(typeof service1.login).toBe('function');
      expect(typeof service2.login).toBe('function');
    });

    it('should allow testing with custom clients', async () => {
      // Create a client that tracks calls
      let loginCallCount = 0;
      const trackingClient = {
        post: jest.fn(async () => {
          loginCallCount++;
          return { data: { token: 'test', user: { id: 1 } } };
        }),
        get: jest.fn(),
      };

      const service = createAuthService(trackingClient);
      await service.login('user', 'pass');

      expect(loginCallCount).toBe(1);
      expect(trackingClient.post).toHaveBeenCalledTimes(1);
    });

    it('should support custom auth endpoint via client', async () => {
      // Custom client pointing to different auth endpoint
      const customClient = {
        post: jest.fn(async () => ({
          data: { access_token: 'custom-token' },
        })),
        get: jest.fn(),
      };

      const service = createAuthService(customClient);
      const result = await service.login('admin', 'pass');

      expect(customClient.post).toHaveBeenCalled();
      expect(result.access_token).toBe('custom-token');
    });
  });

  describe('Real-world Authentication Scenarios', () => {
    it('should handle admin login flow', async () => {
      mockApiClient.post.mockResolvedValue({
        data: {
          token: 'admin-token',
          user: { id: 1, username: 'admin', role: 'admin' },
        },
      });
      mockApiClient.get.mockResolvedValue({
        data: { id: 1, username: 'admin', role: 'admin' },
      });

      // Login
      const loginResult = await authService.login('admin', 'adminpass');
      expect(loginResult.user.role).toBe('admin');

      // Check auth
      const isAuth = await authService.checkAuth();
      expect(isAuth).toBe(true);

      // Get current user
      const user = await authService.getMe();
      expect(user.role).toBe('admin');
    });

    it('should handle regular user login flow', async () => {
      mockApiClient.post.mockResolvedValue({
        data: {
          token: 'user-token',
          user: { id: 2, username: 'john', role: 'user' },
        },
      });

      const loginResult = await authService.login('john', 'password');

      expect(loginResult.user.id).toBe(2);
      expect(loginResult.user.role).toBe('user');
    });

    it('should handle session restoration', async () => {
      mockApiClient.get.mockResolvedValue({
        data: { id: 1, username: 'admin', role: 'admin' },
      });

      // Application starts, check if still authenticated
      const isAuthenticated = await authService.checkAuth();

      expect(isAuthenticated).toBe(true);
    });

    it('should handle login and logout flow', async () => {
      // Login
      mockApiClient.post.mockResolvedValueOnce({
        data: { token: 'test-token', user: { id: 1 } },
      });

      const loginResult = await authService.login('admin', 'pass');
      expect(loginResult.token).toBeDefined();

      // Logout
      mockApiClient.post.mockResolvedValueOnce({
        data: { success: true },
      });

      const logoutResult = await authService.logout();
      expect(logoutResult.success).toBe(true);
    });

    it('should handle expired token in check', async () => {
      // First call: get user succeeds
      mockApiClient.get.mockResolvedValueOnce({
        data: { id: 1, username: 'admin' },
      });

      let isAuth = await authService.checkAuth();
      expect(isAuth).toBe(true);

      // Token expires
      mockApiClient.get.mockRejectedValueOnce(new Error('Token expired'));

      isAuth = await authService.checkAuth();
      expect(isAuth).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should preserve original error in getMe', async () => {
      const error = new Error('Custom error message');
      mockApiClient.get.mockRejectedValue(error);

      await expect(authService.getMe()).rejects.toThrow(
        'Custom error message'
      );
    });

    it('should handle various HTTP errors gracefully in checkAuth', async () => {
      const errors = [
        new Error('400: Bad Request'),
        new Error('401: Unauthorized'),
        new Error('403: Forbidden'),
        new Error('500: Internal Server Error'),
      ];

      for (const error of errors) {
        mockApiClient.get.mockRejectedValueOnce(error);
        const result = await authService.checkAuth();
        expect(result).toBe(false);
      }
    });
  });
});
