import { API_ENDPOINTS } from '../endpoints';

/**
 * Factory function to create itemService with dependency injection
 * Allows injecting different API clients for testing and flexibility
 * 
 * @param {Object} apiClient - The API client to use (e.g., axios instance)
 * @returns {Object} itemService with all item-related methods
 */
export const createItemService = (apiClient) => {
  return {
    /**
     * Get list of items with filters, sorting, and pagination
     */
    getItems: async (params = {}) => {
      const queryParams = new URLSearchParams();

      const allowedFields = [
        'search', 'page', 'limit',
        'catalog_number', 'manufacturer', 'location',
        'description', 'current_stock', 'purpose', 'notes',
        'target_site', 'project_allocations', 'warranty_expiry',
        'sort_by', 'sort_order'
      ];

      allowedFields.forEach(field => {
        if (params[field] !== undefined && params[field] !== '') {
          queryParams.append(field, params[field]);
        }
      });

      // Support for serial_number parameter
      if (params.serial_number) {
        queryParams.append('serial', params.serial_number);
      }
      if (params.serial) {
        queryParams.append('serial', params.serial);
      }

      const response = await apiClient.get(`${API_ENDPOINTS.ITEMS}?${queryParams.toString()}`);
      return response.data;
    },

    /**
     * Get item by ID
     */
    getItemById: async (itemId) => {
      const response = await apiClient.get(API_ENDPOINTS.ITEM_BY_ID(itemId));
      return response.data;
    },

    /**
     * Create new item
     * @param {Object} itemData - Item data
     * @param {boolean} isUndo - Whether this is an undo operation
     */
    createItem: async (itemData, isUndo = false) => {
      const params = isUndo ? { is_undo: true } : {};
      const response = await apiClient.post(API_ENDPOINTS.ITEMS, itemData, { params });
      return response.data;
    },

    /**
     * Update single field of an item
     * @param {string} itemId - Item ID
     * @param {string} field - Field name
     * @param {any} value - New value
     * @param {boolean} isUndo - Whether this is an undo operation
     */
    updateItem: async (itemId, field, value, isUndo = false) => {
      const params = isUndo ? { is_undo: true } : {};
      const response = await apiClient.patch(
        API_ENDPOINTS.ITEM_BY_ID(itemId), 
        { field, value },
        { params }
      );
      return response.data;
    },

    /**
     * Bulk update multiple items with same field/value
     */
    /**
     * Bulk update multiple items
     * @param {string[]} itemIds
     * @param {Object} updates - { field: value } or { notes, purpose, target_site }
     * For backward compatibility, checks how it was called
     */
    bulkUpdate: async (itemIds, fieldOrUpdates, value) => {
      let payload = { ids: itemIds };
      
      if (typeof fieldOrUpdates === 'string') {
        // Old way: field, value
        payload.field = fieldOrUpdates;
        payload.value = value;
      } else {
        // New way: updates object
        payload = { ...payload, ...fieldOrUpdates };
      }

      const response = await apiClient.post(API_ENDPOINTS.BULK_UPDATE, payload);
      return response.data;
    },

    /**
     * Delete single item
     */
    deleteItem: async (itemId, reason) => {
      const response = await apiClient.delete(API_ENDPOINTS.ITEM_BY_ID(itemId), {
        data: { reason }
      });
      return response.data;
    },

    /**
     * Bulk delete multiple items
     */
    bulkDelete: async (itemIds, reason) => {
      const response = await apiClient.post(API_ENDPOINTS.BULK_DELETE, {
        ids: itemIds,
        reason
      });
      return response.data;
    },

    /**
     * Delete all items
     */
    deleteAll: async (reason) => {
      const response = await apiClient.post(API_ENDPOINTS.DELETE_ALL, {
        reason
      });
      return response.data;
    },

    /**
     * Get statistics about items
     */
    getStatistics: async () => {
      const response = await apiClient.get('/items/statistics');
      return response.data;
    },

    /**
     * Get stale items (not updated for X days)
     */
    getStaleItems: async (days, page, limit) => {
      const response = await apiClient.get('/items/stale', {
        params: { days, page, limit }
      });
      return response.data;
    }
  };
};

// Export default instance for backward compatibility
import apiClient from '../client';
export default createItemService(apiClient);