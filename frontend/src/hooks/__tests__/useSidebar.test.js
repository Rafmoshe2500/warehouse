import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import useSidebar from '../../hooks/useSidebar';

describe('useSidebar', () => {
  beforeEach(() => {
    localStorage.clear();
    // Mock window.innerWidth for desktop
    Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true });
  });

  it('defaults to expanded on desktop', () => {
    const { result } = renderHook(() => useSidebar());
    expect(result.current.isCollapsed).toBe(false);
  });

  it('defaults to collapsed on smaller screens', () => {
    Object.defineProperty(window, 'innerWidth', { value: 800, writable: true });
    const { result } = renderHook(() => useSidebar());
    expect(result.current.isCollapsed).toBe(true);
  });

  it('toggles collapsed state', () => {
    const { result } = renderHook(() => useSidebar());
    expect(result.current.isCollapsed).toBe(false);
    
    act(() => { result.current.toggle(); });
    expect(result.current.isCollapsed).toBe(true);
    
    act(() => { result.current.toggle(); });
    expect(result.current.isCollapsed).toBe(false);
  });

  it('persists state to localStorage', () => {
    const { result } = renderHook(() => useSidebar());
    
    act(() => { result.current.collapse(); });
    expect(localStorage.getItem('sidebar_collapsed')).toBe('true');
    
    act(() => { result.current.expand(); });
    expect(localStorage.getItem('sidebar_collapsed')).toBe('false');
  });

  it('reads state from localStorage on mount', () => {
    localStorage.setItem('sidebar_collapsed', 'true');
    const { result } = renderHook(() => useSidebar());
    expect(result.current.isCollapsed).toBe(true);
  });

  it('handles Ctrl+B keyboard shortcut', () => {
    const { result } = renderHook(() => useSidebar());
    expect(result.current.isCollapsed).toBe(false);

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'b', ctrlKey: true }));
    });
    expect(result.current.isCollapsed).toBe(true);
  });
});
