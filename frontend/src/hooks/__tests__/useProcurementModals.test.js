import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProcurementModals } from '../useProcurementModals';

describe('useProcurementModals', () => {
  const mockOrder = { id: '1', bom_vendor: 'NETAPP', status: 'waiting_bom_emf' };
  const mockOrder2 = { id: '2', bom_vendor: 'HPE', status: 'shipped' };

  // ── Edit / Create ─────────────────────────────────────────
  describe('edit/create modal', () => {
    it('should initialize with modal closed', () => {
      const { result } = renderHook(() => useProcurementModals());
      expect(result.current.isEditModalOpen).toBe(false);
      expect(result.current.editingOrder).toBeNull();
    });

    it('should open edit modal with order', () => {
      const { result } = renderHook(() => useProcurementModals());

      act(() => result.current.openEditModal(mockOrder));

      expect(result.current.isEditModalOpen).toBe(true);
      expect(result.current.editingOrder).toEqual(mockOrder);
    });

    it('should close edit modal and reset state', () => {
      const { result } = renderHook(() => useProcurementModals());

      act(() => result.current.openEditModal(mockOrder));
      act(() => result.current.closeEditModal());

      expect(result.current.isEditModalOpen).toBe(false);
      expect(result.current.editingOrder).toBeNull();
    });

    it('should open create modal via order type flow', () => {
      const { result } = renderHook(() => useProcurementModals());

      act(() => result.current.openCreateModal());

      expect(result.current.isOrderTypeModalOpen).toBe(true);
      expect(result.current.editingOrder).toBeNull();
    });
  });

  // ── Delete ────────────────────────────────────────────────
  describe('delete modal', () => {
    it('should open delete modal with order', () => {
      const { result } = renderHook(() => useProcurementModals());

      act(() => result.current.openDeleteModal(mockOrder));

      expect(result.current.isDeleteModalOpen).toBe(true);
      expect(result.current.orderToDelete).toEqual(mockOrder);
    });

    it('should close delete modal and reset order', () => {
      const { result } = renderHook(() => useProcurementModals());

      act(() => result.current.openDeleteModal(mockOrder));
      act(() => result.current.closeDeleteModal());

      expect(result.current.isDeleteModalOpen).toBe(false);
      expect(result.current.orderToDelete).toBeNull();
    });
  });

  // ── Files ─────────────────────────────────────────────────
  describe('files modal', () => {
    it('should open files modal with order', () => {
      const { result } = renderHook(() => useProcurementModals());

      act(() => result.current.openFilesModal(mockOrder));

      expect(result.current.isFilesModalOpen).toBe(true);
      expect(result.current.selectedOrderForFiles).toEqual(mockOrder);
    });

    it('should close files modal and reset order to null', () => {
      const { result } = renderHook(() => useProcurementModals());

      act(() => result.current.openFilesModal(mockOrder));
      act(() => result.current.closeFilesModal());

      expect(result.current.isFilesModalOpen).toBe(false);
      expect(result.current.selectedOrderForFiles).toBeNull();
    });
  });

  // ── History ───────────────────────────────────────────────
  describe('history modal', () => {
    it('should open history modal with order', () => {
      const { result } = renderHook(() => useProcurementModals());

      act(() => result.current.openHistoryModal(mockOrder));

      expect(result.current.isHistoryModalOpen).toBe(true);
      expect(result.current.selectedOrderForHistory).toEqual(mockOrder);
    });

    it('should close history modal and reset order to null', () => {
      const { result } = renderHook(() => useProcurementModals());

      act(() => result.current.openHistoryModal(mockOrder));
      act(() => result.current.closeHistoryModal());

      expect(result.current.isHistoryModalOpen).toBe(false);
      expect(result.current.selectedOrderForHistory).toBeNull();
    });
  });

  // ── BOM Preview ───────────────────────────────────────────
  describe('BOM preview modal', () => {
    it('should open BOM preview with order', () => {
      const { result } = renderHook(() => useProcurementModals());

      act(() => result.current.openBomPreviewModal(mockOrder));

      expect(result.current.isBomPreviewOpen).toBe(true);
      expect(result.current.selectedOrderForBom).toEqual(mockOrder);
    });

    it('should close BOM preview and reset order to null', () => {
      const { result } = renderHook(() => useProcurementModals());

      act(() => result.current.openBomPreviewModal(mockOrder));
      act(() => result.current.closeBomPreviewModal());

      expect(result.current.isBomPreviewOpen).toBe(false);
      expect(result.current.selectedOrderForBom).toBeNull();
    });
  });

  // ── Order Type Selection ──────────────────────────────────
  describe('order type modal', () => {
    it('should handle manual order type selection', () => {
      const { result } = renderHook(() => useProcurementModals());

      act(() => result.current.openCreateModal());
      act(() => result.current.handleOrderTypeSelect('manual'));

      expect(result.current.isOrderTypeModalOpen).toBe(false);
      expect(result.current.isEditModalOpen).toBe(true);
      expect(result.current.newOrderType).toBe('manual');
    });

    it('should handle BOM order type selection', () => {
      const { result } = renderHook(() => useProcurementModals());

      act(() => result.current.openCreateModal());
      act(() => result.current.handleOrderTypeSelect('bom'));

      expect(result.current.isOrderTypeModalOpen).toBe(false);
      expect(result.current.isBomPrescanOpen).toBe(true);
      expect(result.current.newOrderType).toBe('bom');
    });

    it('should close order type modal', () => {
      const { result } = renderHook(() => useProcurementModals());

      act(() => result.current.openCreateModal());
      act(() => result.current.closeOrderTypeModal());

      expect(result.current.isOrderTypeModalOpen).toBe(false);
    });
  });

  // ── BOM Prescan ───────────────────────────────────────────
  describe('BOM prescan modal', () => {
    it('should handle prescan done and open edit modal with data', () => {
      const { result } = renderHook(() => useProcurementModals());
      const prescanData = { result: { groups: [] }, vendor: { id: 'NETAPP' } };

      act(() => result.current.openCreateModal());
      act(() => result.current.handleOrderTypeSelect('bom'));
      act(() => result.current.handleBomPrescanDone(prescanData));

      expect(result.current.isBomPrescanOpen).toBe(false);
      expect(result.current.isEditModalOpen).toBe(true);
      expect(result.current.bomPrescanData).toEqual(prescanData);
    });

    it('should close prescan modal', () => {
      const { result } = renderHook(() => useProcurementModals());

      act(() => result.current.openCreateModal());
      act(() => result.current.handleOrderTypeSelect('bom'));
      act(() => result.current.closeBomPrescanModal());

      expect(result.current.isBomPrescanOpen).toBe(false);
    });
  });

  // ── Modal Isolation ───────────────────────────────────────
  describe('modal isolation', () => {
    it('should not affect other modals when opening one', () => {
      const { result } = renderHook(() => useProcurementModals());

      act(() => result.current.openFilesModal(mockOrder));

      expect(result.current.isFilesModalOpen).toBe(true);
      expect(result.current.isEditModalOpen).toBe(false);
      expect(result.current.isDeleteModalOpen).toBe(false);
      expect(result.current.isHistoryModalOpen).toBe(false);
      expect(result.current.isBomPreviewOpen).toBe(false);
    });

    it('should allow different orders for different modals', () => {
      const { result } = renderHook(() => useProcurementModals());

      act(() => result.current.openFilesModal(mockOrder));
      act(() => result.current.openHistoryModal(mockOrder2));

      expect(result.current.selectedOrderForFiles).toEqual(mockOrder);
      expect(result.current.selectedOrderForHistory).toEqual(mockOrder2);
    });
  });
});
