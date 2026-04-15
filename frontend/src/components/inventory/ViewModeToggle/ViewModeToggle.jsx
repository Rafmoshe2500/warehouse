import React from 'react';
import { FiList, FiGrid, FiAlignJustify } from 'react-icons/fi';
import './ViewModeToggle.css';

const modes = [
  { key: 'compact', icon: FiAlignJustify, title: 'תצוגה צפופה' },
  { key: 'normal', icon: FiList, title: 'תצוגה רגילה' },
  { key: 'card', icon: FiGrid, title: 'תצוגת כרטיסים' }
];

const ViewModeToggle = ({ viewMode, onChange }) => {
  return (
    <div className="view-mode-toggle" role="group" aria-label="מצב תצוגה">
      {modes.map(({ key, icon: Icon, title }) => (
        <button
          key={key}
          className={`view-mode-toggle__btn ${viewMode === key ? 'view-mode-toggle__btn--active' : ''}`}
          onClick={() => onChange(key)}
          title={title}
          aria-pressed={viewMode === key}
        >
          <Icon size={14} />
        </button>
      ))}
    </div>
  );
};

export default ViewModeToggle;
