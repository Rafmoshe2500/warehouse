import api from '../client';

const bomService = {
  /**
   * Upload a BOM Excel file for scanning.
   * @param {File} file - Excel file
   * @param {string} format - BOM format strategy (e.g. 'netapp_pricing_template')
   */
  scanBomFile: async (file, format = 'netapp_pricing_template') => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post(`/bom/scan?format=${encodeURIComponent(format)}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  /**
   * Save or update a part in the catalog.
   */
  savePart: async (partNumber, { description_he, category, important, excel_description }) => {
    const res = await api.post(`/bom/parts/${encodeURIComponent(partNumber)}`, {
      description_he,
      category,
      important,
      excel_description: excel_description || '',
    });
    return res.data;
  },

  /**
   * Fetch all parts from the catalog.
   */
  getAllParts: async () => {
    const res = await api.get('/bom/parts');
    return res.data;
  },
};

export default bomService;
