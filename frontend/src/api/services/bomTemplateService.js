import api from '../client';

const bomTemplateService = {
  /**
   * List all active BOM templates.
   * @returns {Promise<{templates: Array, total: number}>}
   */
  getAll: async () => {
    const res = await api.get('/bom/templates/');
    return res.data;
  },

  /**
   * Get a single BOM template by format_id.
   * @param {string} templateId - e.g. "netapp_pricing_template"
   */
  getById: async (templateId) => {
    const res = await api.get(`/bom/templates/${encodeURIComponent(templateId)}`);
    return res.data;
  },

  /**
   * Create a new BOM template (admin only).
   * @param {object} data - BomTemplateCreate payload
   */
  create: async (data) => {
    const res = await api.post('/bom/templates/', data);
    return res.data;
  },

  /**
   * Update an existing BOM template (admin only).
   * @param {string} templateId
   * @param {object} data - BomTemplateUpdate payload
   */
  update: async (templateId, data) => {
    const res = await api.put(`/bom/templates/${encodeURIComponent(templateId)}`, data);
    return res.data;
  },

  /**
   * Soft-delete (deactivate) a BOM template (admin only).
   * @param {string} templateId
   */
  delete: async (templateId) => {
    const res = await api.delete(`/bom/templates/${encodeURIComponent(templateId)}`);
    return res.data;
  },

  /**
   * Upload an Excel file and get the first rows as preview JSON (admin only).
   * @param {File} file
   * @returns {Promise<Array<Array>>} rows with cell values + fill colors
   */
  previewExcel: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/bom/templates/preview-excel', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  /**
   * Validate a template config against a sample Excel file (admin only).
   * @param {File} file
   * @param {object} config - template configuration object
   */
  validateTemplate: async (file, config) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('config', JSON.stringify(config));
    const res = await api.post('/bom/templates/validate', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
};

export default bomTemplateService;
