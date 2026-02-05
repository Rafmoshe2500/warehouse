import apiClient from '../client';
import { API_ENDPOINTS } from '../endpoints';

/**
 * Admin service for user management
 */
const adminService = {
    /**
     * Get all users
     */
    getUsers: async () => {
        const response = await apiClient.get(API_ENDPOINTS.ADMIN_USERS);
        return response.data;
    },

    /**
     * Create new user
     */
    createUser: async (userData) => {
        const response = await apiClient.post(API_ENDPOINTS.ADMIN_USERS, userData);
        return response.data;
    },

    /**
     * Update user
     */
    updateUser: async (userId, userData) => {
        const response = await apiClient.put(API_ENDPOINTS.ADMIN_USER_BY_ID(userId), userData);
        return response.data;
    },

    /**
     * Delete user
     */
    deleteUser: async (userId, reason) => {
        const response = await apiClient.delete(API_ENDPOINTS.ADMIN_USER_BY_ID(userId), {
            data: { reason }
        });
        return response.data;
    },

    /**
     * Get user statistics
     */
    getStats: async () => {
        const response = await apiClient.get(API_ENDPOINTS.ADMIN_STATS);
        return response.data;
    },

    /**
     * Change own password
     */
    changePassword: async (currentPassword, newPassword) => {
        const response = await apiClient.put(API_ENDPOINTS.CHANGE_PASSWORD, {
            current_password: currentPassword,
            new_password: newPassword,
        });
        return response.data;
    },
};

export default adminService;
