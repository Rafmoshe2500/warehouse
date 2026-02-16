import React, { useState, useRef, useEffect } from 'react';
import { FiColumns, FiCheck } from 'react-icons/fi';
import Button from '../../common/Button/Button';
import './ColumnToggle.css';

const ColumnToggle = ({ allColumns, visibleColumns, onToggle }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="column-toggle-container" ref={menuRef}>
      <Button
        variant={isOpen ? 'primary' : 'secondary'}
        onClick={() => setIsOpen(!isOpen)}
        className="btn-icon"
        title="בחירת עמודות"
      >
        <FiColumns /> עמודות
      </Button>

      {isOpen && (
        <div className="column-toggle-menu fade-in">
          <div className="column-toggle-header">
            <span>הצג עמודות</span>
          </div>
          <div className="column-toggle-list">
            {allColumns.map((col) => (
              <div
                key={col.key}
                className={`column-toggle-item ${visibleColumns.includes(col.key) ? 'active' : ''}`}
                onClick={() => onToggle(col.key)}
              >
                <div className="checkbox-custom">
                  {visibleColumns.includes(col.key) && <FiCheck size={12} />}
                </div>
                <span>{col.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ColumnToggle;
