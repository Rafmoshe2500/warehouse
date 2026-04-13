import { renderHook, act } from '@testing-library/react';
import { usePagination } from '../usePagination';

describe('usePagination', () => {
  it('should initialize with default page and limit', () => {
    const { result } = renderHook(() => usePagination());
    expect(result.current.currentPage).toBe(1);
    expect(result.current.itemsPerPage).toBe(30);
  });

  it('should initialize with custom page and limit', () => {
    const { result } = renderHook(() => usePagination(3, 50));
    expect(result.current.currentPage).toBe(3);
    expect(result.current.itemsPerPage).toBe(50);
  });

  it('should go to next page', () => {
    const { result } = renderHook(() => usePagination());

    act(() => { result.current.nextPage(); });
    expect(result.current.currentPage).toBe(2);

    act(() => { result.current.nextPage(); });
    expect(result.current.currentPage).toBe(3);
  });

  it('should go to previous page', () => {
    const { result } = renderHook(() => usePagination(3, 30));

    act(() => { result.current.prevPage(); });
    expect(result.current.currentPage).toBe(2);
  });

  it('should not go below page 1', () => {
    const { result } = renderHook(() => usePagination(1, 30));

    act(() => { result.current.prevPage(); });
    expect(result.current.currentPage).toBe(1);
  });

  it('should go to specific page', () => {
    const { result } = renderHook(() => usePagination());

    act(() => { result.current.goToPage(5); });
    expect(result.current.currentPage).toBe(5);
  });

  it('should change items per page and reset to page 1', () => {
    const { result } = renderHook(() => usePagination(3, 30));

    act(() => { result.current.setItemsPerPage(50); });
    expect(result.current.itemsPerPage).toBe(50);
    expect(result.current.currentPage).toBe(1);
  });

  it('should reset to initial values', () => {
    const { result } = renderHook(() => usePagination(1, 30));

    act(() => { result.current.nextPage(); });
    act(() => { result.current.setItemsPerPage(50); });

    act(() => { result.current.reset(); });
    expect(result.current.currentPage).toBe(1);
    expect(result.current.itemsPerPage).toBe(30);
  });
});
