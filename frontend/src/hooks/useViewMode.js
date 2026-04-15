import { useState, useCallback } from 'react';

const VIEW_MODES = {
  compact: { key: 'compact', rowHeight: 35, label: 'צפוף' },
  normal: { key: 'normal', rowHeight: 48, label: 'רגיל' },
  card: { key: 'card', rowHeight: 120, label: 'כרטיסים' }
};

const useViewMode = (storageKey = 'inventory_view_mode') => {
  const [viewMode, setViewMode] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved && VIEW_MODES[saved] ? saved : 'normal';
    } catch {
      return 'normal';
    }
  });

  const changeViewMode = useCallback((mode) => {
    if (VIEW_MODES[mode]) {
      setViewMode(mode);
      try {
        localStorage.setItem(storageKey, mode);
      } catch {
        // localStorage unavailable
      }
    }
  }, [storageKey]);

  return {
    viewMode,
    viewConfig: VIEW_MODES[viewMode],
    changeViewMode,
    VIEW_MODES
  };
};

export { VIEW_MODES };
export default useViewMode;
