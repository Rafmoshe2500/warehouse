import { API_ENDPOINTS } from '../endpoints';

/**
 * Factory function to create excelService with dependency injection
 * Allows injecting different API clients for testing and flexibility
 * 
 * @param {Object} apiClient - The API client to use (e.g., axios instance)
 * @returns {Object} excelService with import/export methods
 */
export const createExcelService = (apiClient) => {
  return {
    /**
     * Import items from Excel file
     * 
     * @param {File} file - The Excel file to import
     * @returns {Promise} Response with import results
     */
    importExcel: async (file) => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post(API_ENDPOINTS.IMPORT_EXCEL, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },

    /**
     * Import project allocations from Excel file
     */
    importProjectExcel: async (file) => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post(API_ENDPOINTS.IMPORT_PROJECTS, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },

    /**
     * Export items to Excel file with optional filters
     * 
     * @param {Object} params - Filter and export parameters
     * @returns {Promise} Downloads Excel file
     */
    exportExcel: async (params = {}) => {
      // Build query string with all filters and settings
      const queryParams = new URLSearchParams();
      
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          queryParams.append(key, params[key]);
        }
      });

      const response = await apiClient.get(`${API_ENDPOINTS.EXPORT_EXCEL}?${queryParams.toString()}`, {
        responseType: 'blob', // Important for file retrieval
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // File name with date
      const date = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `inventory_export_${date}.xlsx`);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  };
};

// Export default instance for backward compatibility
import apiClient from '../client';
export default createExcelService(apiClient);