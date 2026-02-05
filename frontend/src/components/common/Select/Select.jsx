import React from 'react';
import './Select.css';

const Select = ({
  label,
  value,
  onChange,
  options = [],
  placeholder = 'בחר אפשרות...',
  error,
  disabled = false,
  required = false,
  className = '',
  ...props
}) => {
  const selectClass = [
    'select-input',
    error && 'select--error',
    disabled && 'select--disabled',
    value === '' && 'select--placeholder',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="select-wrapper">
      {label && (
        <label className="select-label">
          {label}
          {required && <span className="select-required">*</span>}
        </label>
      )}
      <div className="select-container">
        <select
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={selectClass}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="select-arrow">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
        </div>
      </div>
      {error && <span className="select-error-message">{error}</span>}
    </div>
  );
};

export default Select;
