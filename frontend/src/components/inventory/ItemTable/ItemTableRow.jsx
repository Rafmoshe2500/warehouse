import React, { memo } from 'react';
import PropTypes from 'prop-types';

const getRowStatusClass = (item) => {
    if (!item.warranty_expiry && item.current_stock !== 0) return '';
    const classes = [];
    if (item.current_stock === 0) classes.push('row-low-stock');
    if (item.warranty_expiry) {
        const expiry = new Date(item.warranty_expiry);
        const now = new Date();
        if (expiry < now) {
            classes.push('row-warranty-expired');
        } else if (expiry - now < 30 * 24 * 60 * 60 * 1000) {
            classes.push('row-warranty-expiring');
        }
    }
    return classes.join(' ');
};

const ItemTableRow = ({
    item,
    isSelected,
    onSelect,
    onRowClick,
    onRowContextMenu,
    frozenColumns,
    scrollableColumns,
    renderCell,
    actionsCell
}) => {
    
    const handleCheckboxChange = (e) => {
        // Stop propagation is handled by onClick usually for checkboxes but safer here too
        // Actually onChange is enough if we just call onSelect
        onSelect(item._id);
    };

    const handleCheckboxClick = (e) => {
        e.stopPropagation();
    };

    const statusClass = getRowStatusClass(item);
    const rowClass = [isSelected ? 'row-selected' : '', statusClass].filter(Boolean).join(' ');

    return (
        <tr
            className={rowClass}
            onClick={(e) => onRowClick(item, e)}
            onContextMenu={(e) => {
                e.stopPropagation();
                if (onRowContextMenu) onRowContextMenu(item, e);
            }}
        >
            <td className="th-frozen">
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={handleCheckboxChange}
                    onClick={handleCheckboxClick}
                />
            </td>
            {frozenColumns.map((col) => (
                <td key={col.key} className={`col-${col.key} th-frozen`}>
                    {renderCell(item, col)}
                </td>
            ))}
            {scrollableColumns.map((col) => (
                <td key={col.key} className={`col-${col.key}`}>
                    {renderCell(item, col)}
                </td>
            ))}
            {actionsCell && (
                <td className="col-actions">{actionsCell}</td>
            )}
        </tr>
    );
};

ItemTableRow.propTypes = {
    item: PropTypes.object.isRequired,
    isSelected: PropTypes.bool.isRequired,
    onSelect: PropTypes.func.isRequired,
    onRowClick: PropTypes.func.isRequired,
    onRowContextMenu: PropTypes.func,
    frozenColumns: PropTypes.array.isRequired,
    scrollableColumns: PropTypes.array.isRequired,
    renderCell: PropTypes.func.isRequired,
    actionsCell: PropTypes.node
};

export default memo(ItemTableRow);
