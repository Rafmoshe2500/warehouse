import { API_ENDPOINTS } from '../endpoints';

/**
 * Factory function to create collectionsService with dependency injection
 * 
 * @param {Object} apiClient - The API client to use (e.g., axios instance)
 * @returns {Object} collectionsService with all collection-related methods
 */
export const createCollectionsService = (apiClient) => {
  return {
    /**
     * Get list of collections visible to the user
     */
    getCollections: async () => {
      const response = await apiClient.get(API_ENDPOINTS.COLLECTIONS);
      return response.data;
    },

    /**
     * Get collection details by ID
     */
    getCollection: async (id) => {
      const response = await apiClient.get(API_ENDPOINTS.COLLECTION_BY_ID(id));
      return response.data;
    },

    /**
     * Create a new collection
     * @param {Object} data - { name, description, group_ids }
     */
    createCollection: async (data) => {
      const response = await apiClient.post(API_ENDPOINTS.COLLECTIONS, data);
      return response.data;
    },

    /**
     * Update a collection
     * @param {string} id - Collection ID
     * @param {Object} data - fields to update
     */
    updateCollection: async (id, data) => {
      const response = await apiClient.put(API_ENDPOINTS.COLLECTION_BY_ID(id), data);
      return response.data;
    },

    /**
     * Delete a collection
     */
    deleteCollection: async (id) => {
      await apiClient.delete(API_ENDPOINTS.COLLECTION_BY_ID(id));
    },

    /**
     * Get items in a collection
     */
    getCollectionItems: async (id) => {
      const response = await apiClient.get(API_ENDPOINTS.COLLECTION_ITEMS(id));
      return response.data;
    },

    /**
     * Add item to collection
     * @param {string} collectionId
     * @param {Object} data - { item_id, custom_values }
     */
    addItem: async (collectionId, data) => {
      const response = await apiClient.post(API_ENDPOINTS.COLLECTION_ITEMS(collectionId), data);
      return response.data;
    },

    /**
     * Bulk add items to collection
     * @param {string} collectionId
     * @param {Object} data - { item_ids: [], custom_values: {} }
     */
    bulkAddItem: async (collectionId, data) => {
      const response = await apiClient.post(`${API_ENDPOINTS.COLLECTIONS}${collectionId}/items/bulk`, data);
      return response.data;
    },

    /**
     * Remove item from collection
     */
    removeItem: async (collectionId, itemId) => {
      await apiClient.delete(API_ENDPOINTS.COLLECTION_ITEM_BY_ID(collectionId, itemId));
    },

    /**
     * Update item custom values
     * @param {string} collectionId
     * @param {string} itemId
     * @param {Object} data - { custom_values }
     */
    updateItem: async (collectionId, itemId, data) => {
      const response = await apiClient.put(API_ENDPOINTS.COLLECTION_ITEM_BY_ID(collectionId, itemId), data);
      return response.data;
    },

    /**
     * Update permissions
     * @param {string} collectionId
     * @param {Object} permission - { type, id, level }
     */
    updatePermissions: async (collectionId, permission) => {
        const response = await apiClient.post(API_ENDPOINTS.COLLECTION_PERMISSIONS(collectionId), permission);
        return response.data;
    },

    /**
     * Remove permission
     * @param {string} collectionId
     * @param {string} targetId - User ID or Group ID
     */
    removePermission: async (collectionId, targetId) => {
        // We'll assume the endpoint pattern DELETE /collections/{id}/permissions/{targetId}
        const response = await apiClient.delete(`${API_ENDPOINTS.COLLECTIONS}${collectionId}/permissions/${targetId}`);
        return response.data;
    },

    /**
     * Bulk remove items from collection
     * @param {string} collectionId
     * @param {Array<string>} itemIds
     */
    bulkRemoveItems: async (collectionId, itemIds) => {
      // Changed to POST to avoid issues with DELETE bodies
      const response = await apiClient.post(`${API_ENDPOINTS.COLLECTIONS}${collectionId}/items/bulk-delete`, {
        item_ids: itemIds
      });
      return response.data;
    }
  };
};

import apiClient from '../client';
export default createCollectionsService(apiClient);
