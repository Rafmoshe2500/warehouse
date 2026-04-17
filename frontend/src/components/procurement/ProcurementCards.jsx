import React, { useState, memo } from 'react';
import { FiEdit2, FiTrash2, FiClock, FiPaperclip, FiTruck, FiCheck, FiFileText } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import './ProcurementCards.css';

// -- Vendor color / label map --
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

const VISIBLE_CHIPS = 4;

const fmtQty = (qty) => {
  if (qty == null) return '';
  return typeof qty === 'number' && qty >= 1000
    ? `x${(qty / 1000).toFixed(0)}K`
    : `x${qty}`;
};

// -- Resolve items to display --
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

// -- Item Chips Row --
const ItemChips = ({ items, dotColor }) => {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? items : items.slice(0, VISIBLE_CHIPS);
  const extra = items.length - VISIBLE_CHIPS;

  return (
    <div className="pc-chips-wrap">
      {visible.map((item, i) => (
        <span key={i} className="pc-chip" title={`${item.name} ${item.catalog || ''}`}>
          <span className="pc-chip-dot" style={{ background: dotColor }} />
          <span className="pc-chip-name">{item.name}</span>
          {item.catalog && <span className="pc-chip-cat">{item.catalog}</span>}
          {item.qty != null && <span className="pc-chip-qty">{fmtQty(item.qty)}</span>}
        </span>
      ))}
      {extra > 0 && (
        <button className="pc-chip-more" onClick={() => setExpanded(prev => !prev)}>
          {expanded ? 'פחות' : `+${extra} נוספים`}
        </button>
      )}
    </div>
  );
};

// -- Mini Pipeline --
const MiniPipeline = ({ order }) => {
  const steps = [
    { key: 'created',  label: 'נוצר',  isDone: true },
    { key: 'bom',      label: 'BOM',   isDone: !!order.received_bom },
    { key: 'emf',      label: 'EMF',   isDone: !!order.emf_number },
    { key: 'shipment', label: 'שילוח', isDone: ['waiting_shipment', 'shipped', 'received'].includes(order.status) },
    { key: 'shipped',  label: 'נשלח',  isDone: ['shipped', 'received'].includes(order.status) },
    { key: 'received', label: 'התקבל', isDone: order.status === 'received' },
  ];
  const currentIdx = steps.findIndex(s => !s.isDone);

  return (
    <div className="pc-pipeline">
      {steps.map((step, i) => {
        const isCurrent = i === currentIdx;
        return (
          <React.Fragment key={step.key}>
            <div className={`pc-pip-step ${step.isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}`} title={step.label}>
              <div className="pc-pip-dot" />
              <span className="pc-pip-label">{step.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`pc-pip-line ${steps[i + 1].isDone ? 'done' : ''}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// -- Order Card --
const OrderCard = memo(({
  order,
  onEdit, onDelete, onManageFiles, onHistory, onViewBom,
  onMarkAsOrdered, onMarkAsReceived,
  canEditThis = false, isAdmin = false, showPrices = true,
}) => {
  const vendor = VENDOR_META[order.bom_vendor];
  const isReceived = order.status === 'received';

  let statusLabel = STATUS_LABELS[order.status] || order.status;
  if (order.status === 'waiting_bom_emf') {
    if  (order.received_bom && !order.emf_number) statusLabel = 'ממתין ל-EMF';
    if (!order.received_bom &&  order.emf_number) statusLabel = 'ממתין ל-BOM';
  }

  const displayItems = resolveDisplayItems(order);

  return (
    <div className={`pc-card ${isReceived ? 'pc-card--received' : ''} pc-card--${order.status || 'waiting_bom_emf'}`}>

      {/* Row 1: Header */}
      <div className="pc-header">
        {vendor ? (
          <span className="pc-vendor" style={{ color: vendor.color }}>
            <span className="pc-vendor-dot" style={{ background: vendor.dot }} />
            {vendor.label}
          </span>
        ) : (
          <span className="pc-vendor pc-vendor--manual">ידני</span>
        )}

        <span className={`pc-status pc-status--${order.status}`}>{statusLabel}</span>

        {order.emf_number && (
          <span className="pc-emf-badge" title={`מספר EMF: ${order.emf_number}`}>
            EMF {order.emf_number}
          </span>
        )}

        <div className="pc-spacer" />

        <span className="pc-date">{new Date(order.order_date).toLocaleDateString('he-IL')}</span>

        {showPrices && (order.total_amount > 0 || order.amount > 0) && (
          <span className="pc-amount">
            ${(order.total_amount || order.amount || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </span>
        )}
      </div>

      {/* Row 2: Item Chips */}
      {displayItems.length > 0 && (
        <ItemChips items={displayItems} dotColor={vendor?.dot || 'var(--text-muted)'} />
      )}

      {/* Row 3: Pipeline + Actions */}
      <div className="pc-footer">
        <MiniPipeline order={order} />

        <div className="pc-actions">
          {order.received_bom && <span className="pc-badge-sm" title="BOM התקבל">BOM</span>}
          {order.emf_number && <span className="pc-badge-sm" title="EMF התקבל">EMF</span>}

          {order.bom_data && onViewBom && (
            <button className="pc-btn pc-btn--bom" title="צפה ב-BOM" onClick={() => onViewBom(order)}><FiFileText /> </button>
          )}
          <button className="pc-btn" title="קבצים" onClick={() => onManageFiles(order)}>
            <FiPaperclip size={13} />
            {order.files?.length > 0 && <span className="pc-file-count">{order.files.length}</span>}
          </button>
          <button className="pc-btn" title="היסטוריה" onClick={() => onHistory(order)}>
            <FiClock size={13} />
          </button>

          {canEditThis && (
            <>
              {order.status === 'shipped' && (
                <button className="pc-btn pc-btn--success" title="סמן כהגיע" onClick={() => onMarkAsReceived(order)}>
                  <FiCheck size={13} />
                </button>
              )}
              {order.status === 'waiting_shipment' && (
                <button className="pc-btn pc-btn--info" title="שלח לדרך" onClick={() => onMarkAsOrdered(order)}>
                  <FiTruck size={13} />
                </button>
              )}
              {(isAdmin || !isReceived) && (
                <button className="pc-btn pc-btn--edit" title="ערוך" onClick={() => onEdit(order)}>
                  <FiEdit2 size={13} />
                </button>
              )}
              {(isAdmin || !isReceived) && (
                <button className="pc-btn pc-btn--danger" title="מחק" onClick={() => onDelete(order)}>
                  <FiTrash2 size={13} />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
});

// -- Main Cards Component --
const ProcurementCards = ({
  orders,
  onEdit, onDelete, onManageFiles, onHistory, onViewBom,
  onMarkAsOrdered, onMarkAsReceived,
  canEdit = false, canEditOrder = null, isAdmin = false,
}) => {
  const { hasPricePermission } = useAuth();
  const showPrices = hasPricePermission();

  if (!orders || orders.length === 0) {
    return (
      <div className="pc-empty">
        <span>אין הזמנות להצגה</span>
      </div>
    );
  }

  return (
    <div className="pc-list">
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
          canEditThis={canEditOrder ? canEditOrder(order) : canEdit}
          isAdmin={isAdmin}
          showPrices={showPrices}
        />
      ))}
    </div>
  );
};

export default memo(ProcurementCards);