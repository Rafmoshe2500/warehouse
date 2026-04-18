import { renderHook, act } from '@testing-library/react';
import { useToast } from '../useToast';

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes with empty toasts array', () => {
    const { result } = renderHook(() => useToast());

    expect(result.current.toasts).toEqual([]);
  });

  describe('addToast', () => {
    it('adds a toast with message and default type "info"', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.addToast('Hello World');
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].message).toBe('Hello World');
      expect(result.current.toasts[0].type).toBe('info');
    });

    it('adds a toast with specified type', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.addToast('Error occurred', 'error');
      });

      expect(result.current.toasts[0].type).toBe('error');
    });

    it('returns the toast id', () => {
      const { result } = renderHook(() => useToast());

      let id;
      act(() => {
        id = result.current.addToast('Test');
      });

      expect(id).toBeDefined();
    });

    it('auto-removes toast after duration', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.addToast('Auto remove', 'info', 3000);
      });

      expect(result.current.toasts).toHaveLength(1);

      act(() => {
        vi.advanceTimersByTime(3001);
      });

      expect(result.current.toasts).toHaveLength(0);
    });

    it('does not auto-remove when duration is 0', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.addToast('Persistent', 'info', 0);
      });

      act(() => {
        vi.advanceTimersByTime(10000);
      });

      expect(result.current.toasts).toHaveLength(1);
    });

    it('can stack multiple toasts', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.addToast('First', 'info', 0);
        result.current.addToast('Second', 'success', 0);
        result.current.addToast('Third', 'error', 0);
      });

      expect(result.current.toasts).toHaveLength(3);
    });
  });

  describe('removeToast', () => {
    it('removes toast by id', () => {
      const { result } = renderHook(() => useToast());

      let id;
      act(() => {
        id = result.current.addToast('Remove me', 'info', 0);
      });

      act(() => {
        result.current.removeToast(id);
      });

      expect(result.current.toasts).toHaveLength(0);
    });

    it('does not remove other toasts when removing by id', () => {
      const { result } = renderHook(() => useToast());

      let id1, id2;
      act(() => {
        id1 = result.current.addToast('Keep me', 'info', 0);
        id2 = result.current.addToast('Remove me', 'error', 0);
      });

      act(() => {
        result.current.removeToast(id2);
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].id).toBe(id1);
    });
  });

  describe('convenience methods', () => {
    it('success() adds a toast with type "success"', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.success('Operation complete');
      });

      expect(result.current.toasts[0].type).toBe('success');
      expect(result.current.toasts[0].message).toBe('Operation complete');
    });

    it('error() adds a toast with type "error"', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.error('Something failed');
      });

      expect(result.current.toasts[0].type).toBe('error');
    });

    it('info() adds a toast with type "info"', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.info('FYI');
      });

      expect(result.current.toasts[0].type).toBe('info');
    });

    it('warning() adds a toast with type "warning"', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.warning('Caution!');
      });

      expect(result.current.toasts[0].type).toBe('warning');
    });
  });
});
