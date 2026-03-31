import React from 'react';
import './OrderTypeModal.css';

const ORDER_TYPES = [
  {
    id: 'bom',
    icon: '📊',
    title: 'רכש מ-BOM',
    subtitle: 'העלה קובץ BOM של יצרן',
    description: 'הסריקה תמלא אוטומטית את המחיר, המק"טים והרכיבים',
    vendors: ['🟠 NetApp', '🔵 Dell', '🟢 HPE'],
    color: '#6366f1',
    glow: 'rgba(99,102,241,0.25)',
  },
  {
    id: 'manual',
    icon: '✏️',
    title: 'רכש ידני',
    subtitle: 'הזנת פרטים ידנית',
    description: 'הכנס מק"טים, יצרנים וסכום ידנית ללא קובץ BOM',
    vendors: [],
    color: '#f59e0b',
    glow: 'rgba(245,158,11,0.2)',
  },
];

const OrderTypeModal = ({ isOpen, onClose, onSelect }) => {
  if (!isOpen) return null;

  return (
    <div className="order-type-overlay" onClick={onClose}>
      <div className="order-type-modal" onClick={e => e.stopPropagation()}>
        <div className="otm-header">
          <h2 className="otm-title">הזמנה חדשה</h2>
          <p className="otm-subtitle">בחר את סוג ההזמנה</p>
          <button className="otm-close" onClick={onClose}>✕</button>
        </div>

        <div className="otm-grid">
          {ORDER_TYPES.map(type => (
            <button
              key={type.id}
              className="otm-card"
              style={{ '--card-color': type.color, '--card-glow': type.glow }}
              onClick={() => onSelect(type.id)}
            >
              <div className="otm-card-icon">{type.icon}</div>
              <div className="otm-card-title">{type.title}</div>
              <div className="otm-card-subtitle">{type.subtitle}</div>
              <div className="otm-card-desc">{type.description}</div>
              {type.vendors.length > 0 && (
                <div className="otm-vendors">
                  {type.vendors.map(v => (
                    <span key={v} className="otm-vendor-badge">{v}</span>
                  ))}
                </div>
              )}
              <div className="otm-card-cta">בחר ←</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrderTypeModal;
