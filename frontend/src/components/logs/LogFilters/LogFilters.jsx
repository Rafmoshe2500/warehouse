import React, { useState } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import Input from '../../common/Input/Input';
import Button from '../../common/Button/Button';
import { ACTION_LABELS } from '../../../utils/constants';
import './LogFilters.css';

const LogFilters = ({ onFilter, onClear }) => {
  const [filters, setFilters] = useState({
    action: '',
    search: '',
  });

  const handleChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleFilter = () => {
    onFilter(filters);
  };

  const handleClear = () => {
    setFilters({ action: '', search: '' });
    onClear();
  };

  return (
    <div className="log-filters">
      <div className="log-filters__field">
        <label>סוג פעולה:</label>
        <select
          value={filters.action}
          onChange={(e) => handleChange('action', e.target.value)}
          className="log-filters__select"
        >
          <option value="">הכל</option>
          {Object.entries(ACTION_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <Input
        placeholder="חיפוש חופשי: סריאלי, מק״ט, תיאור או משתמש"
        value={filters.search}
        onChange={(e) => handleChange('search', e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
      />

      <div className="log-filters__actions">
        <Button variant="primary" icon={<FiSearch />} onClick={handleFilter}>
          סנן
        </Button>
        <Button variant="secondary" icon={<FiX />} onClick={handleClear}>
          נקה
        </Button>
      </div>
    </div>
  );
};

export default LogFilters;
