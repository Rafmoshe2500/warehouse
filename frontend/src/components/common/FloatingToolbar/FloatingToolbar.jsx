import React from 'react';
import { FiRotateCcw, FiRotateCw } from 'react-icons/fi';
import './FloatingToolbar.css';

/**
 * Floating toolbar with undo/redo buttons
 */
const FloatingToolbar = ({
    canUndo,
    canRedo,
    onUndo,
    onRedo
}) => {
    if (!canUndo && !canRedo) return null;

    return (
        <div className="floating-toolbar">
            <button
                className="toolbar-btn"
                onClick={onUndo}
                disabled={!canUndo}
                title="ביטול (Ctrl+Z)"
            >
                <FiRotateCcw />
            </button>
            <button
                className="toolbar-btn"
                onClick={onRedo}
                disabled={!canRedo}
                title="חזרה (Ctrl+Y)"
            >
                <FiRotateCw />
            </button>
        </div>
    );
};

export default FloatingToolbar;
