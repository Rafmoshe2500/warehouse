import { useState, useCallback } from 'react';

export const useCellEditing = ({ onEdit, executeEdit, immutableFields = [] }) => {
    const [editingCell, setEditingCell] = useState(null);
    const [editValue, setEditValue] = useState('');

    const startEdit = useCallback((itemId, field, currentValue) => {
        if (immutableFields.includes(field)) return;
        const safeValue = currentValue || '';
        setEditingCell({ itemId, field, originalValue: safeValue });
        setEditValue(safeValue);
    }, [immutableFields]);

    const saveEdit = useCallback(async () => {
        if (!editingCell) return;
        const { itemId, field, originalValue } = editingCell;
        if (editValue !== undefined && editValue !== null && String(editValue).trim() !== String(originalValue).trim()) {
            if (executeEdit) {
                await executeEdit(itemId, field, editValue, originalValue);
            } else if (onEdit) {
                await onEdit(itemId, field, editValue);
            }
        }
        setEditingCell(null);
    }, [editingCell, editValue, executeEdit, onEdit]);

    const cancelEdit = useCallback(() => {
        setEditingCell(null);
        setEditValue('');
    }, []);

    const updateEditValue = useCallback((value) => {
        setEditValue(value);
    }, []);

    const isEditing = useCallback((itemId, field) => {
        return editingCell?.itemId === itemId && editingCell?.field === field;
    }, [editingCell]);

    return {
        editingCell,
        editValue,
        startEdit,
        saveEdit,
        cancelEdit,
        updateEditValue,
        isEditing
    };
};

export default useCellEditing;
