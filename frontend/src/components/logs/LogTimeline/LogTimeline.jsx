import React from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiUpload, FiRotateCcw } from 'react-icons/fi';
import { ACTION_LABELS, FIELD_LABELS, ROLE_LABELS } from '../../../utils/constants';
import { formatDateTime } from '../../../utils/formatters';
import './LogTimeline.css';

/* Inline style for role badge within timeline */
const roleBadgeStyle = {
    fontSize: '0.75rem',
    padding: '2px 6px',
    borderRadius: '4px',
    background: 'rgba(0,0,0,0.05)',
    marginRight: '8px',
    border: '1px solid rgba(0,0,0,0.1)'
};


const ACTION_CONFIG = {
  create: { icon: FiPlus, className: 'log-item--success' },
  update: { icon: FiEdit2, className: 'log-item--info' },
  delete: { icon: FiTrash2, className: 'log-item--danger' },
  import: { icon: FiUpload, className: 'log-item--success' },
  undo: { icon: FiRotateCcw, className: 'log-item--undo' },
  bulk_update: { icon: FiEdit2, className: 'log-item--info' },
  bulk_delete: { icon: FiTrash2, className: 'log-item--danger' },
  password_change: { icon: FiEdit2, className: 'log-item--info' },
  role_change: { icon: FiEdit2, className: 'log-item--info' },
  group_create: { icon: FiPlus, className: 'log-item--success' },
  group_update: { icon: FiEdit2, className: 'log-item--info' },
  group_delete: { icon: FiTrash2, className: 'log-item--danger' },
  file_upload: { icon: FiPlus, className: 'log-item--success' },
  file_delete: { icon: FiTrash2, className: 'log-item--danger' },
  delete_all: { icon: FiTrash2, className: 'log-item--danger' },
  collection_item_add: { icon: FiPlus, className: 'log-item--success' },
  collection_item_remove: { icon: FiTrash2, className: 'log-item--danger' },
};

const getActionConfig = (action) => {
  // Normalize action (remove prefixes like item_, user_, procurement_)
  const normalizedAction = action.replace(/^(item_|user_|procurement_)/, '');
  return ACTION_CONFIG[normalizedAction] || { icon: FiEdit2, className: '' };
};

const getActionIcon = (action) => {
  const IconComponent = getActionConfig(action).icon;
  return <IconComponent size={16} />;
};

const getActionClass = (action) => {
  return getActionConfig(action).className;
};

const LogTimeline = ({ logs }) => {
  return (
    <div className="log-timeline">
      {logs.map((log, index) => (
        <div key={`${log._id || 'log'}-${index}`} className={`log-item ${getActionClass(log.action)}`}>
          <div className="log-item__icon">{getActionIcon(log.action)}</div>
          
          <div className="log-item__content">
            <div className="log-item__header">
              <span className="log-item__action">{ACTION_LABELS[log.action] || log.action}</span>
              <span className="log-item__user">{log.actor || log.user}</span>
              <span className="log-item__time">{formatDateTime(log.timestamp)}</span>
            </div>

            {log.target_user && (
              <div className="log-item__detail">
                <strong>משתמש:</strong> {log.target_user}
              </div>
            )}

            {log.item_identifier && (
              <div className="log-item__detail">
                <strong>פריט:</strong> {log.item_identifier}
                {log.item_description && ` - ${log.item_description}`}
              </div>
            )}

            {/* Generic details - hide if we have specific changes to avoid duplication */}
            {log.details && (!log.changes || Object.keys(log.changes).length === 0) && (
              <div className="log-item__detail">{log.details}</div>
            )}

            {log.changes && Object.keys(log.changes).length > 0 && (
              <div className="log-item__changes">
                {Object.entries(log.changes).map(([field, change]) => {
                  let fromValue = null;
                  let toValue = null;
                  let isDiff = false;

                  // Check if it's a diff structure (object with old/new keys)
                  if (change && typeof change === 'object' && ('old' in change || 'new' in change)) {
                    fromValue = change.old;
                    toValue = change.new;
                    isDiff = true;
                  } else {
                    // Flat value (e.g. create)
                    toValue = change;
                  }

                  // Translation helper for values
                  const translateValue = (field, value) => {
                    if (value === undefined || value === null) return value;
                    
                    if (field === 'role') {
                      return ROLE_LABELS[value] || value;
                    }
                    if (field === 'is_active') {
                      return value ? 'כן' : 'לא';
                    }
                    if (['created_at', 'updated_at', 'last_login', 'warranty_expiry'].includes(field)) {
                        return formatDateTime(value);
                    }
                    return value;
                  };

                  // Format values
                  const formatVal = (val) => (val === undefined || val === null || val === '') ? '(ריק)' : translateValue(field, val).toString();
                  const showFrom = formatVal(fromValue);
                  const showTo = formatVal(toValue);
                  
                  // Skip if values are identical (only for diffs)
                  if (isDiff && showFrom === showTo) return null;

                  return (
                    <span key={field} className="log-item__change">
                      <strong>{FIELD_LABELS[field] || field}:</strong>{' '}
                      {isDiff ? (
                        <>
                          <span className="old-value">{showFrom}</span>
                          {' ← '}
                          <span className="new-value">{showTo}</span>
                        </>
                      ) : (
                        <span className="new-value">{showTo}</span>
                      )}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ))}

      {logs.length === 0 && (
        <div className="log-timeline__empty">
          <p>אין רשומות לוג להצגה</p>
        </div>
      )}
    </div>
  );
};

export default LogTimeline;
