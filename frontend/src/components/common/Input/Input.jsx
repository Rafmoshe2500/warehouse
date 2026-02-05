import React from 'react';
import './Input.css';

const Input = ({
  label,
  value,
  onChange,
  placeholder,
  // Config grouped props
  config = {},
  state = {},
  validation = {},
  className = '',
  // Legacy support - flat props
  type,
  error,
  disabled,
  required,
  multiline,
  rows,
  ...props
}) => {
  // Support both grouped and flat props (for backward compatibility)
  const finalConfig = type !== undefined || multiline !== undefined ? 
    { type: type || 'text', multiline: multiline || false, rows: rows || 3 } : 
    { type: 'text', multiline: false, rows: 3, ...config };

  const finalState = error !== undefined || disabled !== undefined ? 
    { error, disabled: disabled || false } : 
    { error: null, disabled: false, ...state };

  const finalValidation = required !== undefined ? 
    { required } : 
    { required: false, ...validation };

  const { type: inputType, multiline: isMultiline, rows: inputRows } = finalConfig;
  const { error: inputError, disabled: isDisabled } = finalState;
  const { required: isRequired } = finalValidation;

  const inputClass = [
    'input',
    inputError && 'input--error',
    isDisabled && 'input--disabled',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="input-wrapper">
      {label && (
        <label className="input-label">
          {label}
          {isRequired && <span className="input-required">*</span>}
        </label>
      )}
      {isMultiline ? (
        <textarea
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={isDisabled}
          className={inputClass}
          rows={inputRows}
          {...props}
        />
      ) : (
        <input
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={isDisabled}
          className={inputClass}
          {...props}
        />
      )}
      {inputError && <span className="input-error-message">{inputError}</span>}
    </div>
  );
};

export default Input;
