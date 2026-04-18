import bomTemplateService from '../bomTemplateService';

vi.mock('../../client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import api from '../../client';

describe('bomTemplateService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('fetches all BOM templates', async () => {
      const mockData = {
        templates: [{ format_id: 'netapp_pricing_template', vendor_name: 'NetApp' }],
        total: 1,
      };
      api.get.mockResolvedValue({ data: mockData });

      const result = await bomTemplateService.getAll();

      expect(api.get).toHaveBeenCalledWith('/bom/templates/');
      expect(result).toEqual(mockData);
    });
  });

  describe('getById', () => {
    it('fetches single template by format_id', async () => {
      const mockTemplate = { format_id: 'netapp_pricing_template', vendor_name: 'NetApp' };
      api.get.mockResolvedValue({ data: mockTemplate });

      const result = await bomTemplateService.getById('netapp_pricing_template');

      expect(api.get).toHaveBeenCalledWith(
        '/bom/templates/netapp_pricing_template'
      );
      expect(result).toEqual(mockTemplate);
    });

    it('URL-encodes the template id', async () => {
      api.get.mockResolvedValue({ data: {} });

      await bomTemplateService.getById('my template/with spaces');

      expect(api.get).toHaveBeenCalledWith(
        '/bom/templates/my%20template%2Fwith%20spaces'
      );
    });
  });

  describe('create', () => {
    it('posts new template data', async () => {
      const payload = { format_id: 'new_template', vendor_name: 'Acme' };
      const mockDoc = { ...payload, is_active: true };
      api.post.mockResolvedValue({ data: mockDoc });

      const result = await bomTemplateService.create(payload);

      expect(api.post).toHaveBeenCalledWith('/bom/templates/', payload);
      expect(result).toEqual(mockDoc);
    });
  });

  describe('update', () => {
    it('puts updated template data', async () => {
      const payload = { vendor_name: 'Updated Vendor' };
      api.put.mockResolvedValue({ data: { format_id: 'netapp_pricing_template', ...payload } });

      const result = await bomTemplateService.update('netapp_pricing_template', payload);

      expect(api.put).toHaveBeenCalledWith(
        '/bom/templates/netapp_pricing_template',
        payload
      );
      expect(result).toEqual({ format_id: 'netapp_pricing_template', vendor_name: 'Updated Vendor' });
    });
  });

  describe('delete', () => {
    it('deletes template by id', async () => {
      api.delete.mockResolvedValue({ data: { message: 'Deleted' } });

      const result = await bomTemplateService.delete('netapp_pricing_template');

      expect(api.delete).toHaveBeenCalledWith('/bom/templates/netapp_pricing_template');
      expect(result).toEqual({ message: 'Deleted' });
    });
  });

  describe('previewExcel', () => {
    it('posts a FormData with the file for preview', async () => {
      const mockRows = [['Part Number', 'Qty'], ['X-100', '5']];
      api.post.mockResolvedValue({ data: mockRows });

      const file = new File(['dummy'], 'test.xlsx');
      const result = await bomTemplateService.previewExcel(file);

      expect(api.post).toHaveBeenCalledWith(
        '/bom/templates/preview-excel',
        expect.any(FormData),
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      expect(result).toEqual(mockRows);
    });
  });
});
