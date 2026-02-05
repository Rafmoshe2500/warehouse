import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Hook for managing column resizing
 * Allows dragging column borders to resize and saves to localStorage
 */
export const useColumnResize = (columns, storageKey = 'inventory-column-widths') => {
    // Load saved widths from localStorage
    const getSavedWidths = () => {
        try {
            const saved = localStorage.getItem(storageKey);
            return saved ? JSON.parse(saved) : {};
        } catch {
            return {};
        }
    };

    const [columnWidths, setColumnWidths] = useState(getSavedWidths);
    const [resizing, setResizing] = useState(null);
    const startX = useRef(0);
    const startWidth = useRef(0);

    // Save widths to localStorage
    useEffect(() => {
        if (Object.keys(columnWidths).length > 0) {
            localStorage.setItem(storageKey, JSON.stringify(columnWidths));
        }
    }, [columnWidths, storageKey]);

    // Get width for a column (returns string with px)
    const getColumnWidth = useCallback((columnKey) => {
        const saved = columnWidths[columnKey];
        if (saved) return `${saved}px`;

        // Default widths based on column type
        const defaults = {
            serial: 120,
            catalog_number: 120,
            manufacturer: 150,
            location: 140,
            current_stock: 90,
            reserved_stock: 90,
            warranty_expiry: 120,
            description: 250,
            purpose: 200,
            notes: 250
        };
        return `${defaults[columnKey] || 150}px`;
    }, [columnWidths]);

    // Start resizing
    const startResize = useCallback((e, columnKey) => {
        e.preventDefault();
        e.stopPropagation();

        setResizing(columnKey);
        startX.current = e.clientX;
        // getColumnWidth returns "120px" - parse out the number
        const widthStr = getColumnWidth(columnKey);
        startWidth.current = parseInt(widthStr, 10) || 120;

        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }, [getColumnWidth]);

    // Handle mouse move during resize
    useEffect(() => {
        if (!resizing) return;

        const handleMouseMove = (e) => {
            // RTL: dragging left increases width
            const diff = startX.current - e.clientX;
            const newWidth = Math.max(60, startWidth.current + diff);

            setColumnWidths(prev => ({
                ...prev,
                [resizing]: newWidth
            }));
        };

        const handleMouseUp = () => {
            setResizing(null);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [resizing]);

    // Reset single column width
    const resetColumnWidth = useCallback((columnKey) => {
        setColumnWidths(prev => {
            const { [columnKey]: removed, ...rest } = prev;
            return rest;
        });
    }, []);

    // Reset all column widths
    const resetAllWidths = useCallback(() => {
        setColumnWidths({});
        localStorage.removeItem(storageKey);
    }, [storageKey]);

    return {
        getColumnWidth,
        startResize,
        resetColumnWidth,
        resetAllWidths,
        isResizing: resizing !== null,
        resizingColumn: resizing
    };
};

export default useColumnResize;
