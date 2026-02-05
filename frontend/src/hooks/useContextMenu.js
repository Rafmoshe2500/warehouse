import { useState, useCallback } from 'react';

export const useContextMenu = () => {
    const [contextMenu, setContextMenu] = useState(null);

    const openContextMenu = useCallback((x, y) => {
        setContextMenu({ x, y });
    }, []);

    const closeContextMenu = useCallback(() => {
        setContextMenu(null);
    }, []);

    const handleContextMenu = useCallback((e, hasSelection) => {
        e.preventDefault();
        if (contextMenu) {
            setContextMenu(null);
            return;
        }
        // if (!hasSelection) return; (removed to allow opening without selection)
        setContextMenu({ x: e.clientX, y: e.clientY });
    }, [contextMenu]);

    const handleAction = useCallback((action, callbacks) => {
        if (action === 'edit' && callbacks.onEdit) callbacks.onEdit();
        else if (action === 'delete' && callbacks.onDelete) callbacks.onDelete();
        else if (action === 'copy' && callbacks.onCopy) callbacks.onCopy();
        setContextMenu(null);
    }, []);

    return {
        contextMenu,
        isOpen: contextMenu !== null,
        openContextMenu,
        closeContextMenu,
        handleContextMenu,
        handleAction
    };
};

export default useContextMenu;
