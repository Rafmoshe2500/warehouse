import React from 'react';
import { FiX } from 'react-icons/fi';
import './ActiveFiltersBar.css';

const FILTER_LABELS = {
  catalog_number: 'מק"ט',
  description: 'תיאור',
  manufacturer: 'יצרן',
  model: 'מודל',
  location: 'מיקום',
  project: 'פרויקט',
  target_site: 'אתר יעד',
  serial_number: 'מספר סריאלי',
  notes: 'הערות',
  stock: 'כמות',
  owner: 'בעלים',
  warranty_expiry: 'אחריות',
};

const ActiveFiltersBar = ({ filters = {}, searchQuery = '', onRemoveFilter, onClearAll, onClearSearch }) => {
  const activeFilters = Object.entries(filters).filter(
    ([, value]) => value !== undefined && value !== null && value !== ''
  );

  const hasActiveFilters = activeFilters.length > 0 || searchQuery;

  if (!hasActiveFilters) return null;

  return (
    <div className="active-filters-bar">
      <div className="active-filters-bar__chips">
        {searchQuery && (
          <div className="active-filters-bar__chip active-filters-bar__chip--search">
            <span className="active-filters-bar__chip-label">חיפוש:</span>
            <span className="active-filters-bar__chip-value">{searchQuery}</span>
            <button
              className="active-filters-bar__chip-remove"
              onClick={onClearSearch}
              aria-label="הסר חיפוש"
            >
              <FiX size={12} />
            </button>
          </div>
        )}

        {activeFilters.map(([key, value]) => (
          <div key={key} className="active-filters-bar__chip">
            <span className="active-filters-bar__chip-label">
              {FILTER_LABELS[key] || key}:
            </span>
            <span className="active-filters-bar__chip-value">{value}</span>
            <button
              className="active-filters-bar__chip-remove"
              onClick={() => onRemoveFilter(key)}
              aria-label={`הסר סינון ${FILTER_LABELS[key] || key}`}
            >
              <FiX size={12} />
            </button>
          </div>
        ))}
      </div>

      <button className="active-filters-bar__clear-all" onClick={onClearAll}>
        נקה הכל
      </button>
    </div>
  );
};

export default ActiveFiltersBar;
