import React, { useRef, useEffect, useCallback, useState } from 'react';
import { FiX, FiFolder, FiClock } from 'react-icons/fi';
import './DetailPanel.css';

const FIELD_CONFIG = [
  { key: 'catalog_number', label: 'מק"ט', primary: true },
  { key: 'serial', label: 'מספר סריאלי' },
  { key: 'description', label: 'תיאור', wide: true },
  { key: 'manufacturer', label: 'יצרן' },
  { key: 'location', label: 'מיקום' },
  { key: 'current_stock', label: 'כמות במלאי' },
  { key: 'warranty_expiry', label: 'תוקף אחריות', type: 'date' },
  { key: 'target_site', label: 'אתר יעד' },
  { key: 'purpose', label: 'יעוד' },
  { key: 'project_allocations', label: 'שריון פרויקטים', wide: true },
  { key: 'notes', label: 'הערות', wide: true },
];

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('he-IL');
  } catch {
    return dateStr;
  }
};

const formatValue = (value, type) => {
  if (value === undefined || value === null || value === '') return '—';
  if (type === 'date') return formatDate(value);
  if (Array.isArray(value)) return value.join(', ') || '—';
  return String(value);
};

const CLOSE_DELAY = 220;

const DetailPanel = ({ item, onClose, onShowCollections }) => {
  const panelRef = useRef(null);
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = useCallback(() => {
    setIsClosing(true);
  }, []);

  // Delay the actual unmount until exit animation finishes
  useEffect(() => {
    if (!isClosing) return;
    const timer = setTimeout(onClose, CLOSE_DELAY);
    return () => clearTimeout(timer);
  }, [isClosing, onClose]);

  // If a new item is selected while closing, cancel the close
  useEffect(() => {
    setIsClosing(false);
  }, [item]);

  // Close when clicking outside the panel (but not inside a modal/portal)
  useEffect(() => {
    const handleMouseDown = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        // Don't close when interacting with a modal overlay or dialog
        if (e.target.closest('.modal-overlay') || e.target.closest('[role="dialog"]')) return;
        handleClose();
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [handleClose]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleClose]);

  if (!item) return null;

  return (
    <div
      className={`detail-panel${isClosing ? ' detail-panel--closing' : ''}`}
      ref={panelRef}
      role="complementary"
      aria-label="פרטי פריט"
    >
      {/* Header */}
      <div className="detail-panel__header">
        <div className="detail-panel__title">
          <span className="detail-panel__catalog">{item.catalog_number || 'ללא מק"ט'}</span>
          <span className="detail-panel__desc">{item.description || ''}</span>
        </div>
        <button
          className="detail-panel__close"
          onClick={handleClose}
          aria-label="סגור פאנל פרטים"
        >
          <FiX size={18} />
        </button>
      </div>

      {/* Actions - Collections only */}
      {onShowCollections && (
        <div className="detail-panel__actions">
          <button className="detail-panel__action-btn" onClick={() => onShowCollections(item)}>
            <FiFolder size={14} />
            <span>קולקציות</span>
          </button>
        </div>
      )}

      {/* Fields Grid */}
      <div className="detail-panel__fields">
        {FIELD_CONFIG.map(({ key, label, type, wide }) => (
          <div
            key={key}
            className={`detail-panel__field ${wide ? 'detail-panel__field--wide' : ''}`}
          >
            <span className="detail-panel__field-label">{label}</span>
            <span className="detail-panel__field-value">
              {formatValue(item[key], type)}
            </span>
          </div>
        ))}
      </div>

      {/* Collections */}
      {item.associated_collections_count > 0 && (
        <div className="detail-panel__section">
          <div className="detail-panel__section-title">
            <FiFolder size={14} />
            <span>משויך ל-{item.associated_collections_count} קולקציות</span>
          </div>
        </div>
      )}

      {/* Timestamps */}
      <div className="detail-panel__footer">
        <div className="detail-panel__timestamp">
          <FiClock size={12} />
          <span>עודכן: {formatDate(item.updated_at)}</span>
        </div>
        <div className="detail-panel__timestamp">
          <FiClock size={12} />
          <span>נוצר: {formatDate(item.created_at)}</span>
        </div>
      </div>
    </div>
  );
};

export default DetailPanel;