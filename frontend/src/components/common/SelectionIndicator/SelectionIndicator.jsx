import React from 'react';
import './SelectionIndicator.css';

/**
 * Selection indicator showing number of selected cells
 */
const SelectionIndicator = ({ count }) => {
    if (count === 0) return null;

    return (
        <div className="selection-indicator">
            {count} תאים נבחרו (Ctrl+C להעתקה)
        </div>
    );
};

export default SelectionIndicator;
