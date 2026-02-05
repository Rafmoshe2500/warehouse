import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Hook for keyboard navigation in table cells
 * Supports arrow keys, Tab, Enter, Escape, F2
 */
export const useKeyboardNavigation = ({
    items,
    columns,
    editingCell,
    setEditingCell,
    onStartEdit,
    onSaveEdit,
    immutableFields = []
}) => {
    const [focusedCell, setFocusedCell] = useState(null);
    const tableRef = useRef(null);

    // Get item index and column index from focused cell
    const getPosition = useCallback(() => {
        if (!focusedCell) return null;
        const itemIndex = items.findIndex(item => item._id === focusedCell.itemId);
        const colIndex = columns.findIndex(col => col.key === focusedCell.field);
        return { itemIndex, colIndex };
    }, [focusedCell, items, columns]);

    // Move focus to a new cell
    const moveFocus = useCallback((rowDelta, colDelta) => {
        const pos = getPosition();
        if (!pos) {
            // If no cell focused, start from first editable cell
            if (items.length > 0 && columns.length > 0) {
                setFocusedCell({ itemId: items[0]._id, field: columns[0].key });
            }
            return;
        }

        let newRow = pos.itemIndex + rowDelta;
        let newCol = pos.colIndex + colDelta;

        // Handle column overflow (wrap to next/prev row)
        if (newCol >= columns.length) {
            newCol = 0;
            newRow += 1;
        } else if (newCol < 0) {
            newCol = columns.length - 1;
            newRow -= 1;
        }

        // Clamp row index
        newRow = Math.max(0, Math.min(newRow, items.length - 1));
        newCol = Math.max(0, Math.min(newCol, columns.length - 1));

        if (items[newRow] && columns[newCol]) {
            setFocusedCell({
                itemId: items[newRow]._id,
                field: columns[newCol].key
            });
        }
    }, [getPosition, items, columns]);

    // Start editing the focused cell
    const startEditingFocused = useCallback(() => {
        if (!focusedCell) return;
        if (immutableFields.includes(focusedCell.field)) return;

        const item = items.find(i => i._id === focusedCell.itemId);
        if (item) {
            onStartEdit(focusedCell.itemId, focusedCell.field, item[focusedCell.field]);
        }
    }, [focusedCell, items, onStartEdit, immutableFields]);

    // Handle keyboard events
    const handleKeyDown = useCallback((e) => {
        // Ignore if we're in an input field that's not the table
        if (e.target.tagName === 'INPUT' && !e.target.closest('.item-table')) {
            return;
        }

        // When editing, handle differently
        if (editingCell) {
            switch (e.key) {
                case 'Escape':
                    e.preventDefault();
                    setEditingCell(null);
                    break;
                case 'Tab':
                    e.preventDefault();
                    onSaveEdit();
                    // Move to next cell after save
                    setTimeout(() => moveFocus(0, e.shiftKey ? -1 : 1), 50);
                    break;
                case 'Enter':
                    e.preventDefault();
                    onSaveEdit();
                    // Move down after save
                    setTimeout(() => moveFocus(1, 0), 50);
                    break;
                default:
                    break;
            }
            return;
        }

        // When not editing
        switch (e.key) {
            case 'ArrowUp':
                e.preventDefault();
                moveFocus(-1, 0);
                break;
            case 'ArrowDown':
                e.preventDefault();
                moveFocus(1, 0);
                break;
            case 'ArrowLeft':
                e.preventDefault();
                moveFocus(0, 1); // RTL: left = next column
                break;
            case 'ArrowRight':
                e.preventDefault();
                moveFocus(0, -1); // RTL: right = previous column
                break;
            case 'Tab':
                e.preventDefault();
                moveFocus(0, e.shiftKey ? -1 : 1);
                break;
            case 'Enter':
            case 'F2':
                e.preventDefault();
                startEditingFocused();
                break;
            default:
                // Start typing to edit (for printable characters)
                if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                    startEditingFocused();
                }
                break;
        }
    }, [editingCell, setEditingCell, onSaveEdit, moveFocus, startEditingFocused]);

    // Attach keyboard listener
    useEffect(() => {
        const table = tableRef.current;
        if (table) {
            table.addEventListener('keydown', handleKeyDown);
            return () => table.removeEventListener('keydown', handleKeyDown);
        }
    }, [handleKeyDown]);

    // Global listener for when table is clicked
    useEffect(() => {
        const handleGlobalKeyDown = (e) => {
            // Only handle if we have focus on table area
            const tableContainer = document.querySelector('.item-table-container');
            if (tableContainer && tableContainer.contains(document.activeElement)) {
                handleKeyDown(e);
            }
        };

        document.addEventListener('keydown', handleGlobalKeyDown);
        return () => document.removeEventListener('keydown', handleGlobalKeyDown);
    }, [handleKeyDown]);

    return {
        focusedCell,
        setFocusedCell,
        tableRef,
        isCellFocused: (itemId, field) =>
            focusedCell?.itemId === itemId && focusedCell?.field === field
    };
};

export default useKeyboardNavigation;
