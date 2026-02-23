import { useState, useCallback } from 'react';

/**
 * Manages row multi-selection (Ctrl+Click, Shift+Click, checkbox) for the collection table.
 */
export const useCollectionRowSelection = (processedItems) => {
  const [selectedItems, setSelectedItems]   = useState(new Set());
  const [lastSelectedId, setLastSelectedId] = useState(null);

  const handleSelectAll = (e) => {
    setSelectedItems(e.target.checked
      ? new Set(processedItems.map(i => i.item_id))
      : new Set()
    );
  };

  const handleCheckboxClick = (id, e) => {
    e.stopPropagation();
    setSelectedItems(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    setLastSelectedId(id);
  };

  const handleRowClick = useCallback((item, e) => {
    if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
    if (e.target.tagName === 'INPUT'  && e.target.type !== 'checkbox') return;

    const id = item.item_id;

    if (e.ctrlKey || e.metaKey) {
      setSelectedItems(prev => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      });
      setLastSelectedId(id);
    } else if (e.shiftKey) {
      e.preventDefault();
      if (lastSelectedId) {
        const curIdx  = processedItems.findIndex(i => i.item_id === id);
        const lastIdx = processedItems.findIndex(i => i.item_id === lastSelectedId);
        if (curIdx !== -1 && lastIdx !== -1) {
          const range = processedItems
            .slice(Math.min(curIdx, lastIdx), Math.max(curIdx, lastIdx) + 1)
            .map(i => i.item_id);
          setSelectedItems(prev => new Set([...prev, ...range]));
        }
      } else {
        setSelectedItems(new Set([id]));
        setLastSelectedId(id);
      }
    }
  }, [processedItems, lastSelectedId]);

  const clearSelection = () => setSelectedItems(new Set());

  return {
    selectedItems,
    handleSelectAll,
    handleCheckboxClick,
    handleRowClick,
    clearSelection,
  };
};

