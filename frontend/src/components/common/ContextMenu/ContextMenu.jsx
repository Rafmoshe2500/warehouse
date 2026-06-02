import React from 'react';
import { FiCopy, FiEdit, FiTrash2, FiShoppingCart } from 'react-icons/fi';
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
    onClose,
    onAddToCollection,
    userCollections,
    onAddToCart,
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
                data-testid="context-menu-copy"
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
                data-testid="context-menu-edit"
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
                data-testid="context-menu-delete"
            >
                <FiTrash2 size={14} />
                מחיקה ({selectedItemsCount})
            </button>
            
            {/* Add to Cart */}
            {onAddToCart && (
                <button
                    className="context-menu__item context-menu__item--cart"
                    onClick={() => { onAddToCart(); onClose(); }}
                    disabled={selectedItemsCount === 0}
                    data-testid="context-menu-add-to-cart"
                >
                    <FiShoppingCart size={14} />
                    הוסף לעגלה ({selectedItemsCount})
                </button>
            )}

            {/* Custom Submenus */}
            {onAddToCollection && (
                 <div className="context-menu__submenu-container">
                    <button
                        className="context-menu__item context-menu__submenu-trigger"
                        disabled={selectedItemsCount === 0}
                    >
                         <span style={{display:'flex', alignItems:'center', gap: '8px'}}>
                            <FiCopy size={14} /> {/* Icon reuse or new one */}
                            שייך למלאי שלי
                         </span>
                    </button>
                    <div className="context-menu__submenu">
                        {userCollections && userCollections.length > 0 ? (
                            userCollections.map(col => (
                                <div 
                                    key={col.id} 
                                    className="submenu-item"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (onAddToCollection) onAddToCollection(col);
                                        onClose();
                                    }}
                                >
                                    {col.name}
                                </div>
                            ))
                        ) : (
                             <div className="submenu-item" style={{cursor: 'default', opacity: 0.7}}>
                                אין אוספים זמינים
                            </div>
                        )}
                    </div>
                 </div>
            )}

        </div>
    );
};

export default ContextMenu;
