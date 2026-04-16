import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'sidebar_collapsed';

const useSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) return stored === 'true';
      // Default: expanded on desktop, collapsed on smaller screens
      return window.innerWidth < 1024;
    } catch {
      return false;
    }
  });

  const toggle = useCallback(() => {
    setIsCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem(STORAGE_KEY, String(next)); } catch { /* noop */ }
      return next;
    });
  }, []);

  const expand = useCallback(() => {
    setIsCollapsed(false);
    try { localStorage.setItem(STORAGE_KEY, 'false'); } catch { /* noop */ }
  }, []);

  const collapse = useCallback(() => {
    setIsCollapsed(true);
    try { localStorage.setItem(STORAGE_KEY, 'true'); } catch { /* noop */ }
  }, []);

  // Keyboard shortcut: Ctrl+B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        toggle();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggle]);

  return { isCollapsed, toggle, expand, collapse };
};

export default useSidebar;
