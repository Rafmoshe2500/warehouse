import { API_ENDPOINTS } from '../endpoints';
import apiClient from '../client';

export const createCatalogService = (client) => {
  return {
    getCatalog: async (params = {}) => {
      const queryParams = new URLSearchParams();

      const allowedFields = [
        'search', 'page', 'limit',
        'catalog_number', 'manufacturer', 'description',
        'sort_by', 'sort_order'
      ];

      allowedFields.forEach(field => {
        if (params[field] !== undefined && params[field] !== '') {
          queryParams.append(field, params[field]);
        }
      });

      const response = await client.get(`${API_ENDPOINTS.CATALOG}?${queryParams.toString()}`);
      return response.data;
    }
  };
};

export default createCatalogService(apiClient);
