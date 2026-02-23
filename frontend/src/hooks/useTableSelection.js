import { useState, useEffect, useCallback } from 'react';
import { formatCellValue } from '../utils/formatters';

export const useTableSelection = ({ onShowToast, items = [], columns = [] }) => {
    const [selectedCells, setSelectedCells] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState(null);
    const [focusedCell, setFocusedCell] = useState(null);

    const copySelectedCells = useCallback(async () => {
        if (selectedCells.length === 0) return;

        // Determine display order from items/columns arrays
        const itemOrder = items.map(i => i._id);
        const colOrder  = columns.map(c => c.key);

        // Group cells: byRow[itemId][field] = value
        const byRow = {};
        for (const cell of selectedCells) {
            if (!byRow[cell.itemId]) byRow[cell.itemId] = {};
            byRow[cell.itemId][cell.field] = cell.value;
        }

        const rowIds = itemOrder.filter(id => byRow[id]);
        if (rowIds.length === 0) return;

        const selectedFields = [...new Set(selectedCells.map(c => c.field))];
        const orderedFields  = colOrder.filter(k => selectedFields.includes(k));

        let text;
        if (rowIds.length === 1) {
            // Single row → tab-separated (horizontal)
            text = orderedFields.map(k => formatCellValue(byRow[rowIds[0]][k])).join('\t');
        } else if (orderedFields.length === 1) {
            // Single column → newline-separated (vertical)
            text = rowIds.map(id => formatCellValue(byRow[id]?.[orderedFields[0]])).join('\n');
        } else {
            // Multi-row multi-col → full grid
            text = rowIds
                .map(id => orderedFields.map(k => formatCellValue(byRow[id]?.[k])).join('\t'))
                .join('\n');
        }

        try {
            await navigator.clipboard.writeText(text);
            if (onShowToast) onShowToast(`${selectedCells.length} תאים הועתקו`, 'success');
        } catch {
            if (onShowToast) onShowToast('שגיאה בהעתקה', 'error');
        }
    }, [selectedCells, items, columns, onShowToast]);

    const handleCellMouseDown = useCallback((e, item, field, value) => {
        if (e.button !== 0) return;

        // Ctrl/Meta click = row selection only, don't capture cell
        if (e.ctrlKey || e.metaKey) return;

        e.preventDefault();
        e.stopPropagation();
        const cellKey = `${item._id}-${field}`;

        setIsDragging(true);
        setDragStart({ itemId: item._id, field, value });
        // Plain click: start a fresh single-cell selection
        setSelectedCells([{ key: cellKey, itemId: item._id, field, value }]);
    }, []);

    const handleCellMouseEnter = useCallback((e, item, field, value) => {
        if (!isDragging || !dragStart) return;
        const cellKey = `${item._id}-${field}`;
        setSelectedCells(prev => {
            if (!prev.find(c => c.key === cellKey)) {
                return [...prev, { key: cellKey, itemId: item._id, field, value }];
            }
            return prev;
        });
    }, [isDragging, dragStart]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
        setDragStart(null);
    }, []);

    const clearSelection = useCallback(() => {
        setSelectedCells([]);
        setFocusedCell(null);
    }, []);

    const setFocus = useCallback((cell) => {
        setFocusedCell(prev => {
            if (prev && prev.itemId === cell.itemId && prev.field === cell.field) {
                return null;
            }
            return cell;
        });
    }, []);

    useEffect(() => {
        document.addEventListener('mouseup', handleMouseUp);
        return () => document.removeEventListener('mouseup', handleMouseUp);
    }, [handleMouseUp]);

    useEffect(() => {
        const handleGlobalMouseDown = (e) => {
            if (e.target.closest('.item-table__context-menu')) return;
            if (e.target.closest('.item-table__edit-container')) return;
            if (e.target.closest('.item-table__cell--editable') ||
                e.target.closest('.item-table__cell--immutable')) return;

            if (selectedCells.length > 0) setSelectedCells([]);
            setFocusedCell(null);
        };

        document.addEventListener('mousedown', handleGlobalMouseDown);
        return () => document.removeEventListener('mousedown', handleGlobalMouseDown);
    }, [selectedCells]);

    return {
        selectedCells,
        focusedCell,
        isDragging,
        setSelectedCells,
        setFocusedCell: setFocus,
        copySelectedCells,
        clearSelection,
        handleCellMouseDown,
        handleCellMouseEnter,
        handleMouseUp
    };
};

