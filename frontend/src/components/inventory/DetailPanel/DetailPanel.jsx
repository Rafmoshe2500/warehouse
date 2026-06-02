import React, { useRef, useEffect, useCallback, useState } from 'react';
import { FiX, FiFolder, FiClock, FiCheck, FiActivity, FiChevronDown } from 'react-icons/fi';
import { IMMUTABLE_FIELDS } from '../../../constants/tableConfig';
import { TARGET_SITES } from '../../../constants/sites';
import { ACTION_LABELS, FIELD_LABELS } from '../../../utils/constants';
import auditService from '../../../api/services/auditService';
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

const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleString('he-IL', {
      day: '2-digit', month: '2-digit', year: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
  } catch {
    return dateStr;
  }
};

const formatChanges = (changes) => {
  if (!changes || typeof changes !== 'object') return null;
  return Object.entries(changes)
    .map(([k, v]) => {
      const label = FIELD_LABELS[k] || k;
      const from = v?.old ?? v?.before;
      const to = v?.new ?? v?.after ?? v;
      if (from !== undefined && to !== undefined) return `${label}: ${from} → ${to}`;
      return `${label}: ${JSON.stringify(to)}`;
    })
    .join(', ');
};

const formatValue = (value, type) => {
  if (value === undefined || value === null || value === '') return '—';
  if (type === 'date') return formatDate(value);
  if (Array.isArray(value)) return value.join(', ') || '—';
  return String(value);
};

const CLOSE_DELAY = 220;

const DetailPanel = ({ item, onClose, onShowCollections, onEdit, canEdit }) => {
  const panelRef = useRef(null);
  const [isClosing, setIsClosing] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [recentMovements, setRecentMovements] = useState([]);
  const [sectionsLoading, setSectionsLoading] = useState(false);
  const [movementsOpen, setMovementsOpen] = useState(false);

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

  // Reset edit state and collapse movements when the selected item changes
  useEffect(() => {
    setEditingField(null);
    setEditValue('');
    setMovementsOpen(false);
  }, [item?._id]);

  // Fetch collections and recent movements whenever item changes
  useEffect(() => {
    if (!item?._id) return;
    let cancelled = false;
    setSectionsLoading(true);
    setRecentMovements([]);

    Promise.all([
      auditService.getResourceLogs('item', item._id, { page_size: 5 }).catch(() => ({ logs: [] }))
    ]).then(([logsData]) => {
      if (cancelled) return;
      const logs = logsData?.logs ?? logsData?.items ?? (Array.isArray(logsData) ? logsData : []);
      setRecentMovements(logs.slice(0, 5));
    }).finally(() => {
      if (!cancelled) setSectionsLoading(false);
    });

    return () => { cancelled = true; };
  }, [item?._id]);

  const handleCancelEdit = useCallback(() => {
    setEditingField(null);
    setEditValue('');
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editingField || !onEdit) { setEditingField(null); return; }
    const original = item[editingField];
    const trimmedNew = String(editValue).trim();
    const trimmedOrig = String(original == null ? '' : original).trim();
    if (trimmedNew !== trimmedOrig) {
      await onEdit(item._id, editingField, editValue);
    }
    setEditingField(null);
  }, [editingField, editValue, item, onEdit]);

  const handleEditKeyDown = useCallback((e) => {
    if (e.key === 'Enter') { e.preventDefault(); handleSaveEdit(); }
    if (e.key === 'Escape') { e.stopPropagation(); handleCancelEdit(); }
  }, [handleSaveEdit, handleCancelEdit]);

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
        {FIELD_CONFIG.map(({ key, label, type, wide }) => {
          const isEditable = canEdit && onEdit && !IMMUTABLE_FIELDS.includes(key);
          const isCurrentlyEditing = editingField === key;
          return (
            <div
              key={key}
              className={`detail-panel__field ${wide ? 'detail-panel__field--wide' : ''}`}
            >
              <span className="detail-panel__field-label">{label}</span>
              {isCurrentlyEditing ? (
                <div className="detail-panel__edit-container">
                  {key === 'target_site' ? (
                    <select
                      className="detail-panel__edit-input"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={handleEditKeyDown}
                      onBlur={handleSaveEdit}
                      autoFocus
                    >
                      <option value="">בחר אתר...</option>
                      {TARGET_SITES.map(site => (
                        <option key={site} value={site}>{site}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      className="detail-panel__edit-input"
                      type={key === 'current_stock' ? 'number' : key === 'warranty_expiry' ? 'date' : 'text'}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={handleEditKeyDown}
                      onBlur={handleSaveEdit}
                      autoFocus
                    />
                  )}
                  <div className="detail-panel__edit-actions">
                    <button
                      className="detail-panel__edit-btn save"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={handleSaveEdit}
                    >
                      <FiCheck size={12} />
                    </button>
                    <button
                      className="detail-panel__edit-btn cancel"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={handleCancelEdit}
                    >
                      <FiX size={12} />
                    </button>
                  </div>
                </div>
              ) : key === 'project_allocations' ? (
                (() => {
                  const allocs = item[key];
                  if (!allocs || typeof allocs !== 'object' || Object.keys(allocs).length === 0) {
                    return <span className="detail-panel__field-value">—</span>;
                  }
                  return (
                    <div className="detail-panel__allocation-tags">
                      {Object.entries(allocs).map(([proj, qty]) => (
                        <span key={proj} className="detail-panel__allocation-tag">
                          <span className="detail-panel__allocation-proj">{proj}</span>
                          <span className="detail-panel__allocation-qty">{qty}</span>
                        </span>
                      ))}
                    </div>
                  );
                })()
              ) : (
                <span
                  className={`detail-panel__field-value${isEditable ? ' detail-panel__field-value--editable' : ''}`}
                  onDoubleClick={isEditable ? () => {
                    const raw = item[key];
                    let initVal = '';
                    if (type === 'date' && raw) {
                      try { initVal = new Date(raw).toISOString().split('T')[0]; } catch { initVal = raw || ''; }
                    } else {
                      initVal = String(raw == null ? '' : raw);
                    }
                    setEditValue(initVal);
                    setEditingField(key);
                  } : undefined}
                  title={isEditable ? 'לחץ פעמיים לעריכה' : undefined}
                >
                  {formatValue(item[key], type)}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Recent Movements Section — collapsible */}
      <div className="detail-panel__section detail-panel__section--movements">
        <button
          className="detail-panel__movements-toggle"
          onClick={() => setMovementsOpen((o) => !o)}
          aria-expanded={movementsOpen}
        >
          <FiActivity size={14} />
          <span>5 תנועות אחרונות</span>
          {!sectionsLoading && recentMovements.length > 0 && (
            <span className="detail-panel__movements-count">{recentMovements.length}</span>
          )}
          <FiChevronDown
            size={14}
            className={`detail-panel__movements-chevron${movementsOpen ? ' detail-panel__movements-chevron--open' : ''}`}
          />
        </button>
        <div className={`detail-panel__movements-body${movementsOpen ? ' detail-panel__movements-body--open' : ''}`}>
          <div className="detail-panel__movements-inner">
            {sectionsLoading ? (
              <p className="detail-panel__section-empty">טוען...</p>
            ) : recentMovements.length === 0 ? (
              <p className="detail-panel__section-empty">אין תנועות</p>
            ) : (
              <div className="detail-panel__movements">
                {recentMovements.map((log) => {
                  const changesText = formatChanges(log.changes);
                  return (
                    <div key={log.id ?? log._id} className="detail-panel__movement">
                      <div className="detail-panel__movement-header">
                        <span className="detail-panel__movement-action">
                          {ACTION_LABELS[log.action] ?? log.action}
                        </span>
                        <span className="detail-panel__movement-actor">{log.actor}</span>
                      </div>
                      {changesText && (
                        <div className="detail-panel__movement-changes">{changesText}</div>
                      )}
                      <div className="detail-panel__movement-time">{formatDateTime(log.timestamp)}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

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