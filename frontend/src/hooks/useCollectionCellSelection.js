import { useState, useCallback, useEffect } from 'react';
import { COLLECTION_TABLE_COLUMNS } from '../constants/tableConfig';
import { useToast } from '../context/ToastContext';

const fmt = (v) => {
  if (v === null || v === undefined) return '';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
};

/**
 * Manages Excel-like cell selection and copy for the collection table.
 * - Plain click / drag → selects cells
 * - Ctrl+click → row only (hook returns early)
 * - Ctrl+Arrow → extend selection from focusedCell
 * - Ctrl+C → copy grid to clipboard
 */
export const useCollectionCellSelection = (processedItems, visibleColumns) => {
  const { showToast } = useToast();

  const [selectedCells, setSelectedCells] = useState([]);
  const [isDragging, setIsDragging]       = useState(false);
  const [focusedCell, setFocusedCell]     = useState(null);

  // ── Mouse handlers ──────────────────────────────────────────────────────────
  const handleCellMouseDown = useCallback((e, itemId, colKey, value) => {
    if (e.button !== 0) return;
    if (e.ctrlKey || e.metaKey) return; // row selection, not cell

    e.preventDefault();
    e.stopPropagation();

    const cellKey = `${itemId}-${colKey}`;
    setIsDragging(true);
    setFocusedCell({ itemId, colKey });
    setSelectedCells([{ key: cellKey, itemId, colKey, value }]);
  }, []);

  const handleCellMouseEnter = useCallback((e, itemId, colKey, value) => {
    if (!isDragging) return;
    const cellKey = `${itemId}-${colKey}`;
    setSelectedCells(prev =>
      prev.find(c => c.key === cellKey) ? prev : [...prev, { key: cellKey, itemId, colKey, value }]
    );
  }, [isDragging]);

  // ── Copy (preserves grid structure) ────────────────────────────────────────
  const copySelectedCells = useCallback(async () => {
    if (selectedCells.length === 0) return;

    const itemOrder = processedItems.map(i => i.item_id);
    const colOrder  = COLLECTION_TABLE_COLUMNS.map(c => c.key);

    const byRow = {};
    for (const cell of selectedCells) {
      if (!byRow[cell.itemId]) byRow[cell.itemId] = {};
      byRow[cell.itemId][cell.colKey] = cell.value;
    }

    const rowIds       = itemOrder.filter(id => byRow[id]);
    if (rowIds.length === 0) return;

    const selCols      = [...new Set(selectedCells.map(c => c.colKey))];
    const orderedCols  = colOrder.filter(k => selCols.includes(k));

    let text;
    if (rowIds.length === 1) {
      text = orderedCols.map(k => fmt(byRow[rowIds[0]][k])).join('\t');
    } else if (orderedCols.length === 1) {
      text = rowIds.map(id => fmt(byRow[id]?.[orderedCols[0]])).join('\n');
    } else {
      text = rowIds.map(id => orderedCols.map(k => fmt(byRow[id]?.[k])).join('\t')).join('\n');
    }

    try {
      await navigator.clipboard.writeText(text);
      showToast(`${selectedCells.length} תאים הועתקו`, 'success');
    } catch {
      showToast('שגיאה בהעתקה', 'error');
    }
  }, [selectedCells, processedItems, showToast]);

  const copyToClipboard = useCallback(async (text) => {
    if (!text || text === '-') return;
    try {
      await navigator.clipboard.writeText(String(text));
      showToast('הועתק ללוח', 'success');
    } catch {
      showToast('שגיאה בהעתקה', 'error');
    }
  }, [showToast]);

  // ── Global effects (mouseup, outside-click, Ctrl+C, Ctrl+Arrow) ────────────
  useEffect(() => {
    const onMouseUp = () => setIsDragging(false);
    document.addEventListener('mouseup', onMouseUp);
    return () => document.removeEventListener('mouseup', onMouseUp);
  }, []);

  useEffect(() => {
    const onMouseDown = (e) => {
      if (e.target.closest('.collection-items-table')) return;
      setSelectedCells([]);
      setFocusedCell(null);
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedCells.length > 0) {
        e.preventDefault();
        copySelectedCells();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && focusedCell &&
          ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const visCols = COLLECTION_TABLE_COLUMNS.filter(c => visibleColumns[c.key] !== false);
        const colKeys = visCols.map(c => c.key);
        const itemIds = processedItems.map(i => i.item_id);

        let rowIdx = itemIds.indexOf(focusedCell.itemId);
        let colIdx = colKeys.indexOf(focusedCell.colKey);

        if (e.key === 'ArrowDown')  rowIdx = Math.min(rowIdx + 1, itemIds.length - 1);
        if (e.key === 'ArrowUp')    rowIdx = Math.max(rowIdx - 1, 0);
        if (e.key === 'ArrowLeft')  colIdx = Math.min(colIdx + 1, colKeys.length - 1); // RTL
        if (e.key === 'ArrowRight') colIdx = Math.max(colIdx - 1, 0);

        const nextItemId = itemIds[rowIdx];
        const nextColKey = colKeys[colIdx];
        if (!nextItemId || !nextColKey) return;

        const nextValue   = processedItems[rowIdx]?.[nextColKey] ?? '';
        const nextCellKey = `${nextItemId}-${nextColKey}`;

        setFocusedCell({ itemId: nextItemId, colKey: nextColKey });
        setSelectedCells(prev =>
          prev.find(c => c.key === nextCellKey)
            ? prev
            : [...prev, { key: nextCellKey, itemId: nextItemId, colKey: nextColKey, value: nextValue }]
        );
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [copySelectedCells, selectedCells, focusedCell, processedItems, visibleColumns]);

  return {
    selectedCells,
    focusedCell,
    handleCellMouseDown,
    handleCellMouseEnter,
    copyToClipboard,
  };
};

