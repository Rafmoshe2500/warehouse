import React from 'react';
import { FiCopy, FiEdit, FiTrash2 } from 'react-icons/fi';
import './ContextMenu.css';

/**
 * Context menu component for table actions
 */
const ContextMenu = ({
    position,
    selectedItemsCount = 0,
    selectedCellsCount = 0,
    onEdit,
    onDelete,
    onCopy,
    onClose
}) => {
    if (!position) return null;

    return (
        <div
            className="context-menu"
            style={{
                position: 'fixed',
                top: position.y,
                left: position.x,
                zIndex: 1000,
            }}
        >
            <button
                className="context-menu__item context-menu__item--copy"
                onClick={() => {
                    onCopy();
                    onClose();
                }}
                disabled={selectedCellsCount === 0}
            >
                <FiCopy size={14} />
                העתק תאים ({selectedCellsCount})
            </button>
            <button
                className="context-menu__item context-menu__item--edit"
                onClick={() => {
                    onEdit();
                    onClose();
                }}
                disabled={selectedItemsCount === 0}
            >
                <FiEdit size={14} />
                עריכה ({selectedItemsCount})
            </button>
            <button
                className="context-menu__item context-menu__item--delete"
                onClick={() => {
                    onDelete();
                    onClose();
                }}
                disabled={selectedItemsCount === 0}
            >
                <FiTrash2 size={14} />
                מחיקה ({selectedItemsCount})
            </button>
        </div>
    );
};

export default ContextMenu;
