import React from 'react';
import { FiCheck, FiX } from 'react-icons/fi';
import { TARGET_SITES } from '../../../constants/sites';
import { formatDate } from '../../../utils/formatters';
import './TableCell.css';

/**
 * Editable table cell component
 */
const TableCell = ({
    item,
    field,
    value,
    isEditing,
    editValue,
    isImmutable,
    isFocused,
    isMultiSelected,
    onEditValueChange,
    onSaveEdit,
    onCancelEdit,
    onDoubleClick,
    onCellClick,
    onMouseDown,
    onMouseEnter,
    type
}) => {

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') onSaveEdit();
        if (e.key === 'Escape') onCancelEdit();
    };

    if (isEditing) {
        if (field === 'target_site') {
            return (
                <div className="item-table__edit-container">
                    <select
                        className="item-table__edit-input"
                        value={editValue}
                        onChange={(e) => onEditValueChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={onSaveEdit}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                    >
                         <option value="">בחר אתר...</option>
                        {TARGET_SITES.map(site => (
                            <option key={site} value={site}>{site}</option>
                        ))}
                    </select>
                </div>
            );
        }

        return (
            <div className="item-table__edit-container">
                <input
                    className="item-table__edit-input"
                    value={editValue}
                    onChange={(e) => onEditValueChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={onSaveEdit}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                />
                <div className="item-table__edit-actions">
                    <button
                        className="item-table__edit-btn save"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={onSaveEdit}
                    >
                        <FiCheck />
                    </button>
                    <button
                        className="item-table__edit-btn cancel"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={onCancelEdit}
                    >
                        <FiX />
                    </button>
                </div>
            </div>
        );
    }

    const cellClasses = [
        isImmutable ? 'item-table__cell--immutable' : 'item-table__cell--editable',
        isFocused ? 'item-table__cell--focused' : '',
        isMultiSelected ? 'item-table__cell--multi-selected' : ''
    ].filter(Boolean).join(' ');

    const renderValue = () => {
        if (field === 'project_allocations') {
            if (!value || typeof value !== 'object' || Object.keys(value).length === 0) return '-';
            
            const entries = Object.entries(value);
            const displayEntries = entries.slice(0, 3);
            const remainder = entries.length - 3;

            return (
                <div className="table-tags-cell">
                    {displayEntries.map(([proj, qty], idx) => (
                        <span key={idx} className="table-tag">
                            שריון: {proj} | כמות: {qty}
                        </span>
                    ))}
                    {remainder > 0 && <span className="table-tag-more">+{remainder}</span>}
                </div>
            );
        }
        if (type === 'date' && value) {
             return formatDate(value);
        }
        return value || '-';
    };

    return (
        <div
            className={cellClasses}
            onDoubleClick={() => onDoubleClick(item, field, value)}
            onClick={() => onCellClick({ itemId: item._id, field })}
            onMouseDown={(e) => onMouseDown(e, item, field, value)}
            onMouseEnter={(e) => onMouseEnter(e, item, field, value)}
            title={isImmutable ? 'לחץ פעמיים להעתקה' : 'לחץ פעמיים לעריכה, Ctrl+Click לסימון'}
        >
            {renderValue()}
        </div>
    );
};

export default TableCell;
