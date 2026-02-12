import React from 'react';
import './Button.css';

const Button = ({
  children,
  onClick,
  variant = 'primary',
  icon,
  disabled = false,
  loading = false,
  type = 'button',
  className = '',
  ...props
}) => {
  return (
    <button
      type={type}
      className={`button button--${variant} ${className} ${loading ? 'button--loading' : ''}`}
      onClick={onClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="button__loading-text">טוען...</span>
      ) : (
        <>
          {icon && <span className="button__icon">{icon}</span>}
          <span className="button__text">{children}</span>
        </>
      )}
    </button>
  );
};

export default Button;
