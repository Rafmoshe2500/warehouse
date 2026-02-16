import React from 'react';
import Spinner from '../Spinner/Spinner';
import './Button.css';

const Button = ({
  children,
  onClick,
  variant = 'primary',
  icon,
  disabled = false,
  loading = false,
  isLoading, // Filter out from spread props to avoid React warning
  type = 'button',
  className = '',
  ...props
}) => {
  // Support both prop names but prefer 'loading'
  const isButtonLoading = loading || isLoading;

  return (
    <button
      type={type}
      className={`button button--${variant} ${className} ${isButtonLoading ? 'button--loading' : ''}`}
      onClick={onClick}
      disabled={disabled || isButtonLoading}
      {...props}
    >
      {isButtonLoading ? (
        <Spinner inline size="small" />
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
