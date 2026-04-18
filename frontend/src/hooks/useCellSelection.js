import { useState, useCallback, useEffect } from 'react';

/**
 * Unified cell selection hook for all table types.
 *
 * @param {object}   config
 * @param {string}   config.idField        – Property name for item IDs ('_id' | 'item_id')
 * @param {Array}    config.items          – Current visible items
 * @param {Array}    config.allColumns     – Full column definitions (each has `.key`)
 * @param {Function} config.formatValue    – (value) => string for clipboard
 * @param {Function} config.onShowToast    – (message, type) callback
 * @param {string}   config.tableSelector  – CSS selector to detect inside-table clicks
 * @param {object}   [config.visibleColumns] – { [colKey]: boolean } for column visibility
 * @param {boolean}  [config.enableCtrlArrow] – Enable Ctrl+Arrow extension (default false)
 */
export const useCellSelection = ({
  idField = '_id',
  items = [],
  allColumns = [],
  formatValue = (v) => (v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v)),
  onShowToast,
  tableSelector = '.item-table',
  visibleColumns,
  enableCtrlArrow = false,
}) => {
  const [selectedCells, setSelectedCells] = useState([]);
  const [isDragging, setIsDragging]       = useState(false);
  const [dragStart, setDragStart]         = useState(null);
  const [focusedCell, setFocusedCell]     = useState(null);

  // ── Mouse handlers ────────────────────────────────────────────────────────

  const handleCellMouseDown = useCallback((e, itemId, colKey, value) => {
    if (e.button !== 0) return;
    if (e.ctrlKey || e.metaKey) return; // row selection, not cell

    e.preventDefault();
    e.stopPropagation();

    const cellKey = `${itemId}-${colKey}`;
    setIsDragging(true);
    setDragStart({ itemId, colKey, value });
    setFocusedCell({ itemId, colKey });
    setSelectedCells([{ key: cellKey, itemId, colKey, value }]);
  }, []);

  const handleCellMouseEnter = useCallback((e, itemId, colKey, value) => {
    if (!isDragging) return;
    const cellKey = `${itemId}-${colKey}`;
    setSelectedCells(prev =>
      prev.find(c => c.key === cellKey)
        ? prev
        : [...prev, { key: cellKey, itemId, colKey, value }]
    );
  }, [isDragging]);

  // ── Copy (preserves grid structure) ───────────────────────────────────────

  const copySelectedCells = useCallback(async () => {
    if (selectedCells.length === 0) return;

    const itemOrder = items.map(i => i[idField]);
    const colOrder  = allColumns.map(c => c.key);

    const byRow = {};
    for (const cell of selectedCells) {
      if (!byRow[cell.itemId]) byRow[cell.itemId] = {};
      byRow[cell.itemId][cell.colKey] = cell.value;
    }

    const rowIds      = itemOrder.filter(id => byRow[id]);
    if (rowIds.length === 0) return;

    const selCols     = [...new Set(selectedCells.map(c => c.colKey))];
    const orderedCols = colOrder.filter(k => selCols.includes(k));

    let text;
    if (rowIds.length === 1) {
      text = orderedCols.map(k => formatValue(byRow[rowIds[0]][k])).join('\t');
    } else if (orderedCols.length === 1) {
      text = rowIds.map(id => formatValue(byRow[id]?.[orderedCols[0]])).join('\n');
    } else {
      text = rowIds
        .map(id => orderedCols.map(k => formatValue(byRow[id]?.[k])).join('\t'))
        .join('\n');
    }

    try {
      await navigator.clipboard.writeText(text);
      if (onShowToast) onShowToast(`${selectedCells.length} תאים הועתקו`, 'success');
    } catch {
      if (onShowToast) onShowToast('שגיאה בהעתקה', 'error');
    }
  }, [selectedCells, items, allColumns, idField, formatValue, onShowToast]);

  const copyToClipboard = useCallback(async (text) => {
    if (!text || text === '-') return;
    try {
      await navigator.clipboard.writeText(String(text));
      if (onShowToast) onShowToast('הועתק ללוח', 'success');
    } catch {
      if (onShowToast) onShowToast('שגיאה בהעתקה', 'error');
    }
  }, [onShowToast]);

  const clearSelection = useCallback(() => {
    setSelectedCells([]);
    setFocusedCell(null);
  }, []);

  const setFocus = useCallback((cell) => {
    setFocusedCell(prev => {
      if (prev && prev.itemId === cell.itemId && prev.colKey === cell.colKey) return null;
      return cell;
    });
  }, []);

  // ── Global effects ────────────────────────────────────────────────────────

  useEffect(() => {
    const onMouseUp = () => {
      setIsDragging(false);
      setDragStart(null);
    };
    document.addEventListener('mouseup', onMouseUp);
    return () => document.removeEventListener('mouseup', onMouseUp);
  }, []);

  useEffect(() => {
    const onMouseDown = (e) => {
      if (e.target.closest(tableSelector)) return;
      if (e.target.closest('.item-table__context-menu')) return;
      if (e.target.closest('.item-table__edit-container')) return;
      if (selectedCells.length > 0) setSelectedCells([]);
      setFocusedCell(null);
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [selectedCells, tableSelector]);

  useEffect(() => {
    const onKeyDown = (e) => {
      // Ctrl+C → copy
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedCells.length > 0) {
        e.preventDefault();
        copySelectedCells();
        return;
      }

      // Ctrl+Arrow → extend selection from focusedCell
      if (enableCtrlArrow && (e.ctrlKey || e.metaKey) && focusedCell &&
          ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const visCols = visibleColumns
          ? allColumns.filter(c => visibleColumns[c.key] !== false)
          : allColumns;
        const colKeys = visCols.map(c => c.key);
        const itemIds = items.map(i => i[idField]);

        let rowIdx = itemIds.indexOf(focusedCell.itemId);
        let colIdx = colKeys.indexOf(focusedCell.colKey);

        if (e.key === 'ArrowDown')  rowIdx = Math.min(rowIdx + 1, itemIds.length - 1);
        if (e.key === 'ArrowUp')    rowIdx = Math.max(rowIdx - 1, 0);
        if (e.key === 'ArrowLeft')  colIdx = Math.min(colIdx + 1, colKeys.length - 1);
        if (e.key === 'ArrowRight') colIdx = Math.max(colIdx - 1, 0);

        const nextItemId = itemIds[rowIdx];
        const nextColKey = colKeys[colIdx];
        if (!nextItemId || !nextColKey) return;

        const nextValue   = items[rowIdx]?.[nextColKey] ?? '';
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
  }, [copySelectedCells, selectedCells, focusedCell, items, allColumns,
      idField, visibleColumns, enableCtrlArrow]);

  return {
    selectedCells,
    focusedCell,
    isDragging,
    setSelectedCells,
    setFocusedCell: setFocus,
    copySelectedCells,
    copyToClipboard,
    clearSelection,
    handleCellMouseDown,
    handleCellMouseEnter,
  };
};
