import { useState, useCallback, useEffect } from 'react';

/**
 * Action types for undo/redo
 */
export const ACTION_TYPES = {
    EDIT: 'edit',
    DELETE: 'delete',
    BULK_DELETE: 'bulk_delete'
};

/**
 * Hook for managing undo/redo functionality
 * Supports both cell edits and delete operations
 * 
 * @param {Object} callbacks - Callback functions for different operations
 * @param {Function} callbacks.onEdit - Callback for edit operations
 * @param {Function} callbacks.onRestoreItems - Callback to restore deleted items
 * @param {Function} callbacks.onCreateUndoLog - Optional callback to create UNDO log
 * @param {number} maxEditHistory - Maximum edit history size (default: 20)
 * @param {number} maxDeleteHistory - Maximum delete history size (default: 10)
 */
export const useUndoRedo = (callbacks, maxEditHistory = 20, maxDeleteHistory = 10) => {
    const { onEdit, onRestoreItems, onCreateUndoLog } = callbacks;

    const [editHistory, setEditHistory] = useState([]);
    const [editRedoStack, setEditRedoStack] = useState([]);
    const [deleteHistory, setDeleteHistory] = useState([]);
    const [deleteRedoStack, setDeleteRedoStack] = useState([]);

    // Execute a cell edit and save to history
    const executeEdit = useCallback(async (itemId, field, newValue, previousValue) => {
        const action = {
            type: ACTION_TYPES.EDIT,
            itemId,
            field,
            newValue,
            previousValue,
            timestamp: Date.now()
        };

        setEditHistory(prev => {
            const newHistory = [...prev, action];
            return newHistory.slice(-maxEditHistory);
        });

        setEditRedoStack([]);
        await onEdit(itemId, field, newValue);
    }, [onEdit, maxEditHistory]);

    // Record a delete action (items should be saved before actual deletion)
    const recordDelete = useCallback((deletedItems, isBulk = false) => {
        const action = {
            type: isBulk ? ACTION_TYPES.BULK_DELETE : ACTION_TYPES.DELETE,
            deletedItems: Array.isArray(deletedItems) ? deletedItems : [deletedItems],
            timestamp: Date.now()
        };

        setDeleteHistory(prev => {
            const newHistory = [...prev, action];
            return newHistory.slice(-maxDeleteHistory);
        });

        setDeleteRedoStack([]);
    }, [maxDeleteHistory]);

    // Undo the last edit action
    const undoEdit = useCallback(async () => {
        if (editHistory.length === 0) return false;

        const lastAction = editHistory[editHistory.length - 1];
        setEditHistory(prev => prev.slice(0, -1));
        setEditRedoStack(prev => [...prev, lastAction]);

        // Pass isUndo=true to prevent duplicate logging
        await onEdit(lastAction.itemId, lastAction.field, lastAction.previousValue, true);
        
        // Create UNDO log if callback provided
        if (onCreateUndoLog) {
            try {
                await onCreateUndoLog('edit', {
                    field: lastAction.field,
                    from: lastAction.newValue,
                    to: lastAction.previousValue
                });
            } catch (err) {
                console.error('Failed to create undo log:', err);
            }
        }
        
        return true;
    }, [editHistory, onEdit, onCreateUndoLog]);

    // Redo the last undone edit action
    const redoEdit = useCallback(async () => {
        if (editRedoStack.length === 0) return false;

        const lastUndo = editRedoStack[editRedoStack.length - 1];
        setEditRedoStack(prev => prev.slice(0, -1));
        setEditHistory(prev => [...prev, lastUndo]);

        await onEdit(lastUndo.itemId, lastUndo.field, lastUndo.newValue);
        return true;
    }, [editRedoStack, onEdit]);

    // Undo the last delete action (restore items)
    const undoDelete = useCallback(async () => {
        if (deleteHistory.length === 0 || !onRestoreItems) return false;

        const lastAction = deleteHistory[deleteHistory.length - 1];
        setDeleteHistory(prev => prev.slice(0, -1));
        setDeleteRedoStack(prev => [...prev, lastAction]);

        await onRestoreItems(lastAction.deletedItems);
        
        // Create UNDO log if callback provided
        if (onCreateUndoLog) {
            try {
                const count = lastAction.deletedItems.length;
                await onCreateUndoLog('delete', {
                    count,
                    isBulk: lastAction.type === ACTION_TYPES.BULK_DELETE
                });
            } catch (err) {
                console.error('Failed to create undo log:', err);
            }
        }
        
        return true;
    }, [deleteHistory, onRestoreItems, onCreateUndoLog]);

    // Redo the last undone delete action
    // Note: This would re-delete items, but we don't implement this 
    // as it's complex and less commonly needed
    const redoDelete = useCallback(async () => {
        // For now, we don't support redo for deletes
        // as it would require re-running the delete logic
        return false;
    }, []);

    // Combined undo - tries edit first, then delete
    const undo = useCallback(async () => {
        // Prioritize edits (more recent actions)
        const lastEditTime = editHistory.length > 0
            ? editHistory[editHistory.length - 1].timestamp
            : 0;
        const lastDeleteTime = deleteHistory.length > 0
            ? deleteHistory[deleteHistory.length - 1].timestamp
            : 0;

        if (lastEditTime >= lastDeleteTime && editHistory.length > 0) {
            return await undoEdit();
        } else if (deleteHistory.length > 0) {
            return await undoDelete();
        }
        return false;
    }, [editHistory, deleteHistory, undoEdit, undoDelete]);

    // Combined redo
    const redo = useCallback(async () => {
        if (editRedoStack.length > 0) {
            return await redoEdit();
        }
        return false;
    }, [editRedoStack, redoEdit]);

    return {
        executeEdit,
        undoEdit,
        redoEdit,
        canUndoEdit: editHistory.length > 0,
        canRedoEdit: editRedoStack.length > 0,
        editHistoryLength: editHistory.length,
        recordDelete,
        undoDelete,
        canUndoDelete: deleteHistory.length > 0,
        deleteHistoryLength: deleteHistory.length,
        undo,
        redo,
        canUndo: editHistory.length > 0 || deleteHistory.length > 0,
        canRedo: editRedoStack.length > 0
    };
};

export default useUndoRedo;
