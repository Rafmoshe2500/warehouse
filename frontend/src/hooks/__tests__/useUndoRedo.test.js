import { renderHook, act } from '@testing-library/react';
import { useUndoRedo, ACTION_TYPES } from '../useUndoRedo';

describe('useUndoRedo', () => {
  let mockOnEdit;
  let mockOnRestoreItems;
  let mockOnCreateUndoLog;
  let mockOnCreateRedoLog;
  let defaultCallbacks;

  beforeEach(() => {
    mockOnEdit = vi.fn().mockResolvedValue(undefined);
    mockOnRestoreItems = vi.fn().mockResolvedValue(undefined);
    mockOnCreateUndoLog = vi.fn().mockResolvedValue(undefined);
    mockOnCreateRedoLog = vi.fn().mockResolvedValue(undefined);
    defaultCallbacks = {
      onEdit: mockOnEdit,
      onRestoreItems: mockOnRestoreItems,
      onCreateUndoLog: mockOnCreateUndoLog,
      onCreateRedoLog: mockOnCreateRedoLog,
    };
  });

  it('should initialize with empty history', () => {
    const { result } = renderHook(() => useUndoRedo(defaultCallbacks));

    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
    expect(result.current.canUndoEdit).toBe(false);
    expect(result.current.canRedoEdit).toBe(false);
    expect(result.current.canUndoDelete).toBe(false);
    expect(result.current.editHistoryLength).toBe(0);
    expect(result.current.deleteHistoryLength).toBe(0);
  });

  describe('Edit Operations', () => {
    it('should execute edit and add to history', async () => {
      const { result } = renderHook(() => useUndoRedo(defaultCallbacks));

      await act(async () => {
        await result.current.executeEdit('item1', 'name', 'New', 'Old');
      });

      expect(mockOnEdit).toHaveBeenCalledWith('item1', 'name', 'New');
      expect(result.current.canUndoEdit).toBe(true);
      expect(result.current.editHistoryLength).toBe(1);
    });

    it('should undo edit and restore previous value', async () => {
      const { result } = renderHook(() => useUndoRedo(defaultCallbacks));

      await act(async () => {
        await result.current.executeEdit('item1', 'name', 'New', 'Old');
      });
      await act(async () => {
        await result.current.undoEdit();
      });

      expect(mockOnEdit).toHaveBeenLastCalledWith('item1', 'name', 'Old', true);
      expect(result.current.canUndoEdit).toBe(false);
      expect(result.current.canRedoEdit).toBe(true);
    });

    it('should redo edit after undo', async () => {
      const { result } = renderHook(() => useUndoRedo(defaultCallbacks));

      await act(async () => {
        await result.current.executeEdit('item1', 'name', 'New', 'Old');
      });
      await act(async () => {
        await result.current.undoEdit();
      });
      await act(async () => {
        await result.current.redoEdit();
      });

      expect(mockOnEdit).toHaveBeenLastCalledWith('item1', 'name', 'New', true);
      expect(result.current.canUndoEdit).toBe(true);
      expect(result.current.canRedoEdit).toBe(false);
    });

    it('should clear redo stack on new edit', async () => {
      const { result } = renderHook(() => useUndoRedo(defaultCallbacks));

      await act(async () => {
        await result.current.executeEdit('item1', 'name', 'V1', 'V0');
      });
      await act(async () => {
        await result.current.undoEdit();
      });
      expect(result.current.canRedoEdit).toBe(true);

      await act(async () => {
        await result.current.executeEdit('item1', 'name', 'V2', 'V0');
      });
      expect(result.current.canRedoEdit).toBe(false);
    });

    it('should cap edit history at maxEditHistory', async () => {
      const { result } = renderHook(() =>
        useUndoRedo(defaultCallbacks, 3, 10)
      );

      for (let i = 0; i < 5; i++) {
        await act(async () => {
          await result.current.executeEdit('item1', 'name', `V${i}`, `V${i - 1}`);
        });
      }

      expect(result.current.editHistoryLength).toBe(3);
    });

    it('should return false when undo with empty history', async () => {
      const { result } = renderHook(() => useUndoRedo(defaultCallbacks));

      let undoResult;
      await act(async () => {
        undoResult = await result.current.undoEdit();
      });

      expect(undoResult).toBe(false);
    });

    it('should return false when redo with empty redo stack', async () => {
      const { result } = renderHook(() => useUndoRedo(defaultCallbacks));

      let redoResult;
      await act(async () => {
        redoResult = await result.current.redoEdit();
      });

      expect(redoResult).toBe(false);
    });
  });

  describe('Delete Operations', () => {
    it('should record single delete', () => {
      const { result } = renderHook(() => useUndoRedo(defaultCallbacks));
      const deletedItem = { _id: '1', name: 'Test' };

      act(() => {
        result.current.recordDelete(deletedItem);
      });

      expect(result.current.canUndoDelete).toBe(true);
      expect(result.current.deleteHistoryLength).toBe(1);
    });

    it('should record bulk delete', () => {
      const { result } = renderHook(() => useUndoRedo(defaultCallbacks));
      const deletedItems = [
        { _id: '1', name: 'A' },
        { _id: '2', name: 'B' },
      ];

      act(() => {
        result.current.recordDelete(deletedItems, true);
      });

      expect(result.current.canUndoDelete).toBe(true);
      expect(result.current.deleteHistoryLength).toBe(1);
    });

    it('should undo delete and restore items', async () => {
      const { result } = renderHook(() => useUndoRedo(defaultCallbacks));
      const deletedItem = { _id: '1', name: 'Test' };

      act(() => {
        result.current.recordDelete(deletedItem);
      });
      await act(async () => {
        await result.current.undoDelete();
      });

      expect(mockOnRestoreItems).toHaveBeenCalledWith([deletedItem]);
      expect(result.current.canUndoDelete).toBe(false);
    });

    it('should cap delete history at maxDeleteHistory', () => {
      const { result } = renderHook(() =>
        useUndoRedo(defaultCallbacks, 20, 2)
      );

      for (let i = 0; i < 5; i++) {
        act(() => {
          result.current.recordDelete({ _id: String(i) });
        });
      }

      expect(result.current.deleteHistoryLength).toBe(2);
    });
  });

  describe('Combined Undo/Redo', () => {
    it('should undo most recent action (edit vs delete by timestamp)', async () => {
      const { result } = renderHook(() => useUndoRedo(defaultCallbacks));

      await act(async () => {
        await result.current.executeEdit('item1', 'name', 'New', 'Old');
      });

      expect(result.current.canUndo).toBe(true);

      await act(async () => {
        await result.current.undo();
      });

      // Should have undone the edit
      expect(mockOnEdit).toHaveBeenLastCalledWith('item1', 'name', 'Old', true);
    });

    it('should redo via combined redo', async () => {
      const { result } = renderHook(() => useUndoRedo(defaultCallbacks));

      await act(async () => {
        await result.current.executeEdit('item1', 'name', 'New', 'Old');
      });
      await act(async () => {
        await result.current.undo();
      });

      expect(result.current.canRedo).toBe(true);

      await act(async () => {
        await result.current.redo();
      });

      expect(result.current.canRedo).toBe(false);
    });

    it('should return false when nothing to undo', async () => {
      const { result } = renderHook(() => useUndoRedo(defaultCallbacks));

      let undoResult;
      await act(async () => {
        undoResult = await result.current.undo();
      });

      expect(undoResult).toBe(false);
    });
  });

  describe('Logging', () => {
    it('should call onCreateUndoLog when undoing edit', async () => {
      const { result } = renderHook(() => useUndoRedo(defaultCallbacks));

      await act(async () => {
        await result.current.executeEdit('item1', 'name', 'New', 'Old');
      });
      await act(async () => {
        await result.current.undoEdit();
      });

      expect(mockOnCreateUndoLog).toHaveBeenCalledWith('edit', {
        itemId: 'item1',
        field: 'name',
        from: 'New',
        to: 'Old',
      });
    });

    it('should call onCreateRedoLog when redoing edit', async () => {
      const { result } = renderHook(() => useUndoRedo(defaultCallbacks));

      await act(async () => {
        await result.current.executeEdit('item1', 'name', 'New', 'Old');
      });
      await act(async () => {
        await result.current.undoEdit();
      });
      await act(async () => {
        await result.current.redoEdit();
      });

      expect(mockOnCreateRedoLog).toHaveBeenCalledWith('edit', {
        itemId: 'item1',
        field: 'name',
        from: 'Old',
        to: 'New',
      });
    });

    it('should not fail if undo log callback throws', async () => {
      mockOnCreateUndoLog.mockRejectedValue(new Error('log failed'));
      const { result } = renderHook(() => useUndoRedo(defaultCallbacks));

      await act(async () => {
        await result.current.executeEdit('item1', 'name', 'New', 'Old');
      });

      // Should not throw
      await act(async () => {
        const res = await result.current.undoEdit();
        expect(res).toBe(true);
      });
    });
  });
});
