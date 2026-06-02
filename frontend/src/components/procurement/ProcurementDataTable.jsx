import React, { useState, useMemo } from 'react';
import { FiEdit2, FiTrash2, FiClock, FiPaperclip, FiTruck, FiCheck, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { PROCUREMENT_STATUS_LABELS as STATUS_LABELS } from '../../utils/constants';
import './ProcurementDataTable.css';

const VENDOR_META = {
  NETAPP:    { color: '#a855f7', label: 'NETAPP'    },
  HPE:       { color: '#22c55e', label: 'HPE'       },
  CISCO:     { color: '#f97316', label: 'Cisco'     },
  DELL:      { color: '#3b82f6', label: 'Dell'      },
  COMMVAULT: { color: '#0066cc', label: 'Commvault' },
};

const pickOrderVendor = (order) => {
  return (
    order?.bom_vendor ||
    order?.manufacturer ||
    order?.vendor ||
    order?.bom_data?.vendor ||
    order?.bom_items?.find((item) => item?.manufacturer)?.manufacturer ||
    ''
  );
};

const resolveVendorLabel = (order) => {
  const rawVendor = pickOrderVendor(order);
  const normalizedVendor = typeof rawVendor === 'string' ? rawVendor.trim().toUpperCase() : '';
  const mapped = VENDOR_META[normalizedVendor];
  if (mapped) return { label: mapped.label, color: mapped.color, isMapped: true };

  const fallbackLabel = normalizedVendor || rawVendor;
  if (fallbackLabel) return { label: fallbackLabel, color: null, isMapped: false };

  return { label: 'ידני', color: null, isMapped: false };
};

const fmtQty = (qty) => {
  if (qty == null) return '';
  return typeof qty === 'number' && qty >= 1000
    ? `×${(qty / 1000).toFixed(0)}K`
    : `×${qty}`;
};

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

const getStatusLabel = (order) => {
  let label = STATUS_LABELS[order.status] || order.status;
  if (order.status === 'waiting_bom_emf') {
    if  (order.received_bom && !order.emf_number) label = 'ממתין ל-EMF';
    if (!order.received_bom &&  order.emf_number) label = 'ממתין ל-BOM';
  }
  return label;
};

const SORT_KEYS = ['order_date', 'bom_vendor', 'status', 'total_amount'];

const ProcurementDataTable = ({
  orders,
  onEdit, onDelete, onManageFiles, onHistory, onViewBom,
  onMarkAsOrdered, onMarkAsReceived,
  canEdit = false, canEditOrder = null, isAdmin = false,
}) => {
  const { hasPricePermission } = useAuth();
  const showPrices = hasPricePermission();
  const [sortKey, setSortKey] = useState('order_date');
  const [sortDir, setSortDir] = useState('desc');

  const handleSort = (key) => {
    if (!SORT_KEYS.includes(key)) return;
    if (sortKey === key) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const sorted = useMemo(() => [...(orders || [])].sort((a, b) => {
    let va = a[sortKey];
    let vb = b[sortKey];
    if (sortKey === 'order_date') {
      va = new Date(va || 0).getTime();
      vb = new Date(vb || 0).getTime();
    } else if (sortKey === 'total_amount') {
      va = va || a.amount || 0;
      vb = vb || b.amount || 0;
    } else {
      va = (va || '').toString().toLowerCase();
      vb = (vb || '').toString().toLowerCase();
    }
    if (va < vb) return sortDir === 'asc' ? -1 : 1;
    if (va > vb) return sortDir === 'asc' ? 1 : -1;
    return 0;
  }), [orders, sortKey, sortDir]);

  const SortIcon = ({ col }) => {
    if (sortKey !== col) return null;
    return sortDir === 'asc' ? <FiChevronUp size={12} /> : <FiChevronDown size={12} />;
  };

  if (!orders || orders.length === 0) {
    return (
      <div className="pdt-empty">
        <span>📋</span>
        <p>אין הזמנות להצגה</p>
      </div>
    );
  }

  return (
    <div className="pdt-wrapper">
      <table className="pdt-table">
        <thead>
          <tr>
            <th className="pdt-th pdt-th--sortable" onClick={() => handleSort('order_date')}>
              תאריך <SortIcon col="order_date" />
            </th>
            <th className="pdt-th pdt-th--sortable" onClick={() => handleSort('bom_vendor')}>
              ספק <SortIcon col="bom_vendor" />
            </th>
            <th className="pdt-th pdt-th--sortable" onClick={() => handleSort('status')}>
              סטטוס <SortIcon col="status" />
            </th>
            <th className="pdt-th">EMF</th>
            <th className="pdt-th">פריט ראשון</th>
            <th className="pdt-th">פריט שני</th>
            <th className="pdt-th">כמות פריטים</th>
            {showPrices && (
              <th className="pdt-th pdt-th--sortable" onClick={() => handleSort('total_amount')}>
                סכום <SortIcon col="total_amount" />
              </th>
            )}
            <th className="pdt-th pdt-th--actions">פעולות</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(order => {
            const vendor = resolveVendorLabel(order);
            const items = resolveDisplayItems(order);
            const isReceived = order.status === 'received';
            const canEditThis = canEditOrder ? canEditOrder(order) : canEdit;

            return (
              <tr
                key={order.id}
                className={`pdt-row ${isReceived ? 'pdt-row--received' : ''} pdt-row--${order.status}`}
              >
                {/* Date */}
                <td className="pdt-td pdt-td--date">
                  {order.order_date ? new Date(order.order_date).toLocaleDateString('he-IL') : '—'}
                </td>

                {/* Vendor */}
                <td className="pdt-td">
                  {vendor.isMapped ? (
                    <span className="pdt-vendor" style={{ color: vendor.color }}>
                      <span className="pdt-vendor-dot" style={{ background: vendor.color }} />
                      {vendor.label}
                    </span>
                  ) : (
                    <span className="pdt-vendor pdt-vendor--manual">{vendor.label}</span>
                  )}
                </td>

                {/* Status */}
                <td className="pdt-td">
                  <span className={`pdt-status pdt-status--${order.status}`}>
                    {getStatusLabel(order)}
                  </span>
                </td>

                {/* EMF */}
                <td className="pdt-td pdt-td--emf">
                  {order.emf_number ? (
                    <span className="pdt-emf">{order.emf_number}</span>
                  ) : (
                    <span className="pdt-muted">—</span>
                  )}
                </td>

                {/* First item */}
                <td className="pdt-td pdt-td--item">
                  {items[0] ? (
                    <div className="pdt-item-cell">
                      <span className="pdt-item-name">{items[0].name}</span>
                      {items[0].qty != null && <span className="pdt-item-qty">×{fmtQty(items[0].qty)}</span>}
                    </div>
                  ) : <span className="pdt-muted">—</span>}
                </td>

                {/* Second item */}
                <td className="pdt-td pdt-td--item">
                  {items[1] ? (
                    <div className="pdt-item-cell">
                      <span className="pdt-item-name">{items[1].name}</span>
                      {items[1].qty != null && <span className="pdt-item-qty">×{fmtQty(items[1].qty)}</span>}
                    </div>
                  ) : <span className="pdt-muted">—</span>}
                </td>

                {/* Item count */}
                <td className="pdt-td pdt-td--count">
                  {items.length > 0 ? items.length : '—'}
                </td>

                {/* Amount */}
                {showPrices && (
                  <td className="pdt-td pdt-td--amount">
                    {(order.total_amount > 0 || order.amount > 0)
                      ? `$${(order.total_amount || order.amount || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`
                      : <span className="pdt-muted">—</span>
                    }
                  </td>
                )}

                {/* Actions */}
                <td className="pdt-td pdt-td--actions">
                  <div className="pdt-actions">
                    {order.bom_data && onViewBom && (
                      <button className="pdt-btn" title="צפה ב-BOM" onClick={() => onViewBom(order)}>📊</button>
                    )}
                    <button className="pdt-btn" title="קבצים" onClick={() => onManageFiles(order)}>
                      <FiPaperclip size={13} />
                    </button>
                    <button className="pdt-btn" title="היסטוריה" onClick={() => onHistory(order)}>
                      <FiClock size={13} />
                    </button>
                    {canEditThis && (
                      <>
                        {order.status === 'shipped' && (
                          <button className="pdt-btn pdt-btn--success" title='סמן כ"התקבל"' onClick={() => onMarkAsReceived(order)}>
                            <FiCheck size={13} />
                          </button>
                        )}
                        {order.status === 'waiting_shipment' && (
                          <button className="pdt-btn pdt-btn--info" title='סמן כ"נשלח"' onClick={() => onMarkAsOrdered(order)}>
                            <FiTruck size={13} />
                          </button>
                        )}
                        {(isAdmin || !isReceived) && (
                          <button className="pdt-btn pdt-btn--edit" title="ערוך" onClick={() => onEdit(order)}>
                            <FiEdit2 size={13} />
                          </button>
                        )}
                        {(isAdmin || !isReceived) && (
                          <button className="pdt-btn pdt-btn--danger" title="מחק" onClick={() => onDelete(order)}>
                            <FiTrash2 size={13} />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default React.memo(ProcurementDataTable);
