import { renderHook, act } from '@testing-library/react';
import { useInventorySelection } from '../useInventorySelection';

describe('useInventorySelection', () => {
  const mockItems = [
    { _id: '1', name: 'Item A' },
    { _id: '2', name: 'Item B' },
    { _id: '3', name: 'Item C' },
  ];

  it('should initialize with empty selection', () => {
    const { result } = renderHook(() => useInventorySelection(mockItems));

    expect(result.current.selectedItems).toEqual([]);
    expect(result.current.lastSelectedId).toBeNull();
  });

  it('should initialize with empty array when no items provided', () => {
    const { result } = renderHook(() => useInventorySelection());

    expect(result.current.selectedItems).toEqual([]);
  });

  it('should toggle item selection on', () => {
    const { result } = renderHook(() => useInventorySelection(mockItems));

    act(() => {
      result.current.handleSelectItem('1');
    });

    expect(result.current.selectedItems).toEqual(['1']);
    expect(result.current.lastSelectedId).toBe('1');
  });

  it('should toggle item selection off', () => {
    const { result } = renderHook(() => useInventorySelection(mockItems));

    act(() => {
      result.current.handleSelectItem('1');
    });
    act(() => {
      result.current.handleSelectItem('1');
    });

    expect(result.current.selectedItems).toEqual([]);
  });

  it('should select multiple items', () => {
    const { result } = renderHook(() => useInventorySelection(mockItems));

    act(() => {
      result.current.handleSelectItem('1');
    });
    act(() => {
      result.current.handleSelectItem('3');
    });

    expect(result.current.selectedItems).toEqual(['1', '3']);
    expect(result.current.lastSelectedId).toBe('3');
  });

  it('should select all items', () => {
    const { result } = renderHook(() => useInventorySelection(mockItems));

    act(() => {
      result.current.handleSelectAll();
    });

    expect(result.current.selectedItems).toEqual(['1', '2', '3']);
  });

  it('should deselect all when all are selected', () => {
    const { result } = renderHook(() => useInventorySelection(mockItems));

    act(() => {
      result.current.handleSelectAll();
    });
    act(() => {
      result.current.handleSelectAll();
    });

    expect(result.current.selectedItems).toEqual([]);
  });

  it('should do nothing when selectAll called with empty items', () => {
    const { result } = renderHook(() => useInventorySelection([]));

    act(() => {
      result.current.handleSelectAll();
    });

    expect(result.current.selectedItems).toEqual([]);
  });

  it('should clear selection', () => {
    const { result } = renderHook(() => useInventorySelection(mockItems));

    act(() => {
      result.current.handleSelectItem('1');
      result.current.handleSelectItem('2');
    });
    act(() => {
      result.current.clearSelection();
    });

    expect(result.current.selectedItems).toEqual([]);
    expect(result.current.lastSelectedId).toBeNull();
  });

  it('should select remaining when not all are selected via selectAll', () => {
    const { result } = renderHook(() => useInventorySelection(mockItems));

    act(() => {
      result.current.handleSelectItem('1');
    });
    act(() => {
      result.current.handleSelectAll();
    });

    expect(result.current.selectedItems).toEqual(['1', '2', '3']);
  });
});
