import { API_ENDPOINTS } from '../endpoints';

/**
 * Factory function to create cartService with dependency injection.
 * Follows the same pattern as itemService.js.
 */
export const createCartService = (apiClient) => {
  return {
    /**
     * Fetch the current user's cart.
     */
    getCart: async () => {
      const response = await apiClient.get(API_ENDPOINTS.CART);
      return response.data;
    },

    /**
     * Add one inventory item to the cart.
     * @param {string} itemId
     * @param {number} quantity - ignored for serial items (backend forces 1)
     * @param {string|null} targetSiteOverride
     */
    addItemToCart: async (itemId, quantity = 1, targetSiteOverride = null) => {
      const payload = { item_id: itemId, quantity };
      if (targetSiteOverride) payload.target_site_override = targetSiteOverride;
      const response = await apiClient.post(API_ENDPOINTS.CART_ITEMS, payload);
      return response.data;
    },

    /**
     * Remove a single item (by inventory item_id) from the cart.
     * @param {string} itemId
     */
    removeItemFromCart: async (itemId) => {
      const response = await apiClient.delete(API_ENDPOINTS.CART_ITEM_BY_ID(itemId));
      return response.data;
    },

    /**
     * Finalise the cart — generate requisition email text and clear the cart.
     * @param {string} targetSite
     * @returns {{ email_text: string, items_count: number, serial_items_updated: number }}
     */
    checkoutCart: async (targetSite) => {
      const response = await apiClient.post(API_ENDPOINTS.CART_CHECKOUT, {
        target_site: targetSite,
      });
      return response.data;
    },

    /**
     * Empty the cart without generating email text.
     */
    clearCart: async () => {
      await apiClient.delete(API_ENDPOINTS.CART);
    },
  };
};

// Default instance
import apiClient from '../client';
export default createCartService(apiClient);
