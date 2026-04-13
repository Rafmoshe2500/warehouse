import { renderHook, act } from '@testing-library/react';
import { useInlineAddItem } from '../useInlineAddItem';

describe('useInlineAddItem', () => {
  let mockCreateItem;
  let mockOnSuccess;
  let mockOnError;

  beforeEach(() => {
    mockCreateItem = vi.fn().mockResolvedValue(undefined);
    mockOnSuccess = vi.fn();
    mockOnError = vi.fn();
  });

  it('should initialize with isAdding false and empty data', () => {
    const { result } = renderHook(() =>
      useInlineAddItem(mockCreateItem, mockOnSuccess, mockOnError)
    );

    expect(result.current.isAdding).toBe(false);
    expect(result.current.newRowData).toEqual({});
  });

  it('should toggle isAdding on startAdd', () => {
    const { result } = renderHook(() =>
      useInlineAddItem(mockCreateItem, mockOnSuccess, mockOnError)
    );

    act(() => {
      result.current.startAdd();
    });

    expect(result.current.isAdding).toBe(true);
  });

  it('should toggle off when startAdd called while adding', () => {
    const { result } = renderHook(() =>
      useInlineAddItem(mockCreateItem, mockOnSuccess, mockOnError)
    );

    act(() => {
      result.current.startAdd();
    });
    act(() => {
      result.current.startAdd();
    });

    expect(result.current.isAdding).toBe(false);
    expect(result.current.newRowData).toEqual({});
  });

  it('should cancel add and reset state', () => {
    const { result } = renderHook(() =>
      useInlineAddItem(mockCreateItem, mockOnSuccess, mockOnError)
    );

    act(() => {
      result.current.startAdd();
      result.current.handleNewRowChange('catalog_number', 'CAT-1');
    });

    act(() => {
      result.current.cancelAdd();
    });

    expect(result.current.isAdding).toBe(false);
    expect(result.current.newRowData).toEqual({});
  });

  it('should update newRowData on handleNewRowChange', () => {
    const { result } = renderHook(() =>
      useInlineAddItem(mockCreateItem, mockOnSuccess, mockOnError)
    );

    act(() => {
      result.current.handleNewRowChange('catalog_number', 'CAT-1');
    });
    act(() => {
      result.current.handleNewRowChange('description', 'Widget');
    });

    expect(result.current.newRowData).toEqual({
      catalog_number: 'CAT-1',
      description: 'Widget',
    });
  });

  it('should call onError when catalog_number is missing', async () => {
    const { result } = renderHook(() =>
      useInlineAddItem(mockCreateItem, mockOnSuccess, mockOnError)
    );

    act(() => {
      result.current.handleNewRowChange('description', 'Widget');
    });

    await act(async () => {
      await result.current.saveNewItem();
    });

    expect(mockOnError).toHaveBeenCalledWith('חובה למלא מק"ט ותיאור');
    expect(mockCreateItem).not.toHaveBeenCalled();
  });

  it('should call onError when description is missing', async () => {
    const { result } = renderHook(() =>
      useInlineAddItem(mockCreateItem, mockOnSuccess, mockOnError)
    );

    act(() => {
      result.current.handleNewRowChange('catalog_number', 'CAT-1');
    });

    await act(async () => {
      await result.current.saveNewItem();
    });

    expect(mockOnError).toHaveBeenCalledWith('חובה למלא מק"ט ותיאור');
    expect(mockCreateItem).not.toHaveBeenCalled();
  });

  it('should save item successfully and reset state', async () => {
    const { result } = renderHook(() =>
      useInlineAddItem(mockCreateItem, mockOnSuccess, mockOnError)
    );

    act(() => {
      result.current.startAdd();
      result.current.handleNewRowChange('catalog_number', 'CAT-1');
      result.current.handleNewRowChange('description', 'Widget');
    });

    await act(async () => {
      await result.current.saveNewItem();
    });

    expect(mockCreateItem).toHaveBeenCalledWith({
      catalog_number: 'CAT-1',
      description: 'Widget',
    });
    expect(mockOnSuccess).toHaveBeenCalled();
    expect(result.current.isAdding).toBe(false);
    expect(result.current.newRowData).toEqual({});
  });

  it('should handle createItem error and call onError', async () => {
    mockCreateItem.mockRejectedValue({
      response: { data: { detail: 'Duplicate catalog number' } },
    });

    const { result } = renderHook(() =>
      useInlineAddItem(mockCreateItem, mockOnSuccess, mockOnError)
    );

    act(() => {
      result.current.handleNewRowChange('catalog_number', 'CAT-1');
      result.current.handleNewRowChange('description', 'Widget');
    });

    await act(async () => {
      await result.current.saveNewItem();
    });

    expect(mockOnError).toHaveBeenCalledWith('Duplicate catalog number');
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('should show generic error when error detail missing', async () => {
    mockCreateItem.mockRejectedValue(new Error('Network'));

    const { result } = renderHook(() =>
      useInlineAddItem(mockCreateItem, mockOnSuccess, mockOnError)
    );

    act(() => {
      result.current.handleNewRowChange('catalog_number', 'CAT-1');
      result.current.handleNewRowChange('description', 'Widget');
    });

    await act(async () => {
      await result.current.saveNewItem();
    });

    expect(mockOnError).toHaveBeenCalledWith('שגיאה ביצירת פריט');
  });
});
