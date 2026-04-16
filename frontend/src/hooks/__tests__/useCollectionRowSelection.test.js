import { renderHook, act } from '@testing-library/react';
import { useCollectionRowSelection } from '../useCollectionRowSelection';

const makeItems = (ids) => ids.map(id => ({ item_id: id, name: `item-${id}` }));

describe('useCollectionRowSelection', () => {
  it('initializes with empty selection', () => {
    const { result } = renderHook(() => useCollectionRowSelection(makeItems(['a', 'b'])));
    expect(result.current.selectedItems.size).toBe(0);
  });

  it('selects all items via handleSelectAll', () => {
    const items = makeItems(['a', 'b', 'c']);
    const { result } = renderHook(() => useCollectionRowSelection(items));

    act(() => {
      result.current.handleSelectAll({ target: { checked: true } });
    });

    expect(result.current.selectedItems.size).toBe(3);
    expect(result.current.selectedItems.has('a')).toBe(true);
    expect(result.current.selectedItems.has('c')).toBe(true);
  });

  it('deselects all items via handleSelectAll unchecked', () => {
    const items = makeItems(['a', 'b']);
    const { result } = renderHook(() => useCollectionRowSelection(items));

    act(() => {
      result.current.handleSelectAll({ target: { checked: true } });
    });
    act(() => {
      result.current.handleSelectAll({ target: { checked: false } });
    });

    expect(result.current.selectedItems.size).toBe(0);
  });

  it('toggles item on checkbox click', () => {
    const items = makeItems(['a', 'b']);
    const { result } = renderHook(() => useCollectionRowSelection(items));

    act(() => {
      result.current.handleCheckboxClick('a', { stopPropagation: vi.fn() });
    });

    expect(result.current.selectedItems.has('a')).toBe(true);

    act(() => {
      result.current.handleCheckboxClick('a', { stopPropagation: vi.fn() });
    });

    expect(result.current.selectedItems.has('a')).toBe(false);
  });

  it('adds item on Ctrl+click row', () => {
    const items = makeItems(['a', 'b', 'c']);
    const { result } = renderHook(() => useCollectionRowSelection(items));

    act(() => {
      result.current.handleRowClick({ item_id: 'b' }, {
        ctrlKey: true,
        metaKey: false,
        shiftKey: false,
        preventDefault: vi.fn(),
        target: { tagName: 'TD', closest: () => null },
      });
    });

    expect(result.current.selectedItems.has('b')).toBe(true);
    expect(result.current.selectedItems.size).toBe(1);
  });

  it('deselects item on second Ctrl+click', () => {
    const items = makeItems(['a', 'b']);
    const { result } = renderHook(() => useCollectionRowSelection(items));

    const event = {
      ctrlKey: true,
      metaKey: false,
      shiftKey: false,
      preventDefault: vi.fn(),
      target: { tagName: 'TD', closest: () => null },
    };

    act(() => {
      result.current.handleRowClick({ item_id: 'a' }, event);
    });
    act(() => {
      result.current.handleRowClick({ item_id: 'a' }, event);
    });

    expect(result.current.selectedItems.has('a')).toBe(false);
  });

  it('selects a range on Shift+click after Ctrl+click', () => {
    const items = makeItems(['a', 'b', 'c', 'd']);
    const { result } = renderHook(() => useCollectionRowSelection(items));

    act(() => {
      result.current.handleRowClick({ item_id: 'a' }, {
        ctrlKey: true, metaKey: false, shiftKey: false,
        preventDefault: vi.fn(),
        target: { tagName: 'TD', closest: () => null },
      });
    });

    act(() => {
      result.current.handleRowClick({ item_id: 'c' }, {
        ctrlKey: false, metaKey: false, shiftKey: true,
        preventDefault: vi.fn(),
        target: { tagName: 'TD', closest: () => null },
      });
    });

    expect(result.current.selectedItems.has('a')).toBe(true);
    expect(result.current.selectedItems.has('b')).toBe(true);
    expect(result.current.selectedItems.has('c')).toBe(true);
    expect(result.current.selectedItems.has('d')).toBe(false);
  });

  it('clears selection via clearSelection', () => {
    const items = makeItems(['a', 'b']);
    const { result } = renderHook(() => useCollectionRowSelection(items));

    act(() => {
      result.current.handleSelectAll({ target: { checked: true } });
    });
    act(() => {
      result.current.clearSelection();
    });

    expect(result.current.selectedItems.size).toBe(0);
  });

  it('ignores row click on button element', () => {
    const items = makeItems(['a']);
    const { result } = renderHook(() => useCollectionRowSelection(items));

    act(() => {
      result.current.handleRowClick({ item_id: 'a' }, {
        ctrlKey: true, metaKey: false, shiftKey: false,
        preventDefault: vi.fn(),
        target: { tagName: 'BUTTON', closest: () => ({ tagName: 'BUTTON' }) },
      });
    });

    expect(result.current.selectedItems.size).toBe(0);
  });
});
