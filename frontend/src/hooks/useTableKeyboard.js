import { useEffect, useCallback } from 'react';

export const useTableKeyboard = ({
    editingCell,
    selectedCells,
    focusedCell,
    canUndo,
    canRedo,
    items,
    columns,
    onSaveEdit,
    onCopySelectedCells,
    onUndo,
    onRedo,
    onStartEditing,
    onCancelEdit,
    onClearSelection,
    onMoveFocus,
    onShowToast,
    setSelectedCells,
    immutableFields = []
}) => {

    const moveToCell = useCallback((rowDelta, colDelta, addToSelection = false) => {
        if (!focusedCell && items.length > 0) {
            onMoveFocus({ itemId: items[0]._id, field: columns[0].key });
            return;
        }
        if (!focusedCell) return;

        const itemIndex = items.findIndex(i => i._id === focusedCell.itemId);
        const colIndex = columns.findIndex(c => c.key === focusedCell.field);

        let newRow = Math.max(0, Math.min(itemIndex + rowDelta, items.length - 1));
        let newCol = Math.max(0, Math.min(colIndex + colDelta, columns.length - 1));

        if (items[newRow] && columns[newCol]) {
            const newCell = { itemId: items[newRow]._id, field: columns[newCol].key };
            onMoveFocus(newCell);
            
            // If CTRL is held, add the new cell to selection
            if (addToSelection && setSelectedCells) {
                const cellKey = `${newCell.itemId}-${newCell.field}`;
                const cellValue = items[newRow][newCell.field];
                setSelectedCells(prev => {
                    const existing = prev.find(c => c.key === cellKey);
                    if (existing) return prev; // Already selected
                    return [...prev, { key: cellKey, itemId: newCell.itemId, field: newCell.field, value: cellValue }];
                });
            }
            
            // Scroll the focused cell into view
            setTimeout(() => {
                const focusedElement = document.querySelector('.item-table__cell--focused');
                if (!focusedElement) return;

                const tableContainer = document.querySelector('.scrollable-table-layout__content');
                if (!tableContainer) {
                    // Fallback to standard scrollIntoView
                    focusedElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'nearest',
                        inline: 'nearest'
                    });
                    return;
                }

                const cellRect = focusedElement.getBoundingClientRect();
                const containerRect = tableContainer.getBoundingClientRect();
                
                // Check if cell is hidden horizontally (behind frozen columns or off-screen)
                const isHiddenLeft = cellRect.left < containerRect.left + 200; // 200px buffer for frozen columns
                const isHiddenRight = cellRect.right > containerRect.right;
                
                if (isHiddenLeft || isHiddenRight) {
                    focusedElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'nearest',
                        inline: 'center' // Center the cell horizontally for better visibility
                    });
                } else {
                    // Just ensure vertical visibility
                    focusedElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'nearest',
                        inline: 'nearest'
                    });
                }
            }, 50); // Small delay to ensure DOM has updated
        }
    }, [focusedCell, items, columns, onMoveFocus, setSelectedCells]);

    const startEditingFocused = useCallback(() => {
        if (!focusedCell) return;
        if (immutableFields.includes(focusedCell.field)) {
            if (onShowToast) onShowToast('לא ניתן לערוך שדה זה', 'warning');
            return;
        }
        const item = items.find(i => i._id === focusedCell.itemId);
        if (item) {
            onStartEditing(focusedCell.itemId, focusedCell.field, item[focusedCell.field]);
        }
    }, [focusedCell, items, immutableFields, onStartEditing, onShowToast]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            // Priority 1: Save edit (Ctrl+S) - Always intercepted
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                if (editingCell && onSaveEdit) {
                    onSaveEdit();
                    if (onShowToast) onShowToast('נשמר', 'success');
                }
                return;
            }

            // Priority 2: Editing Interaction - let browser handle native undo/copy/paste
            if (editingCell) {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    onCancelEdit();
                }
                // While editing, we DO NOT intercept Ctrl+Z, Ctrl+C etc.
                // We let them bubble up so the browser handles text undo/copy inside the input
                return;
            }

            // Priority 3: Table Navigation and Shortcuts (only when NOT editing)
            if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
                if (selectedCells.length > 0) {
                    e.preventDefault();
                    onCopySelectedCells();
                }
                return;
            }

            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                if (canUndo && onUndo) onUndo();
                return;
            }

            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                e.preventDefault();
                if (canRedo && onRedo) onRedo();
                return;
            }

            // Ignore inputs that are not part of the table logic (e.g. search filters)
            if (e.target.tagName === 'INPUT' && !e.target.classList.contains('item-table__edit-input')) {
                return;
            }

            switch (e.key) {
                case 'ArrowUp': 
                    e.preventDefault(); 
                    if (!e.ctrlKey && !e.metaKey && selectedCells.length > 0) onClearSelection();
                    moveToCell(-1, 0, e.ctrlKey || e.metaKey); 
                    break;
                case 'ArrowDown': 
                    e.preventDefault(); 
                    if (!e.ctrlKey && !e.metaKey && selectedCells.length > 0) onClearSelection();
                    moveToCell(1, 0, e.ctrlKey || e.metaKey); 
                    break;
                case 'ArrowLeft': 
                    e.preventDefault(); 
                    if (!e.ctrlKey && !e.metaKey && selectedCells.length > 0) onClearSelection();
                    moveToCell(0, 1, e.ctrlKey || e.metaKey); 
                    break;
                case 'ArrowRight': 
                    e.preventDefault(); 
                    if (!e.ctrlKey && !e.metaKey && selectedCells.length > 0) onClearSelection();
                    moveToCell(0, -1, e.ctrlKey || e.metaKey); 
                    break;
                case 'Enter': e.preventDefault(); startEditingFocused(); break;
                case 'Escape': if (selectedCells.length > 0) onClearSelection(); break;
                default: break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [
        editingCell, selectedCells, canUndo, canRedo,
        onSaveEdit, onCopySelectedCells, onUndo, onRedo,
        onCancelEdit, onClearSelection, moveToCell, startEditingFocused, onShowToast
    ]);

    return { moveToCell, startEditingFocused };
};

export default useTableKeyboard;
