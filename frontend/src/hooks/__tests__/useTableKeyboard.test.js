import { renderHook, act } from '@testing-library/react';
import { useTableKeyboard } from '../useTableKeyboard';

describe('useTableKeyboard', () => {
  const mockItems = [
    { _id: 'item1', description: 'A', manufacturer: 'MfgA' },
    { _id: 'item2', description: 'B', manufacturer: 'MfgB' },
    { _id: 'item3', description: 'C', manufacturer: 'MfgC' },
  ];
  const mockColumns = [
    { key: 'description', label: 'תיאור' },
    { key: 'manufacturer', label: 'יצרן' },
  ];

  let defaultProps;

  beforeEach(() => {
    defaultProps = {
      editingCell: null,
      selectedCells: [],
      focusedCell: { itemId: 'item2', field: 'description' },
      canUndo: false,
      canRedo: false,
      items: mockItems,
      columns: mockColumns,
      onSaveEdit: vi.fn(),
      onCopySelectedCells: vi.fn(),
      onUndo: vi.fn(),
      onRedo: vi.fn(),
      onStartEditing: vi.fn(),
      onCancelEdit: vi.fn(),
      onClearSelection: vi.fn(),
      onMoveFocus: vi.fn(),
      onShowToast: vi.fn(),
      setSelectedCells: vi.fn(),
      immutableFields: ['catalog_number', 'serial'],
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const fireKeyDown = (key, modifiers = {}) => {
    const event = new KeyboardEvent('keydown', {
      key,
      ctrlKey: modifiers.ctrlKey || false,
      metaKey: modifiers.metaKey || false,
      shiftKey: modifiers.shiftKey || false,
      bubbles: true,
    });
    // Spy on preventDefault
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
    document.dispatchEvent(event);
    return preventDefaultSpy;
  };

  it('should move focus up with ArrowUp', () => {
    renderHook(() => useTableKeyboard(defaultProps));

    fireKeyDown('ArrowUp');

    expect(defaultProps.onMoveFocus).toHaveBeenCalledWith({
      itemId: 'item1',
      field: 'description',
    });
  });

  it('should move focus down with ArrowDown', () => {
    renderHook(() => useTableKeyboard(defaultProps));

    fireKeyDown('ArrowDown');

    expect(defaultProps.onMoveFocus).toHaveBeenCalledWith({
      itemId: 'item3',
      field: 'description',
    });
  });

  it('should not move above first row', () => {
    defaultProps.focusedCell = { itemId: 'item1', field: 'description' };
    renderHook(() => useTableKeyboard(defaultProps));

    fireKeyDown('ArrowUp');

    expect(defaultProps.onMoveFocus).toHaveBeenCalledWith({
      itemId: 'item1',
      field: 'description',
    });
  });

  it('should not move below last row', () => {
    defaultProps.focusedCell = { itemId: 'item3', field: 'description' };
    renderHook(() => useTableKeyboard(defaultProps));

    fireKeyDown('ArrowDown');

    expect(defaultProps.onMoveFocus).toHaveBeenCalledWith({
      itemId: 'item3',
      field: 'description',
    });
  });

  it('should start editing focused cell on Enter', () => {
    renderHook(() => useTableKeyboard(defaultProps));

    fireKeyDown('Enter');

    expect(defaultProps.onStartEditing).toHaveBeenCalledWith(
      'item2',
      'description',
      'B'
    );
  });

  it('should show toast when trying to edit immutable field via Enter', () => {
    defaultProps.focusedCell = { itemId: 'item1', field: 'catalog_number' };
    defaultProps.immutableFields = ['catalog_number'];
    renderHook(() => useTableKeyboard(defaultProps));

    fireKeyDown('Enter');

    expect(defaultProps.onShowToast).toHaveBeenCalledWith('לא ניתן לערוך שדה זה', 'warning');
    expect(defaultProps.onStartEditing).not.toHaveBeenCalled();
  });

  it('should copy cells with Ctrl+C when cells selected', () => {
    defaultProps.selectedCells = [{ key: 'cell1' }];
    renderHook(() => useTableKeyboard(defaultProps));

    fireKeyDown('c', { ctrlKey: true });

    expect(defaultProps.onCopySelectedCells).toHaveBeenCalled();
  });

  it('should not copy cells with Ctrl+C when no cells selected', () => {
    defaultProps.selectedCells = [];
    renderHook(() => useTableKeyboard(defaultProps));

    fireKeyDown('c', { ctrlKey: true });

    expect(defaultProps.onCopySelectedCells).not.toHaveBeenCalled();
  });

  it('should undo with Ctrl+Z when canUndo', () => {
    defaultProps.canUndo = true;
    renderHook(() => useTableKeyboard(defaultProps));

    fireKeyDown('z', { ctrlKey: true });

    expect(defaultProps.onUndo).toHaveBeenCalled();
  });

  it('should not undo with Ctrl+Z when canUndo is false', () => {
    defaultProps.canUndo = false;
    renderHook(() => useTableKeyboard(defaultProps));

    fireKeyDown('z', { ctrlKey: true });

    expect(defaultProps.onUndo).not.toHaveBeenCalled();
  });

  it('should redo with Ctrl+Y when canRedo', () => {
    defaultProps.canRedo = true;
    renderHook(() => useTableKeyboard(defaultProps));

    fireKeyDown('y', { ctrlKey: true });

    expect(defaultProps.onRedo).toHaveBeenCalled();
  });

  it('should cancel edit with Escape when editing', () => {
    defaultProps.editingCell = { itemId: 'item1', field: 'description' };
    renderHook(() => useTableKeyboard(defaultProps));

    fireKeyDown('Escape');

    expect(defaultProps.onCancelEdit).toHaveBeenCalled();
  });

  it('should clear selection with Escape when cells selected', () => {
    defaultProps.selectedCells = [{ key: 'cell1' }];
    renderHook(() => useTableKeyboard(defaultProps));

    fireKeyDown('Escape');

    expect(defaultProps.onClearSelection).toHaveBeenCalled();
  });

  it('should initialize focus when no cell focused and ArrowDown pressed', () => {
    defaultProps.focusedCell = null;
    renderHook(() => useTableKeyboard(defaultProps));

    fireKeyDown('ArrowDown');

    expect(defaultProps.onMoveFocus).toHaveBeenCalledWith({
      itemId: 'item1',
      field: 'description',
    });
  });

  it('should not intercept Ctrl+Z/C during editing (bubble to browser)', () => {
    defaultProps.editingCell = { itemId: 'item1', field: 'description' };
    renderHook(() => useTableKeyboard(defaultProps));

    fireKeyDown('z', { ctrlKey: true });

    // During editing, undo should NOT be called (browser handles text undo)
    expect(defaultProps.onUndo).not.toHaveBeenCalled();
  });

  it('should save edit with Ctrl+S during editing', () => {
    defaultProps.editingCell = { itemId: 'item1', field: 'description' };
    renderHook(() => useTableKeyboard(defaultProps));

    fireKeyDown('s', { ctrlKey: true });

    expect(defaultProps.onSaveEdit).toHaveBeenCalled();
  });

  it('should clean up event listener on unmount', () => {
    const removeListenerSpy = vi.spyOn(document, 'removeEventListener');

    const { unmount } = renderHook(() => useTableKeyboard(defaultProps));
    unmount();

    expect(removeListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    removeListenerSpy.mockRestore();
  });
});
