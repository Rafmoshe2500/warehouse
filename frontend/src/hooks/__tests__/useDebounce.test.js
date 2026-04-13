import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('hello', 500));
    expect(result.current).toBe('hello');
  });

  it('should not update value before delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'hello', delay: 500 } }
    );

    rerender({ value: 'world', delay: 500 });

    // Before the delay, value should still be 'hello'
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe('hello');
  });

  it('should update value after delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'hello', delay: 500 } }
    );

    rerender({ value: 'world', delay: 500 });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current).toBe('world');
  });

  it('should reset timer on rapid changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'a', delay: 500 } }
    );

    // Rapid changes
    rerender({ value: 'ab', delay: 500 });
    act(() => { vi.advanceTimersByTime(200); });

    rerender({ value: 'abc', delay: 500 });
    act(() => { vi.advanceTimersByTime(200); });

    rerender({ value: 'abcd', delay: 500 });
    act(() => { vi.advanceTimersByTime(200); });

    // Only 200ms since last change - should still be 'a'
    expect(result.current).toBe('a');

    // After remaining 300ms, should update to last value
    act(() => { vi.advanceTimersByTime(300); });
    expect(result.current).toBe('abcd');
  });

  it('should handle different delay values', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'start', delay: 1000 } }
    );

    rerender({ value: 'end', delay: 1000 });

    act(() => { vi.advanceTimersByTime(500); });
    expect(result.current).toBe('start');

    act(() => { vi.advanceTimersByTime(500); });
    expect(result.current).toBe('end');
  });
});
