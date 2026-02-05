import React from 'react';
import './Button.css';

const Button = ({
  children,
  onClick,
  variant = 'primary',
  icon,
  disabled = false,
  type = 'button',
  className = '',
}) => {
  return (
    <button
      type={type}
      className={`button button--${variant} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <span className="button__icon">{icon}</span>}
      <span className="button__text">{children}</span>
    </button>
  );
};

export default Button;
