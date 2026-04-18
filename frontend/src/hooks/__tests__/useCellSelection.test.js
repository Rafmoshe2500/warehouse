import { renderHook, act } from '@testing-library/react';
import { useCellSelection } from '../useCellSelection';

describe('useCellSelection', () => {
  const mockShowToast = vi.fn();
  const mockItems = [
    { _id: 'a', col1: 'A1', col2: 'A2' },
    { _id: 'b', col1: 'B1', col2: 'B2' },
    { _id: 'c', col1: 'C1', col2: 'C2' },
  ];
  const mockColumns = [
    { key: 'col1', label: 'Col 1' },
    { key: 'col2', label: 'Col 2' },
  ];

  const defaultConfig = {
    idField: '_id',
    items: mockItems,
    allColumns: mockColumns,
    onShowToast: mockShowToast,
    tableSelector: '.test-table',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Initialization ──────────────────────────────────────────────────────

  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useCellSelection(defaultConfig));

    expect(result.current.selectedCells).toEqual([]);
    expect(result.current.focusedCell).toBeNull();
    expect(result.current.isDragging).toBe(false);
  });

  // ── Mouse selection ─────────────────────────────────────────────────────

  it('should select a cell on left-click', () => {
    const { result } = renderHook(() => useCellSelection(defaultConfig));
    const e = { button: 0, ctrlKey: false, metaKey: false, preventDefault: vi.fn(), stopPropagation: vi.fn() };

    act(() => { result.current.handleCellMouseDown(e, 'a', 'col1', 'A1'); });

    expect(result.current.selectedCells).toHaveLength(1);
    expect(result.current.selectedCells[0]).toMatchObject({ itemId: 'a', colKey: 'col1', value: 'A1' });
    expect(result.current.focusedCell).toEqual({ itemId: 'a', colKey: 'col1' });
    expect(result.current.isDragging).toBe(true);
  });

  it('should ignore right-click', () => {
    const { result } = renderHook(() => useCellSelection(defaultConfig));
    const e = { button: 2, ctrlKey: false, metaKey: false };

    act(() => { result.current.handleCellMouseDown(e, 'a', 'col1', 'A1'); });

    expect(result.current.selectedCells).toEqual([]);
  });

  it('should ignore ctrl+click (reserved for row selection)', () => {
    const { result } = renderHook(() => useCellSelection(defaultConfig));
    const e = { button: 0, ctrlKey: true, metaKey: false };

    act(() => { result.current.handleCellMouseDown(e, 'a', 'col1', 'A1'); });

    expect(result.current.selectedCells).toEqual([]);
  });

  it('should extend selection on drag (mouse enter while dragging)', () => {
    const { result } = renderHook(() => useCellSelection(defaultConfig));
    const e = { button: 0, ctrlKey: false, metaKey: false, preventDefault: vi.fn(), stopPropagation: vi.fn() };

    act(() => { result.current.handleCellMouseDown(e, 'a', 'col1', 'A1'); });
    act(() => { result.current.handleCellMouseEnter({}, 'b', 'col1', 'B1'); });

    expect(result.current.selectedCells).toHaveLength(2);
    expect(result.current.selectedCells[1]).toMatchObject({ itemId: 'b', colKey: 'col1' });
  });

  it('should not add duplicate cells during drag', () => {
    const { result } = renderHook(() => useCellSelection(defaultConfig));
    const e = { button: 0, ctrlKey: false, metaKey: false, preventDefault: vi.fn(), stopPropagation: vi.fn() };

    act(() => { result.current.handleCellMouseDown(e, 'a', 'col1', 'A1'); });
    act(() => { result.current.handleCellMouseEnter({}, 'a', 'col1', 'A1'); });

    expect(result.current.selectedCells).toHaveLength(1);
  });

  it('should not extend selection when not dragging', () => {
    const { result } = renderHook(() => useCellSelection(defaultConfig));

    act(() => { result.current.handleCellMouseEnter({}, 'a', 'col1', 'A1'); });

    expect(result.current.selectedCells).toEqual([]);
  });

  it('should stop dragging on global mouseup', () => {
    const { result } = renderHook(() => useCellSelection(defaultConfig));
    const e = { button: 0, ctrlKey: false, metaKey: false, preventDefault: vi.fn(), stopPropagation: vi.fn() };

    act(() => { result.current.handleCellMouseDown(e, 'a', 'col1', 'A1'); });
    expect(result.current.isDragging).toBe(true);

    act(() => { document.dispatchEvent(new Event('mouseup')); });
    expect(result.current.isDragging).toBe(false);
  });

  // ── Clear & focus ───────────────────────────────────────────────────────

  it('should clear selection', () => {
    const { result } = renderHook(() => useCellSelection(defaultConfig));
    const e = { button: 0, ctrlKey: false, metaKey: false, preventDefault: vi.fn(), stopPropagation: vi.fn() };

    act(() => { result.current.handleCellMouseDown(e, 'a', 'col1', 'A1'); });
    act(() => { result.current.clearSelection(); });

    expect(result.current.selectedCells).toEqual([]);
    expect(result.current.focusedCell).toBeNull();
  });

  it('should toggle focused cell when set twice', () => {
    const { result } = renderHook(() => useCellSelection(defaultConfig));

    act(() => { result.current.setFocusedCell({ itemId: 'a', colKey: 'col1' }); });
    expect(result.current.focusedCell).toEqual({ itemId: 'a', colKey: 'col1' });

    act(() => { result.current.setFocusedCell({ itemId: 'a', colKey: 'col1' }); });
    expect(result.current.focusedCell).toBeNull();
  });

  it('should change focused cell to a different cell', () => {
    const { result } = renderHook(() => useCellSelection(defaultConfig));

    act(() => { result.current.setFocusedCell({ itemId: 'a', colKey: 'col1' }); });
    act(() => { result.current.setFocusedCell({ itemId: 'b', colKey: 'col2' }); });

    expect(result.current.focusedCell).toEqual({ itemId: 'b', colKey: 'col2' });
  });

  // ── Copy ────────────────────────────────────────────────────────────────

  it('should copy single-row cells as tab-separated', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText: writeTextMock } });

    const { result } = renderHook(() => useCellSelection(defaultConfig));

    act(() => {
      result.current.setSelectedCells([
        { key: 'a-col1', itemId: 'a', colKey: 'col1', value: 'A1' },
        { key: 'a-col2', itemId: 'a', colKey: 'col2', value: 'A2' },
      ]);
    });

    await act(async () => { await result.current.copySelectedCells(); });

    expect(writeTextMock).toHaveBeenCalledWith('A1\tA2');
    expect(mockShowToast).toHaveBeenCalledWith('2 תאים הועתקו', 'success');
  });

  it('should copy single-column cells as newline-separated', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText: writeTextMock } });

    const { result } = renderHook(() => useCellSelection(defaultConfig));

    act(() => {
      result.current.setSelectedCells([
        { key: 'a-col1', itemId: 'a', colKey: 'col1', value: 'A1' },
        { key: 'b-col1', itemId: 'b', colKey: 'col1', value: 'B1' },
      ]);
    });

    await act(async () => { await result.current.copySelectedCells(); });

    expect(writeTextMock).toHaveBeenCalledWith('A1\nB1');
  });

  it('should copy multi-row multi-column as grid', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText: writeTextMock } });

    const { result } = renderHook(() => useCellSelection(defaultConfig));

    act(() => {
      result.current.setSelectedCells([
        { key: 'a-col1', itemId: 'a', colKey: 'col1', value: 'A1' },
        { key: 'a-col2', itemId: 'a', colKey: 'col2', value: 'A2' },
        { key: 'b-col1', itemId: 'b', colKey: 'col1', value: 'B1' },
        { key: 'b-col2', itemId: 'b', colKey: 'col2', value: 'B2' },
      ]);
    });

    await act(async () => { await result.current.copySelectedCells(); });

    expect(writeTextMock).toHaveBeenCalledWith('A1\tA2\nB1\tB2');
  });

  it('should not copy when no cells are selected', async () => {
    const writeTextMock = vi.fn();
    Object.assign(navigator, { clipboard: { writeText: writeTextMock } });

    const { result } = renderHook(() => useCellSelection(defaultConfig));

    await act(async () => { await result.current.copySelectedCells(); });

    expect(writeTextMock).not.toHaveBeenCalled();
  });

  it('should copy single text via copyToClipboard helper', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText: writeTextMock } });

    const { result } = renderHook(() => useCellSelection(defaultConfig));

    await act(async () => { await result.current.copyToClipboard('hello'); });

    expect(writeTextMock).toHaveBeenCalledWith('hello');
    expect(mockShowToast).toHaveBeenCalledWith('הועתק ללוח', 'success');
  });

  it('should not copy empty or dash text via copyToClipboard', async () => {
    const writeTextMock = vi.fn();
    Object.assign(navigator, { clipboard: { writeText: writeTextMock } });

    const { result } = renderHook(() => useCellSelection(defaultConfig));

    await act(async () => { await result.current.copyToClipboard(''); });
    await act(async () => { await result.current.copyToClipboard('-'); });

    expect(writeTextMock).not.toHaveBeenCalled();
  });

  // ── idField support ─────────────────────────────────────────────────────

  it('should work with custom idField', () => {
    const items = [
      { item_id: 'x', col1: 'X1' },
      { item_id: 'y', col1: 'Y1' },
    ];
    const { result } = renderHook(() =>
      useCellSelection({ ...defaultConfig, idField: 'item_id', items })
    );

    const e = { button: 0, ctrlKey: false, metaKey: false, preventDefault: vi.fn(), stopPropagation: vi.fn() };
    act(() => { result.current.handleCellMouseDown(e, 'x', 'col1', 'X1'); });

    expect(result.current.selectedCells[0]).toMatchObject({ itemId: 'x', colKey: 'col1' });
  });
});
