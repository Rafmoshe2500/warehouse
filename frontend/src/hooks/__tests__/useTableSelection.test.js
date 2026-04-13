import { renderHook, act } from '@testing-library/react';
import { useTableSelection } from '../useTableSelection';

describe('useTableSelection', () => {
  const mockShowToast = vi.fn();
  const mockItems = [
    { _id: 'item1', description: 'Item A', manufacturer: 'Mfg A' },
    { _id: 'item2', description: 'Item B', manufacturer: 'Mfg B' },
    { _id: 'item3', description: 'Item C', manufacturer: 'Mfg C' },
  ];
  const mockColumns = [
    { key: 'description', label: 'תיאור' },
    { key: 'manufacturer', label: 'יצרן' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with empty selection', () => {
    const { result } = renderHook(() =>
      useTableSelection({ onShowToast: mockShowToast, items: mockItems, columns: mockColumns })
    );

    expect(result.current.selectedCells).toEqual([]);
    expect(result.current.focusedCell).toBeNull();
    expect(result.current.isDragging).toBe(false);
  });

  it('should select a single cell on mouse down', () => {
    const { result } = renderHook(() =>
      useTableSelection({ onShowToast: mockShowToast, items: mockItems, columns: mockColumns })
    );

    const mockEvent = {
      button: 0,
      ctrlKey: false,
      metaKey: false,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    };

    act(() => {
      result.current.handleCellMouseDown(mockEvent, mockItems[0], 'description', 'Item A');
    });

    expect(result.current.selectedCells).toHaveLength(1);
    expect(result.current.selectedCells[0]).toEqual({
      key: 'item1-description',
      itemId: 'item1',
      field: 'description',
      value: 'Item A',
    });
  });

  it('should ignore non-left-click (right-click)', () => {
    const { result } = renderHook(() =>
      useTableSelection({ onShowToast: mockShowToast, items: mockItems, columns: mockColumns })
    );

    const mockEvent = { button: 2, ctrlKey: false, metaKey: false };

    act(() => {
      result.current.handleCellMouseDown(mockEvent, mockItems[0], 'description', 'Item A');
    });

    expect(result.current.selectedCells).toEqual([]);
  });

  it('should not capture cell on ctrl+click (row selection mode)', () => {
    const { result } = renderHook(() =>
      useTableSelection({ onShowToast: mockShowToast, items: mockItems, columns: mockColumns })
    );

    const mockEvent = {
      button: 0,
      ctrlKey: true,
      metaKey: false,
    };

    act(() => {
      result.current.handleCellMouseDown(mockEvent, mockItems[0], 'description', 'Item A');
    });

    expect(result.current.selectedCells).toEqual([]);
  });

  it('should add cells during drag (mouse enter while dragging)', () => {
    const { result } = renderHook(() =>
      useTableSelection({ onShowToast: mockShowToast, items: mockItems, columns: mockColumns })
    );

    const mockEvent = {
      button: 0,
      ctrlKey: false,
      metaKey: false,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    };

    // Start drag
    act(() => {
      result.current.handleCellMouseDown(mockEvent, mockItems[0], 'description', 'Item A');
    });

    // Drag into another cell
    act(() => {
      result.current.handleCellMouseEnter({}, mockItems[1], 'description', 'Item B');
    });

    expect(result.current.selectedCells).toHaveLength(2);
    expect(result.current.selectedCells[1].itemId).toBe('item2');
  });

  it('should not add duplicate cells during drag', () => {
    const { result } = renderHook(() =>
      useTableSelection({ onShowToast: mockShowToast, items: mockItems, columns: mockColumns })
    );

    const mockEvent = {
      button: 0,
      ctrlKey: false,
      metaKey: false,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    };

    act(() => {
      result.current.handleCellMouseDown(mockEvent, mockItems[0], 'description', 'Item A');
    });

    // Enter same cell again
    act(() => {
      result.current.handleCellMouseEnter({}, mockItems[0], 'description', 'Item A');
    });

    expect(result.current.selectedCells).toHaveLength(1);
  });

  it('should clear selection', () => {
    const { result } = renderHook(() =>
      useTableSelection({ onShowToast: mockShowToast, items: mockItems, columns: mockColumns })
    );

    const mockEvent = {
      button: 0,
      ctrlKey: false,
      metaKey: false,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    };

    act(() => {
      result.current.handleCellMouseDown(mockEvent, mockItems[0], 'description', 'Item A');
    });

    act(() => {
      result.current.clearSelection();
    });

    expect(result.current.selectedCells).toEqual([]);
    expect(result.current.focusedCell).toBeNull();
  });

  it('should set and toggle focused cell', () => {
    const { result } = renderHook(() =>
      useTableSelection({ onShowToast: mockShowToast, items: mockItems, columns: mockColumns })
    );

    act(() => {
      result.current.setFocusedCell({ itemId: 'item1', field: 'description' });
    });
    expect(result.current.focusedCell).toEqual({ itemId: 'item1', field: 'description' });

    // Setting the same cell again should toggle it off
    act(() => {
      result.current.setFocusedCell({ itemId: 'item1', field: 'description' });
    });
    expect(result.current.focusedCell).toBeNull();
  });

  it('should copy single row cells as tab-separated text', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText: writeTextMock },
    });

    const { result } = renderHook(() =>
      useTableSelection({ onShowToast: mockShowToast, items: mockItems, columns: mockColumns })
    );

    // Manually set selected cells
    act(() => {
      result.current.setSelectedCells([
        { key: 'item1-description', itemId: 'item1', field: 'description', value: 'Item A' },
        { key: 'item1-manufacturer', itemId: 'item1', field: 'manufacturer', value: 'Mfg A' },
      ]);
    });

    await act(async () => {
      await result.current.copySelectedCells();
    });

    expect(writeTextMock).toHaveBeenCalledWith('Item A\tMfg A');
    expect(mockShowToast).toHaveBeenCalledWith('2 תאים הועתקו', 'success');
  });

  it('should copy single column cells as newline-separated text', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText: writeTextMock },
    });

    const { result } = renderHook(() =>
      useTableSelection({ onShowToast: mockShowToast, items: mockItems, columns: mockColumns })
    );

    act(() => {
      result.current.setSelectedCells([
        { key: 'item1-description', itemId: 'item1', field: 'description', value: 'Item A' },
        { key: 'item2-description', itemId: 'item2', field: 'description', value: 'Item B' },
      ]);
    });

    await act(async () => {
      await result.current.copySelectedCells();
    });

    expect(writeTextMock).toHaveBeenCalledWith('Item A\nItem B');
  });

  it('should not copy when no cells selected', async () => {
    const writeTextMock = vi.fn();
    Object.assign(navigator, {
      clipboard: { writeText: writeTextMock },
    });

    const { result } = renderHook(() =>
      useTableSelection({ onShowToast: mockShowToast, items: mockItems, columns: mockColumns })
    );

    await act(async () => {
      await result.current.copySelectedCells();
    });

    expect(writeTextMock).not.toHaveBeenCalled();
  });

  it('should stop dragging on mouse up', () => {
    const { result } = renderHook(() =>
      useTableSelection({ onShowToast: mockShowToast, items: mockItems, columns: mockColumns })
    );

    const mockEvent = {
      button: 0,
      ctrlKey: false,
      metaKey: false,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    };

    act(() => {
      result.current.handleCellMouseDown(mockEvent, mockItems[0], 'description', 'Item A');
    });
    expect(result.current.isDragging).toBe(true);

    act(() => {
      result.current.handleMouseUp();
    });
    expect(result.current.isDragging).toBe(false);
  });
});
