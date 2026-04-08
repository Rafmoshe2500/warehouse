import React from 'react';

/**
 * Realistic SVG icons for each BOM hardware category.
 * Each icon is a clean, professional SVG at the given size.
 */

const defaultSize = 28;

export const ServerStorageIcon = ({ size = defaultSize, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Rack chassis */}
    <rect x="3" y="4" width="26" height="24" rx="2" stroke={color} strokeWidth="1.5" fill="none"/>
    {/* Drive bays row 1 */}
    <rect x="6" y="7" width="5" height="3.5" rx="0.8" fill={color} opacity="0.7"/>
    <rect x="12" y="7" width="5" height="3.5" rx="0.8" fill={color} opacity="0.7"/>
    <rect x="18" y="7" width="5" height="3.5" rx="0.8" fill={color} opacity="0.7"/>
    {/* Drive bays row 2 */}
    <rect x="6" y="12" width="5" height="3.5" rx="0.8" fill={color} opacity="0.5"/>
    <rect x="12" y="12" width="5" height="3.5" rx="0.8" fill={color} opacity="0.5"/>
    <rect x="18" y="12" width="5" height="3.5" rx="0.8" fill={color} opacity="0.5"/>
    {/* Drive bays row 3 */}
    <rect x="6" y="17" width="5" height="3.5" rx="0.8" fill={color} opacity="0.3"/>
    <rect x="12" y="17" width="5" height="3.5" rx="0.8" fill={color} opacity="0.3"/>
    <rect x="18" y="17" width="5" height="3.5" rx="0.8" fill={color} opacity="0.3"/>
    {/* Status LEDs */}
    <circle cx="26" cy="8.5" r="1" fill="#22c55e"/>
    <circle cx="26" cy="13.5" r="1" fill="#22c55e"/>
    <circle cx="26" cy="18.5" r="1" fill="#f59e0b"/>
    {/* Front panel */}
    <rect x="3" y="23" width="26" height="3" rx="0" fill={color} opacity="0.15"/>
  </svg>
);

export const ServerIcon = ({ size = defaultSize, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* 1U body */}
    <rect x="3" y="11" width="26" height="10" rx="2" stroke={color} strokeWidth="1.5" fill="none"/>
    {/* Ventilation slots */}
    <line x1="6" y1="14" x2="14" y2="14" stroke={color} strokeWidth="1" opacity="0.6"/>
    <line x1="6" y1="16.5" x2="14" y2="16.5" stroke={color} strokeWidth="1" opacity="0.6"/>
    <line x1="6" y1="19" x2="14" y2="19" stroke={color} strokeWidth="1" opacity="0.6"/>
    {/* Power button */}
    <circle cx="23" cy="16" r="2.5" stroke={color} strokeWidth="1.2" fill="none"/>
    <line x1="23" y1="13.5" x2="23" y2="15.2" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
    {/* LEDs */}
    <circle cx="18" cy="15" r="0.8" fill="#22c55e"/>
    <circle cx="18" cy="17.5" r="0.8" fill="#3b82f6"/>
    {/* Rack ears */}
    <rect x="1" y="12" width="2" height="8" rx="1" fill={color} opacity="0.4"/>
    <rect x="29" y="12" width="2" height="8" rx="1" fill={color} opacity="0.4"/>
  </svg>
);

export const SwitchIcon = ({ size = defaultSize, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Chassis */}
    <rect x="2" y="10" width="28" height="12" rx="2" stroke={color} strokeWidth="1.5" fill="none"/>
    {/* Ports row 1 */}
    {[5,8,11,14,17,20,23].map((x, i) => (
      <rect key={i} x={x} y="13" width="2" height="2.5" rx="0.4" fill={color} opacity="0.7"/>
    ))}
    {/* Ports row 2 */}
    {[5,8,11,14,17,20,23].map((x, i) => (
      <rect key={i+7} x={x} y="16.5" width="2" height="2.5" rx="0.4" fill={color} opacity="0.7"/>
    ))}
    {/* Status LEDs */}
    <circle cx="28" cy="13" r="0.8" fill="#22c55e"/>
    <circle cx="28" cy="15.5" r="0.8" fill="#22c55e"/>
    <circle cx="28" cy="18" r="0.8" fill="#f59e0b"/>
    {/* Uplink port (larger) */}
    <rect x="26" y="20" width="3" height="1.5" rx="0.4" fill={color} opacity="0.5"/>
  </svg>
);

export const IOCardIcon = ({ size = defaultSize, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* PCIe card body */}
    <rect x="4" y="6" width="18" height="20" rx="1.5" stroke={color} strokeWidth="1.5" fill="none"/>
    {/* Gold finger contacts (PCIe edge) */}
    {[6,8,10,12,14,16,18].map((x, i) => (
      <rect key={i} x={x} y="23" width="1.2" height="3" rx="0.3" fill={color} opacity="0.7"/>
    ))}
    {/* Port bracket on right */}
    <rect x="22" y="8" width="6" height="16" rx="1" stroke={color} strokeWidth="1.2" fill="none"/>
    {/* SFP ports on bracket */}
    <rect x="23.5" y="10" width="3" height="3" rx="0.5" fill={color} opacity="0.6"/>
    <rect x="23.5" y="14.5" width="3" height="3" rx="0.5" fill={color} opacity="0.6"/>
    {/* Chip on card */}
    <rect x="8" y="10" width="8" height="7" rx="1" fill={color} opacity="0.2" stroke={color} strokeWidth="1"/>
    {/* Chip pins */}
    {[9,11,13].map((x, i) => (
      <line key={i} x1={x} y1="10" x2={x} y2="9" stroke={color} strokeWidth="0.8"/>
    ))}
  </svg>
);

export const DiskIcon = ({ size = defaultSize, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Drive body */}
    <rect x="4" y="7" width="24" height="18" rx="2" stroke={color} strokeWidth="1.5" fill="none"/>
    {/* Platter circle */}
    <circle cx="15" cy="16" r="7" stroke={color} strokeWidth="1.2" fill="none" opacity="0.7"/>
    <circle cx="15" cy="16" r="3.5" stroke={color} strokeWidth="1" fill="none" opacity="0.5"/>
    <circle cx="15" cy="16" r="1" fill={color} opacity="0.8"/>
    {/* Read arm */}
    <line x1="15" y1="16" x2="21" y2="10" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="21" cy="10" r="1.2" fill={color} opacity="0.7"/>
    {/* SATA connector */}
    <rect x="19" y="22" width="7" height="3" rx="0.5" fill={color} opacity="0.4"/>
    {/* Label area */}
    <rect x="4" y="7" width="24" height="4" rx="2" fill={color} opacity="0.1"/>
  </svg>
);

export const DiskShelfIcon = ({ size = defaultSize, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* 4U chassis */}
    <rect x="2" y="5" width="28" height="22" rx="2" stroke={color} strokeWidth="1.5" fill="none"/>
    {/* Drive slots row 1 */}
    {[4,7.5,11,14.5,18,21.5].map((x, i) => (
      <rect key={i} x={x} y="8" width="2.8" height="5" rx="0.5" fill={color} opacity="0.65"/>
    ))}
    {/* Drive slots row 2 */}
    {[4,7.5,11,14.5,18,21.5].map((x, i) => (
      <rect key={i+6} x={x} y="15" width="2.8" height="5" rx="0.5" fill={color} opacity="0.45"/>
    ))}
    {/* Right panel */}
    <rect x="25" y="6" width="3.5" height="20" rx="1" fill={color} opacity="0.12"/>
    {/* LEDs right panel */}
    <circle cx="26.5" cy="9" r="0.8" fill="#22c55e"/>
    <circle cx="26.5" cy="12" r="0.8" fill="#22c55e"/>
    <circle cx="26.5" cy="15" r="0.8" fill="#3b82f6"/>
    {/* SAS connectors bottom */}
    <rect x="4" y="22" width="4" height="2.5" rx="0.5" fill={color} opacity="0.5"/>
    <rect x="9" y="22" width="4" height="2.5" rx="0.5" fill={color} opacity="0.5"/>
  </svg>
);

export const CableIcon = ({ size = defaultSize, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* LC connector left */}
    <rect x="2" y="13" width="5" height="6" rx="1" stroke={color} strokeWidth="1.5" fill="none"/>
    <rect x="3.5" y="14.5" width="2" height="3" rx="0.5" fill={color} opacity="0.6"/>
    <line x1="4.5" y1="11" x2="4.5" y2="13" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    {/* Fiber body — sinusoidal curve */}
    <path d="M7 16 C10 10, 14 22, 18 16 C20 13, 22 16, 25 16" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round"/>
    {/* LC connector right */}
    <rect x="25" y="13" width="5" height="6" rx="1" stroke={color} strokeWidth="1.5" fill="none"/>
    <rect x="26.5" y="14.5" width="2" height="3" rx="0.5" fill={color} opacity="0.6"/>
    <line x1="27.5" y1="11" x2="27.5" y2="13" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export const SFPIcon = ({ size = defaultSize, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* QSFP module body */}
    <rect x="5" y="9" width="18" height="14" rx="2" stroke={color} strokeWidth="1.5" fill="none"/>
    {/* Gold contacts on left */}
    {[11,13.5,16,18.5].map((y, i) => (
      <rect key={i} x="3" y={y} width="2" height="1.5" rx="0.3" fill={color} opacity="0.7"/>
    ))}
    {/* Fiber port right side — 4 channels */}
    {[11,13.5,16,18.5].map((y, i) => (
      <circle key={i+4} cx="24" cy={y + 0.75} r="1" fill={color} opacity="0.65"/>
    ))}
    <rect x="23" y="10" width="4" height="12" rx="0" stroke={color} strokeWidth="1" fill="none" opacity="0.4"/>
    {/* Label / chip area */}
    <rect x="8" y="12" width="10" height="6" rx="1" fill={color} opacity="0.12"/>
    <text x="13" y="16.5" textAnchor="middle" fontSize="4" fill={color} opacity="0.7" fontFamily="monospace">QSFP</text>
    {/* Bail latch line */}
    <line x1="5" y1="23" x2="23" y2="23" stroke={color} strokeWidth="1" opacity="0.4"/>
    <rect x="9" y="22" width="8" height="4" rx="1" fill={color} opacity="0.2"/>
  </svg>
);

export const OtherIcon = ({ size = defaultSize, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="8" width="24" height="16" rx="2" stroke={color} strokeWidth="1.5" fill="none"/>
    <line x1="4" y1="14" x2="28" y2="14" stroke={color} strokeWidth="1" opacity="0.4"/>
    <line x1="14" y1="8" x2="14" y2="24" stroke={color} strokeWidth="1" opacity="0.4"/>
    <circle cx="9" cy="19" r="2" stroke={color} strokeWidth="1.2" fill="none" opacity="0.6"/>
    <rect x="17" y="17" width="8" height="4" rx="1" fill={color} opacity="0.3"/>
    <text x="16" y="12" textAnchor="middle" fontSize="5" fill={color} opacity="0.6" fontFamily="sans-serif">?</text>
  </svg>
);

// ── License Icon ──────────────────────────────────────────────────────────────
export const LicenseIcon = ({ size = defaultSize, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="4" width="24" height="24" rx="3" stroke={color} strokeWidth="1.5" fill="none"/>
    <path d="M10 12h12M10 16h8M10 20h6" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="24" cy="22" r="4" fill={color} opacity="0.2" stroke={color} strokeWidth="1.2"/>
    <path d="M22.5 22l1 1 2-2" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ── CPU / Processor Icon ──────────────────────────────────────────────────────
export const CpuIcon = ({ size = defaultSize, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="8" width="16" height="16" rx="2" stroke={color} strokeWidth="1.5" fill="none"/>
    <rect x="11" y="11" width="10" height="10" rx="1" fill={color} opacity="0.2"/>
    {/* Pins top */}
    {[11,14,17,20].map((x, i) => (
      <line key={`t${i}`} x1={x} y1="5" x2={x} y2="8" stroke={color} strokeWidth="1.2"/>
    ))}
    {/* Pins bottom */}
    {[11,14,17,20].map((x, i) => (
      <line key={`b${i}`} x1={x} y1="24" x2={x} y2="27" stroke={color} strokeWidth="1.2"/>
    ))}
    {/* Pins left */}
    {[11,14,17,20].map((y, i) => (
      <line key={`l${i}`} x1="5" y1={y} x2="8" y2={y} stroke={color} strokeWidth="1.2"/>
    ))}
    {/* Pins right */}
    {[11,14,17,20].map((y, i) => (
      <line key={`r${i}`} x1="24" y1={y} x2="27" y2={y} stroke={color} strokeWidth="1.2"/>
    ))}
  </svg>
);

// ── Memory / RAM Icon ─────────────────────────────────────────────────────────
export const MemoryIcon = ({ size = defaultSize, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="8" width="26" height="14" rx="1.5" stroke={color} strokeWidth="1.5" fill="none"/>
    {/* Chips */}
    {[5, 9, 13, 17, 21, 25].map((x, i) => (
      <rect key={i} x={x} y="10" width="2.5" height="8" rx="0.5" fill={color} opacity="0.5"/>
    ))}
    {/* Gold contacts */}
    {[5, 7.5, 10, 12.5, 15, 17.5, 20, 22.5, 25].map((x, i) => (
      <rect key={`c${i}`} x={x} y="22" width="1.5" height="3" rx="0.3" fill={color} opacity="0.7"/>
    ))}
    {/* Notch */}
    <rect x="15" y="22" width="2" height="1.5" fill="white"/>
  </svg>
);

// ── Fan / Heatsink Icon ───────────────────────────────────────────────────────
export const FanIcon = ({ size = defaultSize, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="4" width="24" height="24" rx="3" stroke={color} strokeWidth="1.5" fill="none"/>
    <circle cx="16" cy="16" r="9" stroke={color} strokeWidth="1.2" fill="none" opacity="0.5"/>
    <circle cx="16" cy="16" r="2" fill={color} opacity="0.6"/>
    {/* Fan blades */}
    <path d="M16 14c-1-4 2-7 4-6s0 5-1 7" fill={color} opacity="0.4"/>
    <path d="M18 16c4-1 7 2 6 4s-5 0-7-1" fill={color} opacity="0.4"/>
    <path d="M16 18c1 4-2 7-4 6s0-5 1-7" fill={color} opacity="0.4"/>
    <path d="M14 16c-4 1-7-2-6-4s5 0 7 1" fill={color} opacity="0.4"/>
  </svg>
);

// ── Power Supply Icon ─────────────────────────────────────────────────────────
export const PsuIcon = ({ size = defaultSize, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="8" width="26" height="16" rx="2" stroke={color} strokeWidth="1.5" fill="none"/>
    {/* Fan grille */}
    <circle cx="10" cy="16" r="5" stroke={color} strokeWidth="1" fill="none" opacity="0.5"/>
    <circle cx="10" cy="16" r="2.5" stroke={color} strokeWidth="0.8" fill="none" opacity="0.3"/>
    {/* Power socket */}
    <rect x="20" y="12" width="6" height="8" rx="1" stroke={color} strokeWidth="1.2" fill="none"/>
    <circle cx="22" cy="15" r="0.8" fill={color} opacity="0.6"/>
    <circle cx="25" cy="15" r="0.8" fill={color} opacity="0.6"/>
    <line x1="22" y1="18" x2="25" y2="18" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.6"/>
    {/* LED */}
    <circle cx="17" cy="11" r="0.8" fill="#22c55e"/>
  </svg>
);

// ── License Capacity Icon ─────────────────────────────────────────────────────
export const LicenseCapacityIcon = ({ size = defaultSize, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="4" width="24" height="24" rx="3" stroke={color} strokeWidth="1.5" fill="none"/>
    <path d="M10 12h12M10 16h8" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    {/* TB / capacity indicator */}
    <text x="16" y="24" textAnchor="middle" fontSize="6" fill={color} opacity="0.8" fontFamily="monospace" fontWeight="bold">TB</text>
  </svg>
);

// ── License Software Icon ─────────────────────────────────────────────────────
export const LicenseSoftwareIcon = ({ size = defaultSize, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="4" width="24" height="24" rx="3" stroke={color} strokeWidth="1.5" fill="none"/>
    <path d="M10 12h12M10 16h8" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    {/* Software/code icon */}
    <path d="M12 21l-3 2.5 3 2.5" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"/>
    <path d="M20 21l3 2.5-3 2.5" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"/>
  </svg>
);

// ── Support Icon ──────────────────────────────────────────────────────────────
export const SupportIcon = ({ size = defaultSize, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="12" stroke={color} strokeWidth="1.5" fill="none"/>
    <circle cx="16" cy="16" r="5" stroke={color} strokeWidth="1.3" fill="none"/>
    {/* Crosshair lines */}
    <line x1="16" y1="4" x2="16" y2="11" stroke={color} strokeWidth="1.3"/>
    <line x1="16" y1="21" x2="16" y2="28" stroke={color} strokeWidth="1.3"/>
    <line x1="4" y1="16" x2="11" y2="16" stroke={color} strokeWidth="1.3"/>
    <line x1="21" y1="16" x2="28" y2="16" stroke={color} strokeWidth="1.3"/>
    {/* Wrench hint */}
    <circle cx="16" cy="16" r="1.5" fill={color} opacity="0.5"/>
  </svg>
);

// ── Category Config ───────────────────────────────────────────────────────────

export const CATEGORY_CONFIG = {
  'server-storage': {
    label: 'שרת אחסון',
    Icon: ServerStorageIcon,
    color: '#6366f1',
    bg: 'rgba(99,102,241,0.12)',
  },
  'server': {
    label: 'שרת',
    Icon: ServerIcon,
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.12)',
  },
  'switch': {
    label: 'מתג',
    Icon: SwitchIcon,
    color: '#0ea5e9',
    bg: 'rgba(14,165,233,0.12)',
  },
  'io-card': {
    label: 'כרטיסיה',
    Icon: IOCardIcon,
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.12)',
  },
  'disk': {
    label: 'דיסק',
    Icon: DiskIcon,
    color: '#10b981',
    bg: 'rgba(16,185,129,0.12)',
  },
  'disk-shelf': {
    label: 'מדף דיסקים',
    Icon: DiskShelfIcon,
    color: '#14b8a6',
    bg: 'rgba(20,184,166,0.12)',
  },
  'cable': {
    label: 'כבל',
    Icon: CableIcon,
    color: '#f97316',
    bg: 'rgba(249,115,22,0.12)',
  },
  'sfp-qsfp': {
    label: "ג'יביק",
    Icon: SFPIcon,
    color: '#ec4899',
    bg: 'rgba(236,72,153,0.12)',
  },
  'cpu': {
    label: 'מעבד',
    Icon: CpuIcon,
    color: '#e11d48',
    bg: 'rgba(225,29,72,0.12)',
  },
  'memory': {
    label: 'זכרונות',
    Icon: MemoryIcon,
    color: '#7c3aed',
    bg: 'rgba(124,58,237,0.12)',
  },
  'fan': {
    label: 'מאוורר',
    Icon: FanIcon,
    color: '#06b6d4',
    bg: 'rgba(6,182,212,0.12)',
  },
  'psu': {
    label: 'ספק כח',
    Icon: PsuIcon,
    color: '#d97706',
    bg: 'rgba(217,119,6,0.12)',
  },
  'license-capacity': {
    label: 'רישוי נפח',
    Icon: LicenseCapacityIcon,
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.12)',
  },
  'license-software': {
    label: 'רישוי תוכנה',
    Icon: LicenseSoftwareIcon,
    color: '#818cf8',
    bg: 'rgba(129,140,248,0.12)',
  },
  'support': {
    label: 'תמיכה',
    Icon: SupportIcon,
    color: '#34d399',
    bg: 'rgba(52,211,153,0.12)',
  },
  'other': {
    label: 'אחר',
    Icon: OtherIcon,
    color: '#6b7280',
    bg: 'rgba(107,114,128,0.12)',
  },
};

/**
 * CategoryIcon: renders the icon for any category string.
 */
export const CategoryIcon = ({ category, size = defaultSize }) => {
  const cfg = CATEGORY_CONFIG[category] || CATEGORY_CONFIG['other'];
  return <cfg.Icon size={size} color={cfg.color} />;
};
