import { describe, it, expect, vi, beforeEach } from 'vitest';

// We mock the apiClient module so the default export's methods resolve with test data
vi.mock('../../client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../../endpoints', () => ({
  API_ENDPOINTS: {
    PROCUREMENT_ORDERS: '/procurement/orders',
    PROCUREMENT_ORDER_BY_ID: (id) => `/procurement/orders/${id}`,
    PROCUREMENT_FILES: (orderId) => `/procurement/orders/${orderId}/files`,
    PROCUREMENT_FILE_BY_ID: (orderId, fileId) => `/procurement/orders/${orderId}/files/${fileId}`,
  },
}));

import apiClient from '../../client';
import procurementService from '../procurementService';

describe('procurementService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── getOrders ─────────────────────────────────────────────
  describe('getOrders', () => {
    it('should fetch orders with default params', async () => {
      const data = { orders: [], total: 0, page: 1, page_size: 50 };
      apiClient.get.mockResolvedValue({ data });

      const result = await procurementService.getOrders();

      expect(apiClient.get).toHaveBeenCalledWith('/procurement/orders', { params: {} });
      expect(result).toEqual(data);
    });

    it('should pass search and pagination params', async () => {
      const data = { orders: [{ id: '1' }], total: 1 };
      apiClient.get.mockResolvedValue({ data });

      const params = { page: 2, page_size: 25, search: 'test' };
      const result = await procurementService.getOrders(params);

      expect(apiClient.get).toHaveBeenCalledWith('/procurement/orders', { params });
      expect(result).toEqual(data);
    });

    it('should pass status filters', async () => {
      apiClient.get.mockResolvedValue({ data: { orders: [] } });

      await procurementService.getOrders({ status_ne: 'received' });

      expect(apiClient.get).toHaveBeenCalledWith('/procurement/orders', {
        params: { status_ne: 'received' },
      });
    });

    it('should propagate API errors', async () => {
      apiClient.get.mockRejectedValue(new Error('Network Error'));

      await expect(procurementService.getOrders()).rejects.toThrow('Network Error');
    });
  });

  // ── createOrder ───────────────────────────────────────────
  describe('createOrder', () => {
    it('should post order data and return response', async () => {
      const orderData = {
        order_date: '2026-01-01',
        bom_items: [{ catalog_number: 'P1', quantity: 10 }],
        total_amount: 5000,
        status: 'waiting_bom_emf',
        emf_number: 'EMF-001',
      };
      const created = { id: '123', ...orderData };
      apiClient.post.mockResolvedValue({ data: created });

      const result = await procurementService.createOrder(orderData);

      expect(apiClient.post).toHaveBeenCalledWith('/procurement/orders', orderData);
      expect(result).toEqual(created);
    });

    it('should propagate validation errors', async () => {
      apiClient.post.mockRejectedValue({ response: { status: 400, data: { detail: 'Invalid' } } });

      await expect(procurementService.createOrder({})).rejects.toBeTruthy();
    });
  });

  // ── updateOrder ───────────────────────────────────────────
  describe('updateOrder', () => {
    it('should PUT update data for an order', async () => {
      const update = { status: 'shipped', emf_number: 'EMF-999' };
      apiClient.put.mockResolvedValue({ data: { id: '123', ...update } });

      const result = await procurementService.updateOrder('123', update);

      expect(apiClient.put).toHaveBeenCalledWith('/procurement/orders/123', update);
      expect(result.status).toBe('shipped');
    });

    it('should handle 404 for nonexistent order', async () => {
      apiClient.put.mockRejectedValue({ response: { status: 404 } });

      await expect(procurementService.updateOrder('bad-id', {})).rejects.toBeTruthy();
    });
  });

  // ── deleteOrder ───────────────────────────────────────────
  describe('deleteOrder', () => {
    it('should DELETE the order by id', async () => {
      apiClient.delete.mockResolvedValue({ data: { message: 'ההזמנה נמחקה בהצלחה' } });

      const result = await procurementService.deleteOrder('123');

      expect(apiClient.delete).toHaveBeenCalledWith('/procurement/orders/123', undefined);
      expect(result.message).toContain('נמחקה');
    });

    it('should propagate errors', async () => {
      apiClient.delete.mockRejectedValue(new Error('Forbidden'));

      await expect(procurementService.deleteOrder('123')).rejects.toThrow('Forbidden');
    });
  });

  // ── uploadFile ────────────────────────────────────────────
  describe('uploadFile', () => {
    it('should upload file as FormData', async () => {
      const file = new File(['data'], 'test.pdf', { type: 'application/pdf' });
      const responseData = { file_id: 'f1', filename: 'test.pdf', message: 'OK' };
      apiClient.post.mockResolvedValue({ data: responseData });

      const result = await procurementService.uploadFile('order1', file);

      expect(apiClient.post).toHaveBeenCalledWith(
        '/procurement/orders/order1/files',
        expect.any(FormData),
        expect.objectContaining({
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      );
      expect(result).toEqual(responseData);
    });

    it('should pass onUploadProgress callback', async () => {
      const file = new File(['data'], 'test.pdf');
      apiClient.post.mockResolvedValue({ data: {} });
      const onProgress = vi.fn();

      await procurementService.uploadFile('order1', file, onProgress);

      const callArgs = apiClient.post.mock.calls[0][2];
      expect(callArgs.onUploadProgress).toBe(onProgress);
    });
  });

  // ── downloadFile ──────────────────────────────────────────
  describe('downloadFile', () => {
    it('should request blob and trigger download', async () => {
      const blob = new Blob(['file-content'], { type: 'application/pdf' });
      apiClient.get.mockResolvedValue({ data: blob });

      // Mock DOM APIs
      const mockUrl = 'blob:http://localhost/abc123';
      const createObjectURL = vi.fn(() => mockUrl);
      const revokeObjectURL = vi.fn();
      window.URL.createObjectURL = createObjectURL;
      window.URL.revokeObjectURL = revokeObjectURL;

      const mockLink = { href: '', setAttribute: vi.fn(), click: vi.fn(), remove: vi.fn() };
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink);
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => {});

      await procurementService.downloadFile('order1', 'file1', 'report.pdf');

      expect(apiClient.get).toHaveBeenCalledWith(
        '/procurement/orders/order1/files/file1',
        { responseType: 'blob' }
      );
      expect(createObjectURL).toHaveBeenCalled();
      expect(mockLink.setAttribute).toHaveBeenCalledWith('download', 'report.pdf');
      expect(mockLink.click).toHaveBeenCalled();
      expect(revokeObjectURL).toHaveBeenCalledWith(mockUrl);

      document.createElement.mockRestore();
      document.body.appendChild.mockRestore();
    });
  });

  // ── deleteFile ────────────────────────────────────────────
  describe('deleteFile', () => {
    it('should DELETE the file by orderId and fileId', async () => {
      apiClient.delete.mockResolvedValue({ data: { message: 'הקובץ נמחק בהצלחה' } });

      const result = await procurementService.deleteFile('order1', 'file1');

      expect(apiClient.delete).toHaveBeenCalledWith('/procurement/orders/order1/files/file1');
      expect(result.message).toContain('נמחק');
    });
  });
});
