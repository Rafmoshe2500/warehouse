import React from 'react';
import { FiEdit2, FiTrash2, FiClock, FiPaperclip, FiTruck, FiCheck } from 'react-icons/fi';
import { Button } from '../common';
import { useAuth } from '../../context/AuthContext';
import './ProcurementTable.css';

// ── Status pipeline config ────────────────────────────────
const PIPELINE_STEPS = [
  { key: 'waiting_bom_emf',  label: 'BOM + EMF' },
  { key: 'waiting_shipment', label: 'ממתין לשילוח' },
  { key: 'shipped',          label: 'נשלח' },
  { key: 'received',         label: 'התקבל' },
];

// ── Vendor color / label map ──────────────────────────────
const VENDOR_META = {
  NETAPP: { color: '#f59e0b', logo: '🟠', label: 'NetApp' },
  DELL:   { color: '#3b82f6', logo: '🔵', label: 'Dell'   },
  HPE:    { color: '#22c55e', logo: '🟢', label: 'HPE'    },
};

const STATUS_LABELS = {
  received:         'התקבל',
  shipped:          'נשלח',
  waiting_shipment: 'ממתין לשילוח',
  waiting_bom_emf:  'ממתין לBOM ו-EMF',
};

// ── Simple pipeline bar ───────────────────────────────────
const PipelineBar = ({ order }) => {
  const steps = [
    { label: 'נוצר',       date: order.created_at || order.order_date, isDone: true },
    { label: 'התקבל BOM',  date: order.bom_received_at, isDone: !!order.received_bom },
    { label: 'התקבל EMF',  date: order.emf_received_at, isDone: !!order.emf_number },
    { label: 'ממתין לשילוח', date: order.waiting_shipment_at, isDone: ['waiting_shipment', 'shipped', 'received'].includes(order.status) },
    { label: 'נשלח',       date: order.shipped_at, isDone: ['shipped', 'received'].includes(order.status) },
    { label: 'התקבל',      date: order.received_at, isDone: order.status === 'received' },
  ];

  // For the current pulsing animation, we'll light the first non-done step, or none if all done
  const currentIndex = steps.findIndex(s => !s.isDone);

  return (
    <div className="pipeline">
      {steps.map((step, i) => {
        const isCurrent = i === currentIndex;
        return (
          <React.Fragment key={step.label}>
            <div className={`step ${step.isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}`}>
              <div className="step-dot" />
              <span className="step-label">{step.label}</span>
              <span className="step-date">
                {step.isDone ? (step.date ? new Date(step.date).toLocaleDateString('he-IL') : '✓') : '\u00A0'}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`step-line ${steps[i + 1].isDone ? 'done' : ''}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ── Order Card ────────────────────────────────────────────
const OrderCard = ({ order, onEdit, onDelete, onManageFiles, onHistory, onViewBom, onMarkAsOrdered, onMarkAsReceived, canEdit, isAdmin }) => {
  const vendor = VENDOR_META[order.bom_vendor];
  const statusLabel = STATUS_LABELS[order.status] || order.status;

  // Collect unique manufacturers from items
  const manufacturers = [...new Set((order.bom_items || []).map(i => i.manufacturer).filter(Boolean))];
  const hasMultipleItems = (order.bom_items || []).length > 1;

  return (
    <div className={`order-card status-card-${order.status || 'waiting_bom_emf'}`}>
      {/* Top row */}
      <div className="oc-top">
        {/* Vendor badge */}
        {vendor ? (
          <span className="oc-vendor" style={{ color: vendor.color }}>
            {vendor.logo} {vendor.label}
          </span>
        ) : (
          <span className="oc-vendor manual">✏️ ידני</span>
        )}

        {/* Items summary */}
        <div className="oc-items">
          {(order.bom_items || []).slice(0, 2).map((item, i) => (
            <span key={i} className="oc-item-chip"
              title={[item.product_name, item.catalog_number, item.description].filter(Boolean).join(' | ')}>
              {item.product_name || item.catalog_number || item.manufacturer || `פריט ${i+1}`}
            </span>
          ))}
          {(order.bom_items || []).length > 2 && (
            <span
              className="oc-item-more"
              title={(order.bom_items || []).slice(2).map(item =>
                [item.product_name, item.catalog_number, item.description].filter(Boolean).join(' | ') || 'פריט'
              ).join('\n')}
            >
              +{(order.bom_items || []).length - 2}
            </span>
          )}
        </div>

        {/* Date + Amount */}
        <div className="oc-meta">
          <span className="oc-date">📅 {new Date(order.order_date).toLocaleDateString('he-IL')}</span>
          {(order.total_amount > 0 || order.amount > 0) && (
            <span className="oc-amount">
              ${(order.total_amount || order.amount || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </span>
          )}
        </div>
      </div>

      {/* Bottom row — pipeline + actions */}
      <div className="oc-bottom">
        <PipelineBar order={order} />

        <div className="oc-actions">
          {/* EMF badge */}
          {order.emf_number && (
            <span className="oc-emf-badge" title={`EMF: ${order.emf_number}`}>EMF ✓</span>
          )}
          {/* BOM icon */}
          {order.bom_data && onViewBom && (
            <button className="oc-icon-btn bom-icon" title="צפה ב-BOM" onClick={() => onViewBom(order)}>📊</button>
          )}
          {/* Files */}
          <button className="oc-icon-btn" title="קבצים" onClick={() => onManageFiles(order)}>
            <FiPaperclip size={14} />
            {order.files?.length > 0 && <span className="oc-file-count">{order.files.length}</span>}
          </button>
          {/* History */}
          <button className="oc-icon-btn history" title="היסטוריה" onClick={() => onHistory(order)}>
            <FiClock size={14} />
          </button>

          {canEdit && (
            <>
              {order.status === 'shipped' && (
                <button className="oc-icon-btn received" title='סמן כ"התקבל"' onClick={() => onMarkAsReceived(order)}>
                  <FiCheck size={14} />
                </button>
              )}
              {order.status === 'waiting_shipment' && (
                <button className="oc-icon-btn truck" title='סמן כ"נשלח"' onClick={() => onMarkAsOrdered(order)}>
                  <FiTruck size={14} />
                </button>
              )}
              {(isAdmin || order.status !== 'received') && (
                <button className="oc-icon-btn edit" title="ערוך" onClick={() => onEdit(order)}>
                  <FiEdit2 size={14} />
                </button>
              )}
              {(isAdmin || order.status !== 'received') && (
                <button className="oc-icon-btn delete" title="מחק" onClick={() => onDelete(order)}>
                  <FiTrash2 size={14} />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Main Table Component ──────────────────────────────────
const ProcurementTable = ({
  orders, onEdit, onDelete, onManageFiles, onHistory, onViewBom,
  onMarkAsOrdered, onMarkAsReceived, canEdit = false, isAdmin = false,
}) => {
  if (!orders || orders.length === 0) {
    return (
      <div className="orders-empty">
        <span>📋</span>
        <p>אין הזמנות להצגה</p>
      </div>
    );
  }

  return (
    <div className="orders-card-list">
      {orders.map(order => (
        <OrderCard
          key={order.id}
          order={order}
          onEdit={onEdit}
          onDelete={onDelete}
          onManageFiles={onManageFiles}
          onHistory={onHistory}
          onViewBom={onViewBom}
          onMarkAsOrdered={onMarkAsOrdered}
          onMarkAsReceived={onMarkAsReceived}
          canEdit={canEdit}
          isAdmin={isAdmin}
        />
      ))}
    </div>
  );
};

export default ProcurementTable;
