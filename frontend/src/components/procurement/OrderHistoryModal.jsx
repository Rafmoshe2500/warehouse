import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal/Modal';
import Spinner from '../common/Spinner/Spinner';
import auditService from '../../api/services/auditService';
import { useToast } from '../../hooks/useToast';
import './OrderHistoryModal.css';

const ACTION_LABELS = {
  'procurement_create': 'יצירת הזמנה',
  'procurement_update': 'עדכון הזמנה',
  'procurement_delete': 'מחיקת הזמנה',
  'procurement_file_upload': 'העלאת קובץ',
  'procurement_file_delete': 'מחיקת קובץ'
};

const FIELD_LABELS = {
  'catalog_number': 'מק"ט',
  'manufacturer': 'יצרן',
  'description': 'תיאור',
  'quantity': 'כמות',
  'amount': 'סכום',
  'total_amount': 'מחיר',
  'order_date': 'תאריך הזמנה',
  'created_at': 'תאריך יצירה',
  'created_by': 'נוצר ע"י',
  'status': 'סטטוס',
  'received_emf': 'התקבל EMF',
  'received_bom': 'התקבל BOM',
  'filename': 'שם קובץ'
};

const STATUS_LABELS = {
  'waiting_emf':      'מחכה ל-EMF',
  'waiting_bom':      'מחכה ל-BOM',
  'ordered':          'רכש יצא',
  'received':         'רכש הגיע',
  'waiting_bom_emf':  'ממתין ל-BOM ו-EMF',
  'waiting_shipment': 'ממתין לשילוח',
  'shipped':          'נשלח',
};

const OrderHistoryModal = ({ isOpen, onClose, orderId, orderNumber }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const { error } = useToast();

  useEffect(() => {
    if (isOpen && orderId) {
      fetchLogs();
    }
  }, [isOpen, orderId]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await auditService.getResourceLogs('procurement_order', orderId);
      setLogs(data.logs);
    } catch (err) {
      console.error(err);
      error('שגיאה בטעינת היסטוריה');
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (key, value) => {
    if (key === 'status') return STATUS_LABELS[value] || value;
    if (key === 'created_at' || key === 'order_date') return new Date(value).toLocaleString('he-IL');
    if (typeof value === 'boolean') return value ? 'כן' : 'לא';
    return value;
  };

  const renderChanges = (changes) => {
    if (!changes) return null;
    
    return (
      <div className="history-changes">
        {Object.entries(changes).map(([key, value]) => {
          // Skip internal fields
          if (['updated_at'].includes(key)) return null;

          // Special handling for bom_items — show catalog numbers
          if (key === 'bom_items') {
            const items = Array.isArray(value) ? value : (value?.new ?? value?.old ?? []);
            const catalogs = (Array.isArray(items) ? items : []).map(i => i.catalog_number).filter(Boolean);
            if (catalogs.length === 0) return null;
            return (
              <div key={key} className="change-item">
                <span className="change-field">מק"טים:</span>
                <span className="change-new">{catalogs.join(', ')}</span>
              </div>
            );
          }

          // Skip complex nested objects/arrays (e.g. bom_items) — not renderable inline
          if (Array.isArray(value) || (value !== null && typeof value === 'object' && !('old' in value) && !('new' in value))) return null;
          
          const label = FIELD_LABELS[key] || key;
          
          if (typeof value === 'object' && value !== null && 'old' in value && 'new' in value) {
            // Skip if old/new are themselves objects/arrays
            if (typeof value.old === 'object' || typeof value.new === 'object') return null;
            return (
              <div key={key} className="change-item" dir="ltr">
                <span className="change-old">{formatValue(key, value.old)}</span>
                <span className="arrow">→</span>
                <span className="change-new">{formatValue(key, value.new)}</span>
                <span className="change-field"> :{label}</span>
              </div>
            );
          }
           // Special handling for file operations where only filename changed/added
           if (key === 'filename') {
              return (
                 <div key={key} className="change-item">
                    <span className="change-field">קובץ:</span>
                    <span className="change-new">{value}</span>
                 </div>
              );
           }
           
           // For Create action, just show primitive values
           return (
            <div key={key} className="change-item">
               <span className="change-field">{label}:</span>
               <span className="change-new">{formatValue(key, value)}</span>
             </div>
           );
        })}
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`היסטוריית הזמנה ${orderNumber || ''}`}
      size="medium"
    >
      {!isOpen ? null : (
      <div className="order-history-modal">
        {loading ? (
          <div className="history-loading">
            <Spinner size="medium" />
          </div>
        ) : logs.length === 0 ? (
          <div className="no-history">אין היסטוריה להצגה</div>
        ) : (
          <div className="history-timeline">
            {logs.map((log) => (
              <div key={log.id} className="history-item">
                <div className="history-header">
                  <div className="history-action">
                    <span className="action-badge">
                      {ACTION_LABELS[log.action] || log.action}
                    </span>
                    <span className="history-actor">{log.actor}</span>
                  </div>
                  <div className="history-date">
                    {new Date(log.timestamp).toLocaleString('he-IL')}
                  </div>
                </div>
                
                {log.changes && renderChanges(log.changes)}
                
                {log.reason && (
                  <div className="history-reason">
                    <span className="reason-label">סיבה:</span> {log.reason}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      )}
    </Modal>
  );
};

export default OrderHistoryModal;
