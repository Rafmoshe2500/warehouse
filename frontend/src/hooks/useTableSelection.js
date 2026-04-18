import { useCallback, useMemo } from 'react';
import { useCellSelection } from './useCellSelection';
import { formatCellValue } from '../utils/formatters';

/**
 * Adapter over useCellSelection for the inventory ItemTable.
 * Preserves the original API where:
 * - handlers receive (e, item, field, value) with full item objects
 * - focusedCell uses `.field` instead of `.colKey`
 * - selectedCells use `.field` instead of `.colKey`
 */
export const useTableSelection = ({ onShowToast, items = [], columns = [] }) => {
  const result = useCellSelection({
    idField: '_id',
    items,
    allColumns: columns,
    formatValue: formatCellValue,
    onShowToast,
    tableSelector: '.item-table__cell--editable, .item-table__cell--immutable',
  });

  // Wrap handlers to accept (e, item, field, value) → (e, itemId, colKey, value)
  const handleCellMouseDown = useCallback((e, item, field, value) => {
    result.handleCellMouseDown(e, item._id, field, value);
  }, [result.handleCellMouseDown]);

  const handleCellMouseEnter = useCallback((e, item, field, value) => {
    result.handleCellMouseEnter(e, item._id, field, value);
  }, [result.handleCellMouseEnter]);

  // Map focusedCell.colKey → .field for backward compat
  const focusedCell = useMemo(() => {
    if (!result.focusedCell) return null;
    return { itemId: result.focusedCell.itemId, field: result.focusedCell.colKey };
  }, [result.focusedCell]);

  // Map selectedCells[].colKey → .field for backward compat
  const selectedCells = useMemo(() =>
    result.selectedCells.map(c => ({ ...c, field: c.colKey })),
    [result.selectedCells]
  );

  // Wrap setFocusedCell to accept { itemId, field } → { itemId, colKey }
  const setFocusedCell = useCallback((cell) => {
    if (!cell) return result.setFocusedCell(cell);
    result.setFocusedCell({ itemId: cell.itemId, colKey: cell.field || cell.colKey });
  }, [result.setFocusedCell]);

  // Wrap setSelectedCells to accept cells with .field → .colKey
  const setSelectedCells = useCallback((cells) => {
    result.setSelectedCells(cells.map(c => ({
      ...c,
      colKey: c.colKey || c.field,
    })));
  }, [result.setSelectedCells]);

  return {
    selectedCells,
    focusedCell,
    isDragging: result.isDragging,
    setSelectedCells,
    setFocusedCell,
    copySelectedCells: result.copySelectedCells,
    clearSelection: result.clearSelection,
    handleCellMouseDown,
    handleCellMouseEnter,
    handleMouseUp: () => {},
  };
};

