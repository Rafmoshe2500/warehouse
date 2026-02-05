/**
 * Tests for excelService with Dependency Injection
 */

import { createExcelService } from '../excelService';
import { API_ENDPOINTS } from '../../endpoints';

describe('excelService with Dependency Injection', () => {
  let mockApiClient;
  let excelService;

  beforeEach(() => {
    mockApiClient = {
      post: jest.fn(),
      get: jest.fn(),
    };

    excelService = createExcelService(mockApiClient);
  });

  describe('importExcel', () => {
    it('should upload Excel file', async () => {
      const mockFile = new File(['test'], 'test.xlsx');
      const mockResponse = {
        data: { imported: 10, errors: 0 },
      };
      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await excelService.importExcel(mockFile);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        API_ENDPOINTS.IMPORT_EXCEL,
        expect.any(FormData),
        expect.objectContaining({
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle import errors', async () => {
      const mockFile = new File(['test'], 'test.xlsx');
      mockApiClient.post.mockRejectedValue(
        new Error('Upload failed')
      );

      await expect(excelService.importExcel(mockFile)).rejects.toThrow(
        'Upload failed'
      );
    });
  });

  describe('exportExcel', () => {
    it('should export with query params', async () => {
      // Mock blob response
      const mockBlob = new Blob(['test'], { type: 'application/vnd.ms-excel' });
      const mockResponse = { data: mockBlob };
      mockApiClient.get.mockResolvedValue(mockResponse);

      // Mock DOM methods
      global.URL.createObjectURL = jest.fn(() => 'blob:mock');
      document.body.appendChild = jest.fn();
      document.body.removeChild = jest.fn();
      global.URL.revokeObjectURL = jest.fn();

      await excelService.exportExcel({ filter: 'active' });

      expect(mockApiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('filter=active'),
        expect.objectContaining({ responseType: 'blob' })
      );
    });
  });

  describe('DI Benefits', () => {
    it('should support custom apiClient', async () => {
      const customClient = {
        post: jest.fn(async () => ({ data: { success: true } })),
      };

      const service = createExcelService(customClient);
      const mockFile = new File(['test'], 'test.xlsx');

      await service.importExcel(mockFile);

      expect(customClient.post).toHaveBeenCalled();
    });
  });
});
