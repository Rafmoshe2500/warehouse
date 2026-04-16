import React from 'react';

/**
 * 890Warehouse Logo — SVG-based, themeable.
 * Variants: 'full' (icon + text), 'icon' (icon only).
 */
const Logo = ({ variant = 'full', size = 32, className = '' }) => {
  const iconSize = size;

  const Icon = () => (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="logo-icon-svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      {/* Warehouse box base */}
      <rect x="6" y="18" width="36" height="26" rx="3" fill="url(#logoGrad)" opacity="0.9" />
      {/* Roof */}
      <path d="M4 20L24 6L44 20" stroke="url(#logoGrad)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Door / opening */}
      <rect x="18" y="28" width="12" height="16" rx="2" fill="rgba(255,255,255,0.25)" />
      {/* Shelves inside */}
      <line x1="19" y1="34" x2="29" y2="34" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
      <line x1="19" y1="38" x2="29" y2="38" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
      {/* 890 text small at top */}
      <text x="24" y="15" textAnchor="middle" fill="white" fontSize="8" fontWeight="800" fontFamily="system-ui, sans-serif">890</text>
    </svg>
  );

  if (variant === 'icon') {
    return (
      <span className={`logo logo--icon ${className}`.trim()} data-testid="logo">
        <Icon />
      </span>
    );
  }

  return (
    <span className={`logo logo--full ${className}`.trim()} data-testid="logo">
      <Icon />
      <span className="logo__text">
        <span className="logo__brand">890</span>
        <span className="logo__name">Warehouse</span>
      </span>
    </span>
  );
};

export default Logo;
