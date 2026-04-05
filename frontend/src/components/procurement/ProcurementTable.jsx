import React, { useState } from 'react';
import { FiEdit2, FiTrash2, FiClock, FiPaperclip, FiTruck, FiCheck } from 'react-icons/fi';
import { Button } from '../common';
import { useAuth } from '../../context/AuthContext';
import './ProcurementTable.css';

// ── Vendor color / label map ──────────────────────────────
const VENDOR_META = {
  NETAPP: { color: '#a855f7', dot: '#a855f7', label: 'NetApp' },
  HPE:    { color: '#22c55e', dot: '#22c55e', label: 'HPE'    },
  CISCO:  { color: '#f97316', dot: '#f97316', label: 'Cisco'  },
  DELL:   { color: '#3b82f6', dot: '#3b82f6', label: 'Dell'   },
};

const STATUS_LABELS = {
  received:         'התקבל',
  shipped:          'נשלח',
  waiting_shipment: 'ממתין לשילוח',
  waiting_bom_emf:  'ממתין ל-BOM ו-EMF',
  waiting_emf:      'ממתין ל-EMF',
  waiting_bom:      'ממתין ל-BOM',
};

const VISIBLE_COUNT = 4; // 2 columns × 2 rows visible by default

// ── Resolve items to display (main items per group only) ──
const resolveDisplayItems = (order) => {
  if (order.bom_data?.groups?.length) {
    return order.bom_data.groups.map(g => ({
      name:    g.main.part_alias || g.main.product || g.main.part_number,
      catalog: g.main.part_number,
      qty:     g.main.ext_qty,
    }));
  }
  return (order.bom_items || []).map(item => ({
    name:    item.part_alias || item.product_name || item.catalog_number || item.manufacturer || 'פריט',
    catalog: item.catalog_number,
    qty:     item.quantity,
  }));
};

// ── Single item row ───────────────────────────────────────
const ItemRow = ({ item, dotColor }) => (
  <div className="oc-item-row">
    <span className="oc-item-icon" style={{ background: dotColor }} />
    <div className="oc-item-info">
      <span className="oc-item-name" title={item.name}>{item.name}</span>
      {item.catalog && <span className="oc-item-catalog">{item.catalog}</span>}
    </div>
    {item.qty != null && (
      <span className="oc-item-qty">
        ×{typeof item.qty === 'number' && item.qty >= 1000
          ? (item.qty / 1000).toFixed(0) + 'K'
          : item.qty}
      </span>
    )}
  </div>
);

// ── Items block: 2-col grid + show more ──────────────────
const OrderItems = ({ items, dotColor }) => {
  const [expanded, setExpanded] = useState(false);

  const visibleItems = expanded ? items : items.slice(0, VISIBLE_COUNT);
  const hiddenCount  = items.length - VISIBLE_COUNT;
  const hasMore      = items.length > VISIBLE_COUNT;

  return (
    <div className="oc-items-block">
      <div className="oc-items-grid-2">
        {visibleItems.map((item, i) => (
          <ItemRow key={i} item={item} dotColor={dotColor} />
        ))}
      </div>

      {hasMore && (
        <div className="oc-show-more-row">
          <button
            className="oc-show-more-btn"
            onClick={() => setExpanded(prev => !prev)}
          >
            {expanded ? '▴ הצג פחות' : `▾ עוד ${hiddenCount} רכיבים`}
          </button>
          <span className="oc-total-count">סה"כ {items.length} רכיבים</span>
        </div>
      )}
    </div>
  );
};

// ── Compact Pipeline Bar ──────────────────────────────────
const PipelineBar = ({ order }) => {
  const steps = [
    { label: 'נוצר',  date: order.created_at || order.order_date,  isDone: true },
    { label: 'BOM',   date: order.bom_received_at,                 isDone: !!order.received_bom },
    { label: 'EMF',   date: order.emf_received_at,                 isDone: !!order.emf_number },
    { label: 'שילוח', date: order.waiting_shipment_at,             isDone: ['waiting_shipment', 'shipped', 'received'].includes(order.status) },
    { label: 'נשלח',  date: order.shipped_at,                      isDone: ['shipped', 'received'].includes(order.status) },
    { label: 'התקבל', date: order.received_at,                     isDone: order.status === 'received' },
  ];

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
                {step.isDone
                  ? (step.date ? new Date(step.date).toLocaleDateString('he-IL') : '✓')
                  : '\u00A0'}
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
const OrderCard = ({
  order,
  onEdit, onDelete, onManageFiles, onHistory, onViewBom,
  onMarkAsOrdered, onMarkAsReceived,
  canEdit = false, canEditThis = false, isAdmin = false, showPrices = true,
}) => {
  const vendor = VENDOR_META[order.bom_vendor];

  let statusLabel = STATUS_LABELS[order.status] || order.status;
  if (order.status === 'waiting_bom_emf') {
    if  (order.received_bom && !order.emf_number) statusLabel = 'ממתין ל-EMF';
    if (!order.received_bom &&  order.emf_number) statusLabel = 'ממתין ל-BOM';
  }

  const displayItems = resolveDisplayItems(order);

  return (
    <div className={`order-card status-card-${order.status || 'waiting_bom_emf'}`}>

      {/* ── Row 1: vendor · status pill · spacer · date · amount ── */}
      <div className="oc-top">
        {vendor ? (
          <span className="oc-vendor" style={{ color: vendor.color }}>
            <span className="oc-vendor-dot" style={{ background: vendor.dot }} />
            {vendor.label}
          </span>
        ) : (
          <span className="oc-vendor manual">✏️ ידני</span>
        )}

        <span className={`status-pill status-${order.status}`}>{statusLabel}</span>

        {order.emf_number && (
          <span className="emf-number-badge" title={`מספר EMF: ${order.emf_number}`}>
            EMF&nbsp;{order.emf_number}
          </span>
        )}

        <div className="oc-spacer" />

        <span className="oc-date">📅 {new Date(order.order_date).toLocaleDateString('he-IL')}</span>

        {showPrices && (order.total_amount > 0 || order.amount > 0) && (
          <span className="oc-amount">
            ${(order.total_amount || order.amount || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </span>
        )}
      </div>

      {/* ── Row 2: 2-col items grid + show more ── */}
      <OrderItems items={displayItems} dotColor={vendor?.dot} />

      {/* ── Row 3: compact pipeline + actions ── */}
      <div className="oc-bottom">
        <PipelineBar order={order} />

        <div className="oc-actions">
          {order.emf_number && (
            <span className="oc-emf-badge" title={`EMF: ${order.emf_number}`}>EMF ✓</span>
          )}
          {order.received_bom && (
            <span className="oc-emf-badge" title="BOM התקבל">BOM ✓</span>
          )}
          {order.bom_data && onViewBom && (
            <button className="oc-icon-btn bom-icon" title="צפה ב-BOM" onClick={() => onViewBom(order)}>📊</button>
          )}
          <button className="oc-icon-btn" title="קבצים" onClick={() => onManageFiles(order)}>
            <FiPaperclip size={14} />
            {order.files?.length > 0 && <span className="oc-file-count">{order.files.length}</span>}
          </button>
          <button className="oc-icon-btn history" title="היסטוריה" onClick={() => onHistory(order)}>
            <FiClock size={14} />
          </button>

          {canEditThis && (
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
  orders,
  onEdit, onDelete, onManageFiles, onHistory, onViewBom,
  onMarkAsOrdered, onMarkAsReceived,
  canEdit = false, canEditOrder = null, isAdmin = false,
}) => {
  const { hasPricePermission } = useAuth();
  const showPrices = hasPricePermission();
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
          canEditThis={canEditOrder ? canEditOrder(order) : canEdit}
          isAdmin={isAdmin}
          showPrices={showPrices}
        />
      ))}
    </div>
  );
};

export default ProcurementTable;