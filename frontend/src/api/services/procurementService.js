import apiClient from '../client';
import { API_ENDPOINTS } from '../endpoints';

/**
 * Service for procurement management
 */
const procurementService = {
  /**
   * Get all procurement orders with pagination and filtering
   */
  getOrders: async (params = {}) => {
    const response = await apiClient.get(API_ENDPOINTS.PROCUREMENT_ORDERS, { params });
    return response.data;
  },

  /**
   * Create new procurement order
   */
  createOrder: async (orderData) => {
    const response = await apiClient.post(API_ENDPOINTS.PROCUREMENT_ORDERS, orderData);
    return response.data;
  },

  /**
   * Update procurement order
   */
  updateOrder: async (orderId, orderData) => {
    const response = await apiClient.put(API_ENDPOINTS.PROCUREMENT_ORDER_BY_ID(orderId), orderData);
    return response.data;
  },

  /**
   * Delete procurement order
   */
  deleteOrder: async (orderId) => {
    const response = await apiClient.delete(API_ENDPOINTS.PROCUREMENT_ORDER_BY_ID(orderId));
    return response.data;
  },

  /**
   * Upload file to procurement order
   */
  uploadFile: async (orderId, file, onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post(
      API_ENDPOINTS.PROCUREMENT_FILES(orderId),
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress,
      }
    );
    return response.data;
  },

  /**
   * Download file from procurement order
   */
  downloadFile: async (orderId, fileId, filename) => {
    const response = await apiClient.get(
      API_ENDPOINTS.PROCUREMENT_FILE_BY_ID(orderId, fileId),
      {
        responseType: 'blob',
      }
    );
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  /**
   * Delete file from procurement order
   */
  deleteFile: async (orderId, fileId) => {
    const response = await apiClient.delete(API_ENDPOINTS.PROCUREMENT_FILE_BY_ID(orderId, fileId));
    return response.data;
  }
};

export default procurementService;
