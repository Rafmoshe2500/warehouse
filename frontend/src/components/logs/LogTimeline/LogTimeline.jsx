import React from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiUpload, FiRotateCcw } from 'react-icons/fi';
import { ACTION_LABELS, FIELD_LABELS } from '../../../utils/constants';
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

const LogTimeline = ({ logs }) => {
  const getActionIcon = (action) => {
    // Normalize action (remove prefixes like item_, user_, procurement_)
    const normalizedAction = action.replace(/^(item_|user_|procurement_)/, '');

    switch (normalizedAction) {
      case 'create':
      case 'group_create':
      case 'file_upload':
        return <FiPlus size={16} />;
      case 'update':
      case 'bulk_update':
      case 'password_change':
      case 'role_change':
      case 'group_update':
        return <FiEdit2 size={16} />;
      case 'delete':
      case 'bulk_delete':
      case 'delete_all':
      case 'file_delete':
      case 'group_delete':
        return <FiTrash2 size={16} />;
      case 'import':
        return <FiUpload size={16} />;
      case 'undo':
        return <FiRotateCcw size={16} />;
      default:
        return <FiEdit2 size={16} />;
    }
  };

  const getActionClass = (action) => {
    // Normalize action
    const normalizedAction = action.replace(/^(item_|user_|procurement_)/, '');

    switch (normalizedAction) {
      case 'create':
      case 'import':
      case 'file_upload':
      case 'group_create':
        return 'log-item--success';
      case 'update':
      case 'bulk_update':
      case 'password_change':
      case 'role_change':
      case 'group_update':
        return 'log-item--info';
      case 'delete':
      case 'bulk_delete':
      case 'delete_all':
      case 'file_delete':
      case 'group_delete':
        return 'log-item--danger';
      case 'undo':
        return 'log-item--undo';
      default:
        return '';
    }
  };

  return (
    <div className="log-timeline">
      {logs.map((log) => (
        <div key={log._id} className={`log-item ${getActionClass(log.action)}`}>
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
                {log.target_role && <span className="role-badge-mini">{log.target_role}</span>}
              </div>
            )}

            {log.item_identifier && (
              <div className="log-item__detail">
                <strong>פריט:</strong> {log.item_identifier}
                {log.item_description && ` - ${log.item_description}`}
              </div>
            )}

            {log.details && (
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
                    if (field === 'role') {
                      const roles = { 'admin': 'מנהל', 'user': 'משתמש', 'superadmin': 'סופר-אדמין' };
                      return roles[value] || value;
                    }
                    if (field === 'is_active') {
                      return value ? 'כן' : 'לא';
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
