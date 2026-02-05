import apiClient from '../client';
import { API_ENDPOINTS } from '../endpoints';

/**
 * Group service for group management
 */
const groupService = {
    /**
     * Get all groups
     */
    getGroups: async () => {
        const response = await apiClient.get(API_ENDPOINTS.ADMIN_GROUPS);
        return response.data;
    },

    /**
     * Create new group
     */
    createGroup: async (groupData) => {
        const response = await apiClient.post(API_ENDPOINTS.ADMIN_GROUPS, groupData);
        return response.data;
    },

    /**
     * Update group
     */
    updateGroup: async (groupId, groupData) => {
        const response = await apiClient.put(API_ENDPOINTS.ADMIN_GROUP_BY_ID(groupId), groupData);
        return response.data;
    },

    /**
     * Delete group
     */
    deleteGroup: async (groupId, reason) => {
        const response = await apiClient.delete(API_ENDPOINTS.ADMIN_GROUP_BY_ID(groupId), {
            data: { reason }
        });
        return response.data;
    },
};

export default groupService;
