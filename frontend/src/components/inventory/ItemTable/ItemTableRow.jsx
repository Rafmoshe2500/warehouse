import React, { memo } from 'react';
import PropTypes from 'prop-types';

const ItemTableRow = ({
    item,
    isSelected,
    onSelect,
    onRowClick,
    frozenColumns,
    scrollableColumns,
    renderCell
}) => {
    
    const handleCheckboxChange = (e) => {
        // Stop propagation is handled by onClick usually for checkboxes but safer here too
        // Actually onChange is enough if we just call onSelect
        onSelect(item._id);
    };

    const handleCheckboxClick = (e) => {
        e.stopPropagation();
    };

    return (
        <tr
            className={isSelected ? 'row-selected' : ''}
            onClick={(e) => onRowClick(item, e)}
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
        </tr>
    );
};

ItemTableRow.propTypes = {
    item: PropTypes.object.isRequired,
    isSelected: PropTypes.bool.isRequired,
    onSelect: PropTypes.func.isRequired,
    onRowClick: PropTypes.func.isRequired,
    frozenColumns: PropTypes.array.isRequired,
    scrollableColumns: PropTypes.array.isRequired,
    renderCell: PropTypes.func.isRequired
};

export default memo(ItemTableRow);
