import { renderHook, act } from '@testing-library/react';
import { useContextMenu } from '../useContextMenu';

describe('useContextMenu', () => {
  it('should initialize as closed', () => {
    const { result } = renderHook(() => useContextMenu());

    expect(result.current.contextMenu).toBeNull();
    expect(result.current.isOpen).toBe(false);
  });

  it('should open at specified position', () => {
    const { result } = renderHook(() => useContextMenu());

    act(() => {
      result.current.openContextMenu(100, 200);
    });

    expect(result.current.contextMenu).toEqual({ x: 100, y: 200 });
    expect(result.current.isOpen).toBe(true);
  });

  it('should close menu', () => {
    const { result } = renderHook(() => useContextMenu());

    act(() => {
      result.current.openContextMenu(100, 200);
    });

    act(() => {
      result.current.closeContextMenu();
    });

    expect(result.current.contextMenu).toBeNull();
    expect(result.current.isOpen).toBe(false);
  });

  it('should handle right-click via handleContextMenu', () => {
    const { result } = renderHook(() => useContextMenu());

    const mockEvent = {
      preventDefault: vi.fn(),
      clientX: 150,
      clientY: 250,
    };

    act(() => {
      result.current.handleContextMenu(mockEvent, true);
    });

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(result.current.contextMenu).toEqual({ x: 150, y: 250 });
  });

  it('should toggle off when already open on second right-click', () => {
    const { result } = renderHook(() => useContextMenu());

    const mockEvent = {
      preventDefault: vi.fn(),
      clientX: 150,
      clientY: 250,
    };

    // First right-click opens
    act(() => {
      result.current.handleContextMenu(mockEvent, true);
    });
    expect(result.current.isOpen).toBe(true);

    // Second right-click closes (toggles)
    act(() => {
      result.current.handleContextMenu(mockEvent, true);
    });
    expect(result.current.isOpen).toBe(false);
  });

  it('should close after edit action', () => {
    const { result } = renderHook(() => useContextMenu());
    const onEdit = vi.fn();

    act(() => {
      result.current.openContextMenu(100, 200);
    });

    act(() => {
      result.current.handleAction('edit', { onEdit });
    });

    expect(onEdit).toHaveBeenCalled();
    expect(result.current.isOpen).toBe(false);
  });

  it('should close after delete action', () => {
    const { result } = renderHook(() => useContextMenu());
    const onDelete = vi.fn();

    act(() => {
      result.current.openContextMenu(100, 200);
    });

    act(() => {
      result.current.handleAction('delete', { onDelete });
    });

    expect(onDelete).toHaveBeenCalled();
    expect(result.current.isOpen).toBe(false);
  });

  it('should close after copy action', () => {
    const { result } = renderHook(() => useContextMenu());
    const onCopy = vi.fn();

    act(() => {
      result.current.openContextMenu(100, 200);
    });

    act(() => {
      result.current.handleAction('copy', { onCopy });
    });

    expect(onCopy).toHaveBeenCalled();
    expect(result.current.isOpen).toBe(false);
  });

  it('should not crash when action callback is missing', () => {
    const { result } = renderHook(() => useContextMenu());

    act(() => {
      result.current.openContextMenu(100, 200);
    });

    // No callback provided — should not throw
    act(() => {
      result.current.handleAction('edit', {});
    });

    expect(result.current.isOpen).toBe(false);
  });
});
