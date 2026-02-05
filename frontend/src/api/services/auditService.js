import apiClient from '../client';
import { API_ENDPOINTS } from '../endpoints';

/**
 * Audit service for viewing audit logs
 */
const auditService = {
    /**
     * Get audit logs with optional filters
     * @param {Object} params - Query parameters (page, page_size, action, actor, target_user, start_date, end_date)
     */
    getLogs: async (params = {}) => {
        const response = await apiClient.get(API_ENDPOINTS.AUDIT_LOGS, { params });
        return response.data;
    },

    /**
     * Get activity for a specific user
     * @param {string} username - Username to get activity for
     * @param {Object} params - Query parameters (page, page_size)
     */
    getUserActivity: async (username, params = {}) => {
        const response = await apiClient.get(API_ENDPOINTS.AUDIT_USER_ACTIVITY(username), { params });
        return response.data;
    },

    /**
     * Get logs for a specific resource
     * @param {string} resourceType - Type of resource (e.g. 'procurement_order')
     * @param {string} resourceId - ID of resource
     * @param {Object} params - Query parameters
     */
    getResourceLogs: async (resourceType, resourceId, params = {}) => {
        return auditService.getLogs({
            ...params,
            target_resource: resourceType,
            resource_id: resourceId
        });
    }
};

export default auditService;
