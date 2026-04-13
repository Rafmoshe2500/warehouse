import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

import api from '../../client';
import bomService from '../bomService';

describe('bomService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── scanBomFile ───────────────────────────────────────────
  describe('scanBomFile', () => {
    it('should upload file with correct format param', async () => {
      const file = new File(['data'], 'bom.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const mockResult = { groups: [], unknown_parts: [] };
      api.post.mockResolvedValue({ data: mockResult });

      const result = await bomService.scanBomFile(file, 'hpe_quote');

      expect(api.post).toHaveBeenCalledWith(
        '/bom/scan?format=hpe_quote',
        expect.any(FormData),
        expect.objectContaining({
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      );
      expect(result).toEqual(mockResult);
    });

    it('should use default format when not specified', async () => {
      const file = new File(['data'], 'bom.xlsx');
      api.post.mockResolvedValue({ data: {} });

      await bomService.scanBomFile(file);

      expect(api.post).toHaveBeenCalledWith(
        '/bom/scan?format=netapp_pricing_template',
        expect.any(FormData),
        expect.anything()
      );
    });

    it('should propagate API errors', async () => {
      const file = new File(['data'], 'bom.xlsx');
      api.post.mockRejectedValue({ response: { status: 400, data: { detail: 'Invalid format' } } });

      await expect(bomService.scanBomFile(file, 'bad')).rejects.toBeTruthy();
    });
  });

  // ── savePart ──────────────────────────────────────────────
  describe('savePart', () => {
    it('should post part data with correct structure', async () => {
      api.post.mockResolvedValue({ data: { ok: true } });

      const result = await bomService.savePart('X6589A', {
        description_he: 'כרטיס רשת',
        category: 'network',
        important: true,
        excel_description: 'Network Card 100GbE',
      });

      expect(api.post).toHaveBeenCalledWith('/bom/parts/X6589A', {
        description_he: 'כרטיס רשת',
        category: 'network',
        important: true,
        excel_description: 'Network Card 100GbE',
      });
      expect(result).toEqual({ ok: true });
    });

    it('should default excel_description to empty string', async () => {
      api.post.mockResolvedValue({ data: {} });

      await bomService.savePart('P1', {
        description_he: 'test',
        category: 'other',
        important: false,
      });

      expect(api.post).toHaveBeenCalledWith('/bom/parts/P1', expect.objectContaining({
        excel_description: '',
      }));
    });

    it('should encode special characters in part number', async () => {
      api.post.mockResolvedValue({ data: {} });

      await bomService.savePart('NET/APP-100', {
        description_he: 'test',
        category: 'other',
        important: true,
      });

      expect(api.post).toHaveBeenCalledWith(
        '/bom/parts/NET%2FAPP-100',
        expect.anything()
      );
    });
  });

  // ── getAllParts ────────────────────────────────────────────
  describe('getAllParts', () => {
    it('should fetch all parts', async () => {
      const parts = [{ part_number: 'P1' }, { part_number: 'P2' }];
      api.get.mockResolvedValue({ data: parts });

      const result = await bomService.getAllParts();

      expect(api.get).toHaveBeenCalledWith('/bom/parts');
      expect(result).toEqual(parts);
    });
  });

  // ── updateBomItems ────────────────────────────────────────
  describe('updateBomItems', () => {
    it('should patch items with vendor uppercased', async () => {
      const items = [
        { part_number: 'P1', description_he: 'עדכן' },
        { part_number: 'P2', category: 'storage' },
      ];
      api.patch.mockResolvedValue({ data: { updated: 2 } });

      const result = await bomService.updateBomItems('netapp', items);

      expect(api.patch).toHaveBeenCalledWith('/bom/scan/items', {
        vendor: 'NETAPP',
        items,
      });
      expect(result).toEqual({ updated: 2 });
    });

    it('should handle already uppercased vendor', async () => {
      api.patch.mockResolvedValue({ data: {} });

      await bomService.updateBomItems('HPE', []);

      expect(api.patch).toHaveBeenCalledWith('/bom/scan/items', {
        vendor: 'HPE',
        items: [],
      });
    });
  });

  // ── retrainModel ──────────────────────────────────────────
  describe('retrainModel', () => {
    it('should trigger retraining', async () => {
      const metrics = { total_samples: 500, test_accuracy: 0.95 };
      api.post.mockResolvedValue({ data: metrics });

      const result = await bomService.retrainModel();

      expect(api.post).toHaveBeenCalledWith('/ai/retrain');
      expect(result).toEqual(metrics);
    });

    it('should propagate authorization errors', async () => {
      api.post.mockRejectedValue({ response: { status: 403 } });

      await expect(bomService.retrainModel()).rejects.toBeTruthy();
    });
  });
});
