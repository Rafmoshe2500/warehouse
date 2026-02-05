import { useState, useEffect, useCallback } from 'react';
import { formatCellValue } from '../utils/formatters';

export const useTableSelection = ({ onShowToast }) => {
    const [selectedCells, setSelectedCells] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState(null);
    const [focusedCell, setFocusedCell] = useState(null);

    const copySelectedCells = useCallback(async () => {
        if (selectedCells.length === 0) return;

        const values = selectedCells.map(cell => formatCellValue(cell.value)).join('\t');
        try {
            await navigator.clipboard.writeText(values);
            if (onShowToast) onShowToast(`${selectedCells.length} תאים הועתקו`, 'success');
        } catch (err) {
            if (onShowToast) onShowToast('שגיאה בהעתקה', 'error');
        }
    }, [selectedCells, onShowToast]);

    const handleCellMouseDown = useCallback((e, item, field, value) => {
        if (e.button !== 0) return;

        e.preventDefault();
        e.stopPropagation();
        const cellKey = `${item._id}-${field}`;

        if (e.ctrlKey || e.metaKey) {
            setIsDragging(true);
            setDragStart({ itemId: item._id, field, value });
            setSelectedCells(prev => {
                const existing = prev.find(c => c.key === cellKey);
                if (existing) return prev.filter(c => c.key !== cellKey);
                return [...prev, { key: cellKey, itemId: item._id, field, value }];
            });
        } else {
            setSelectedCells(prev => {
                const isOnlySelectedCell = prev.length === 1 && prev[0].key === cellKey;
                if (isOnlySelectedCell) return [];
                return [{ key: cellKey, itemId: item._id, field, value }];
            });
        }
    }, []);

    const handleCellMouseEnter = useCallback((e, item, field, value) => {
        if (isDragging && (e.ctrlKey || e.metaKey) && dragStart) {
            const cellKey = `${item._id}-${field}`;
            setSelectedCells(prev => {
                if (!prev.find(c => c.key === cellKey)) {
                    return [...prev, { key: cellKey, itemId: item._id, field, value }];
                }
                return prev;
            });
        }
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

export default useTableSelection;
