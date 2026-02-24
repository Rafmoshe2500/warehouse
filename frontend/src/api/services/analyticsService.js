import apiClient from '../client';
import { API_ENDPOINTS } from '../endpoints';

export const analyticsService = {
  getDashboardStats: async (params = {}) => {
    // params expected: { start_date, end_date }
    const response = await apiClient.get(API_ENDPOINTS.ANALYTICS, { params });
    return response.data;
  },
  
  getItemProjectStats: async (catalogNumber) => {
    const response = await apiClient.get(API_ENDPOINTS.ANALYTICS_ITEM(catalogNumber));
    return response.data;
  },

  getActivityStats: async (days) => {
    const response = await apiClient.get(API_ENDPOINTS.ANALYTICS_ACTIVITY, { params: { days } });
    return response.data;
  },

  getActivityTimeline: async (days = 30, catalogNumber = null) => {
    const params = { days };
    if (catalogNumber) {
      params.catalog_number = catalogNumber;
    }
    const response = await apiClient.get(API_ENDPOINTS.ANALYTICS_TIMELINE, { params });
    return response.data;
  }
};

export default analyticsService;
