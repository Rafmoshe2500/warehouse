import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FiMoreVertical, FiEdit, FiCopy, FiTrash2, FiFolder } from 'react-icons/fi';
import './RowActionsMenu.css';

const RowActionsMenu = ({ item, onEdit, onDelete, onCopy, onAddToCollection, userCollections, canEdit }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
    const menuRef = useRef(null);
    const btnRef = useRef(null);

    const toggle = useCallback((e) => {
        e.stopPropagation();
        if (!isOpen && btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect();
            setDropdownPos({
                top: rect.bottom + 4,
                left: rect.left,
            });
        }
        setIsOpen(prev => !prev);
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target) &&
                btnRef.current && !btnRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        const handleScrollOrResize = () => setIsOpen(false);
        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', handleScrollOrResize, true);
        window.addEventListener('resize', handleScrollOrResize);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScrollOrResize, true);
            window.removeEventListener('resize', handleScrollOrResize);
        };
    }, [isOpen]);

    const handleAction = useCallback((action) => (e) => {
        e.stopPropagation();
        action();
        setIsOpen(false);
    }, []);

    const dropdown = (
        <div
            className="row-actions__dropdown"
            ref={menuRef}
            style={{ position: 'fixed', top: dropdownPos.top, left: dropdownPos.left, zIndex: 9999 }}
        >
            {canEdit && onEdit && (
                <button className="row-actions__item" onClick={handleAction(() => onEdit(item))}>
                    <FiEdit size={14} />
                    <span>עריכה</span>
                </button>
            )}
            <button className="row-actions__item" onClick={handleAction(() => onCopy(item))}>
                <FiCopy size={14} />
                <span>העתק מק״ט</span>
            </button>
            {onAddToCollection && (
                <div className="row-actions__submenu-container">
                    <button className="row-actions__item row-actions__submenu-trigger">
                        <FiFolder size={14} />
                        <span>שייך למלאי שלי</span>
                    </button>
                    <div className="row-actions__submenu">
                        {userCollections && userCollections.length > 0 ? (
                            userCollections.map(col => (
                                <button
                                    key={col.id}
                                    className="row-actions__item"
                                    onClick={handleAction(() => onAddToCollection(col, [item._id]))}
                                >
                                    {col.name}
                                </button>
                            ))
                        ) : (
                            <span className="row-actions__item row-actions__item--disabled">אין אוספים</span>
                        )}
                    </div>
                </div>
            )}
            {canEdit && onDelete && (
                <button className="row-actions__item row-actions__item--danger" onClick={handleAction(() => onDelete(item))}>
                    <FiTrash2 size={14} />
                    <span>מחיקה</span>
                </button>
            )}
        </div>
    );

    return (
        <div className="row-actions">
            <button
                ref={btnRef}
                className="row-actions__trigger"
                onClick={toggle}
                aria-label="פעולות שורה"
                aria-expanded={isOpen}
            >
                <FiMoreVertical size={16} />
            </button>
            {isOpen && createPortal(dropdown, document.body)}
        </div>
    );
};

export default RowActionsMenu;
