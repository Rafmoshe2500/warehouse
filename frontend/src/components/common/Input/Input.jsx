import React from 'react';
import './Input.css';

const Input = ({
  label,
  value,
  onChange,
  placeholder,
  icon,
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
    inputError && 'input-error',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="input-wrapper">
      <fieldset className={`input-fieldset ${inputError ? 'input-error' : ''}`}>
        {label && (
          <legend className="input-legend">
            {label}
            {isRequired && <span className="input-required">*</span>}
          </legend>
        )}
        <div className={`input-inner${icon ? ' input-has-icon' : ''}`}>
          {icon && <span className="input-icon">{icon}</span>}
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
              required={isRequired}
              className={inputClass}
              {...props}
            />
          )}
        </div>
      </fieldset>
      {inputError && <span className="input-error-message">{inputError}</span>}
    </div>
  );
};

export default Input;
