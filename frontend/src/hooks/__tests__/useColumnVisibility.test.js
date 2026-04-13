import { renderHook, act } from '@testing-library/react';
import { useColumnVisibility } from '../useColumnVisibility';

describe('useColumnVisibility', () => {
  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'qty', label: 'Quantity' },
    { key: 'price', label: 'Price' },
  ];

  beforeEach(() => {
    localStorage.clear();
  });

  it('should initialize all columns as visible', () => {
    const { result } = renderHook(() =>
      useColumnVisibility('test_cols', columns)
    );

    expect(result.current.visibleColumns).toEqual({
      name: true,
      qty: true,
      price: true,
    });
  });

  it('should toggle column visibility off', () => {
    const { result } = renderHook(() =>
      useColumnVisibility('test_cols', columns)
    );

    act(() => {
      result.current.toggleColumn('qty');
    });

    expect(result.current.visibleColumns.qty).toBe(false);
    expect(result.current.visibleColumns.name).toBe(true);
  });

  it('should toggle column visibility back on', () => {
    const { result } = renderHook(() =>
      useColumnVisibility('test_cols', columns)
    );

    act(() => {
      result.current.toggleColumn('qty');
    });
    act(() => {
      result.current.toggleColumn('qty');
    });

    expect(result.current.visibleColumns.qty).toBe(true);
  });

  it('should persist to localStorage', () => {
    const { result } = renderHook(() =>
      useColumnVisibility('test_cols', columns)
    );

    act(() => {
      result.current.toggleColumn('price');
    });

    const stored = JSON.parse(localStorage.getItem('test_cols'));
    expect(stored.price).toBe(false);
    expect(stored.name).toBe(true);
  });

  it('should hydrate from localStorage', () => {
    localStorage.setItem(
      'test_cols',
      JSON.stringify({ name: true, qty: false, price: true })
    );

    const { result } = renderHook(() =>
      useColumnVisibility('test_cols', columns)
    );

    expect(result.current.visibleColumns.qty).toBe(false);
    expect(result.current.visibleColumns.name).toBe(true);
  });

  it('should reset all columns to visible', () => {
    const { result } = renderHook(() =>
      useColumnVisibility('test_cols', columns)
    );

    act(() => {
      result.current.toggleColumn('name');
      result.current.toggleColumn('qty');
    });
    act(() => {
      result.current.resetColumns();
    });

    expect(result.current.visibleColumns).toEqual({
      name: true,
      qty: true,
      price: true,
    });
  });

  it('should default all visible when no storageKey provided', () => {
    const { result } = renderHook(() =>
      useColumnVisibility(null, columns)
    );

    expect(result.current.visibleColumns).toEqual({
      name: true,
      qty: true,
      price: true,
    });
  });

  it('should handle corrupted localStorage gracefully', () => {
    localStorage.setItem('test_cols', 'not-valid-json');

    const { result } = renderHook(() =>
      useColumnVisibility('test_cols', columns)
    );

    expect(result.current.visibleColumns).toEqual({
      name: true,
      qty: true,
      price: true,
    });
  });

  it('should manage showFilter state', () => {
    const { result } = renderHook(() =>
      useColumnVisibility('test_cols', columns)
    );

    expect(result.current.showFilter).toBe(false);

    act(() => {
      result.current.setShowFilter(true);
    });

    expect(result.current.showFilter).toBe(true);
  });
});
