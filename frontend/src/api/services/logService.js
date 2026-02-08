import { API_ENDPOINTS } from '../endpoints';

/**
 * Factory function to create logService with dependency injection
 * 
 * @param {Object} apiClient - The API client to use
 * @returns {Object} logService with logging methods
 */
export const createLogService = (apiClient) => {
  return {
    /**
     * Get activity logs with optional filters
     * 
     * @param {Object} params - Query parameters (page, limit, date range, etc.)
     * @returns {Promise} Logs data
     */
    getLogs: async (params = {}) => {
      // Map legacy 'limit' to 'page_size' for Audit API
      const apiParams = {
        ...params,
        page_size: params.limit || params.page_size || 50
      };
      if (apiParams.limit) delete apiParams.limit;

      // Clean default empty strings from filters (fixes 422 on action="")
      Object.keys(apiParams).forEach(key => {
        if (apiParams[key] === '' || apiParams[key] === null || apiParams[key] === undefined) {
          delete apiParams[key];
        }
      });
      
      const response = await apiClient.get(API_ENDPOINTS.LOGS, { params: apiParams });
      
      // Map Audit response to legacy format expected by UI
      if (response.data && Array.isArray(response.data.logs)) {
        return {
          ...response.data,
          logs: response.data.logs.map(log => ({
            ...log,
            _id: log.id,
            user: log.actor,
            item_identifier: log.target_resource_name || log.resource_id || (log.target_resource === 'item' ? log.details : ''), 
          }))
        };
      }
      return response.data;
    },

    /**
     * Get single log entry
     */
    getLogById: async (logId) => {
      const response = await apiClient.get(`${API_ENDPOINTS.LOGS}/${logId}`);
      return response.data;
    },

    /**
     * Create a new log entry (for UNDO operations)
     * 
     * @param {Object} logData - Log data
     * @returns {Promise} Created log ID
     */
    createLog: async (logData) => {
      // The backend endpoint will override actor and actor_role from the current user's JWT
      // So we just pass the data as-is
      const response = await apiClient.post(API_ENDPOINTS.LOGS, logData);
      return response.data;
    }
  };
};

// Export default instance for backward compatibility
import apiClient from '../client';
export default createLogService(apiClient);

