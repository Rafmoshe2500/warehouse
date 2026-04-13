import { renderHook, act } from '@testing-library/react';
import { useCellEditing } from '../useCellEditing';

describe('useCellEditing', () => {
  const mockOnEdit = vi.fn();
  const mockExecuteEdit = vi.fn();
  const immutableFields = ['catalog_number', 'serial', 'manufacturer'];

  const defaultProps = {
    onEdit: mockOnEdit,
    executeEdit: mockExecuteEdit,
    immutableFields,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with no editing cell', () => {
    const { result } = renderHook(() => useCellEditing(defaultProps));

    expect(result.current.editingCell).toBeNull();
    expect(result.current.editValue).toBe('');
  });

  it('should enter edit mode on editable cell', () => {
    const { result } = renderHook(() => useCellEditing(defaultProps));

    act(() => {
      result.current.startEdit('item1', 'description', 'Original Value');
    });

    expect(result.current.editingCell).toEqual({
      itemId: 'item1',
      field: 'description',
      originalValue: 'Original Value',
    });
    expect(result.current.editValue).toBe('Original Value');
  });

  it('should prevent edit on immutable field', () => {
    const { result } = renderHook(() => useCellEditing(defaultProps));

    act(() => {
      result.current.startEdit('item1', 'catalog_number', 'CAT-001');
    });

    expect(result.current.editingCell).toBeNull();
  });

  it('should prevent edit on all immutable fields', () => {
    const { result } = renderHook(() => useCellEditing(defaultProps));

    for (const field of immutableFields) {
      act(() => {
        result.current.startEdit('item1', field, 'some value');
      });
      expect(result.current.editingCell).toBeNull();
    }
  });

  it('should save edited value via executeEdit when value changed', async () => {
    const { result } = renderHook(() => useCellEditing(defaultProps));

    act(() => {
      result.current.startEdit('item1', 'description', 'Original');
    });

    act(() => {
      result.current.updateEditValue('Updated');
    });

    await act(async () => {
      await result.current.saveEdit();
    });

    expect(mockExecuteEdit).toHaveBeenCalledWith('item1', 'description', 'Updated', 'Original');
    expect(result.current.editingCell).toBeNull();
  });

  it('should use onEdit fallback when executeEdit is not provided', async () => {
    const { result } = renderHook(() =>
      useCellEditing({ onEdit: mockOnEdit, immutableFields })
    );

    act(() => {
      result.current.startEdit('item1', 'notes', 'Old');
    });

    act(() => {
      result.current.updateEditValue('New');
    });

    await act(async () => {
      await result.current.saveEdit();
    });

    expect(mockOnEdit).toHaveBeenCalledWith('item1', 'notes', 'New');
  });

  it('should not call edit when value unchanged', async () => {
    const { result } = renderHook(() => useCellEditing(defaultProps));

    act(() => {
      result.current.startEdit('item1', 'description', 'Same');
    });

    // editValue is already 'Same', don't change it

    await act(async () => {
      await result.current.saveEdit();
    });

    expect(mockExecuteEdit).not.toHaveBeenCalled();
    expect(mockOnEdit).not.toHaveBeenCalled();
  });

  it('should cancel edit and revert', () => {
    const { result } = renderHook(() => useCellEditing(defaultProps));

    act(() => {
      result.current.startEdit('item1', 'description', 'Original');
    });

    act(() => {
      result.current.updateEditValue('Modified');
    });

    act(() => {
      result.current.cancelEdit();
    });

    expect(result.current.editingCell).toBeNull();
    expect(result.current.editValue).toBe('');
  });

  it('should correctly detect editing state via isEditing', () => {
    const { result } = renderHook(() => useCellEditing(defaultProps));

    expect(result.current.isEditing('item1', 'description')).toBe(false);

    act(() => {
      result.current.startEdit('item1', 'description', 'Value');
    });

    expect(result.current.isEditing('item1', 'description')).toBe(true);
    expect(result.current.isEditing('item1', 'notes')).toBe(false);
    expect(result.current.isEditing('item2', 'description')).toBe(false);
  });

  it('should handle null/undefined current value as empty string', () => {
    const { result } = renderHook(() => useCellEditing(defaultProps));

    act(() => {
      result.current.startEdit('item1', 'notes', null);
    });

    expect(result.current.editingCell.originalValue).toBe('');
    expect(result.current.editValue).toBe('');
  });

  it('should update edit value correctly', () => {
    const { result } = renderHook(() => useCellEditing(defaultProps));

    act(() => {
      result.current.startEdit('item1', 'description', 'Original');
    });

    act(() => {
      result.current.updateEditValue('Step 1');
    });
    expect(result.current.editValue).toBe('Step 1');

    act(() => {
      result.current.updateEditValue('Step 2');
    });
    expect(result.current.editValue).toBe('Step 2');
  });
});
