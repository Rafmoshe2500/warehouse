import { renderHook, act } from '@testing-library/react';
import { useInventoryModals } from '../useInventoryModals';

describe('useInventoryModals', () => {
  it('should initialize all modals as closed', () => {
    const { result } = renderHook(() => useInventoryModals());

    expect(result.current.isItemFormOpen).toBe(false);
    expect(result.current.editingItem).toBeNull();
    expect(result.current.isDeleteOpen).toBe(false);
    expect(result.current.deletingItemName).toBe('');
    expect(result.current.isDeletingMultiple).toBe(false);
    expect(result.current.isBulkEditOpen).toBe(false);
    expect(result.current.showExportModal).toBe(false);
  });

  describe('Item Form Modal', () => {
    it('should open item form for new item (null)', () => {
      const { result } = renderHook(() => useInventoryModals());

      act(() => {
        result.current.openItemForm();
      });

      expect(result.current.isItemFormOpen).toBe(true);
      expect(result.current.editingItem).toBeNull();
    });

    it('should open item form for editing with item data', () => {
      const { result } = renderHook(() => useInventoryModals());
      const item = { _id: '1', name: 'Test' };

      act(() => {
        result.current.openItemForm(item);
      });

      expect(result.current.isItemFormOpen).toBe(true);
      expect(result.current.editingItem).toEqual(item);
    });

    it('should close item form and clear editing item', () => {
      const { result } = renderHook(() => useInventoryModals());

      act(() => {
        result.current.openItemForm({ _id: '1' });
      });
      act(() => {
        result.current.closeItemForm();
      });

      expect(result.current.isItemFormOpen).toBe(false);
      expect(result.current.editingItem).toBeNull();
    });
  });

  describe('Delete Confirmation Modal', () => {
    it('should open single delete confirmation', () => {
      const { result } = renderHook(() => useInventoryModals());

      act(() => {
        result.current.openDeleteConfirm('1', 'Widget A', false);
      });

      expect(result.current.isDeleteOpen).toBe(true);
      expect(result.current.deletingItemName).toBe('Widget A');
      expect(result.current.isDeletingMultiple).toBe(false);
    });

    it('should open bulk delete confirmation', () => {
      const { result } = renderHook(() => useInventoryModals());

      act(() => {
        result.current.openDeleteConfirm(null, '', true);
      });

      expect(result.current.isDeleteOpen).toBe(true);
      expect(result.current.deletingItemName).toBe('');
      expect(result.current.isDeletingMultiple).toBe(true);
    });

    it('should close delete and reset state', () => {
      const { result } = renderHook(() => useInventoryModals());

      act(() => {
        result.current.openDeleteConfirm('1', 'Widget A');
      });
      act(() => {
        result.current.closeDelete();
      });

      expect(result.current.isDeleteOpen).toBe(false);
      expect(result.current.deletingItemName).toBe('');
      expect(result.current.isDeletingMultiple).toBe(false);
    });
  });

  describe('Bulk Edit Modal', () => {
    it('should open and close bulk edit', () => {
      const { result } = renderHook(() => useInventoryModals());

      act(() => {
        result.current.openBulkEdit();
      });
      expect(result.current.isBulkEditOpen).toBe(true);

      act(() => {
        result.current.closeBulkEdit();
      });
      expect(result.current.isBulkEditOpen).toBe(false);
    });
  });

  describe('Export Modal', () => {
    it('should open and close export modal', () => {
      const { result } = renderHook(() => useInventoryModals());

      act(() => {
        result.current.openExport();
      });
      expect(result.current.showExportModal).toBe(true);

      act(() => {
        result.current.closeExport();
      });
      expect(result.current.showExportModal).toBe(false);
    });
  });
});
