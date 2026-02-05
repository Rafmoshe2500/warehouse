import { API_ENDPOINTS } from '../endpoints';

/**
 * Factory function to create authService with dependency injection
 * 
 * @param {Object} apiClient - The API client to use
 * @returns {Object} authService with authentication methods
 */
export const createAuthService = (apiClient) => {
  return {
    /**
     * Login user with credentials
     * 
     * @param {string} username - User username
     * @param {string} password - User password
     * @returns {Promise} Login response with token
     */
    login: async (username, password) => {
      const response = await apiClient.post(API_ENDPOINTS.LOGIN, {
        username,
        password,
      });
      return response.data;
    },

    /**
     * Logout current user
     * 
     * @returns {Promise} Logout response
     */
    logout: async () => {
      const response = await apiClient.post(API_ENDPOINTS.LOGOUT);
      return response.data;
    },

    /**
     * Get current user information
     * 
     * @returns {Promise} Current user data
     */
    getMe: async () => {
      const response = await apiClient.get(API_ENDPOINTS.ME);
      return response.data;
    },

    /**
     * Check if user is authenticated
     * 
     * @returns {Promise<boolean>} True if authenticated, false otherwise
     */
    checkAuth: async function () {
      try {
        await this.getMe();
        return true;
      } catch (error) {
        return false;
      }
    }
  };
};

// Export default instance for backward compatibility
import apiClient from '../client';
export default createAuthService(apiClient);