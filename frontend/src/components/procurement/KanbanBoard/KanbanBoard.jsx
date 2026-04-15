import React from 'react';
import { FiEdit2, FiTrash2, FiClock, FiPaperclip, FiTruck, FiCheck } from 'react-icons/fi';
import './KanbanBoard.css';

const VENDOR_META = {
    NETAPP: { color: '#a855f7', label: 'NetApp' },
    HPE:    { color: '#22c55e', label: 'HPE' },
    CISCO:  { color: '#f97316', label: 'Cisco' },
    DELL:   { color: '#3b82f6', label: 'Dell' },
};

const COLUMNS = [
    {
        id: 'waiting',
        title: 'ממתין',
        statuses: ['waiting_bom_emf', 'waiting_bom', 'waiting_emf', 'waiting_order'],
        color: 'var(--accent-warning)',
    },
    {
        id: 'in_process',
        title: 'בתהליך',
        statuses: ['waiting_shipment', 'ordered'],
        color: 'var(--accent-primary)',
    },
    {
        id: 'shipped',
        title: 'נשלח',
        statuses: ['shipped'],
        color: 'var(--accent-success)',
    },
];

const getStatusLabel = (order) => {
    if (order.status === 'waiting_bom_emf') {
        if (order.received_bom && !order.emf_number) return 'ממתין ל-EMF';
        if (!order.received_bom && order.emf_number) return 'ממתין ל-BOM';
        return 'ממתין ל-BOM ו-EMF';
    }
    const labels = {
        waiting_shipment: 'ממתין לשילוח',
        shipped: 'נשלח',
        waiting_emf: 'ממתין ל-EMF',
        waiting_bom: 'ממתין ל-BOM',
        waiting_order: 'ממתין להזמנה',
        ordered: 'הוזמן',
    };
    return labels[order.status] || order.status;
};

const getItemCount = (order) => {
    if (order.bom_data?.groups?.length) return order.bom_data.groups.length;
    return order.bom_items?.length || 0;
};

const KanbanCard = ({
    order, onEdit, onDelete, onManageFiles, onHistory, onViewBom,
    onMarkAsOrdered, onMarkAsReceived, canEditThis, isAdmin, showPrices,
}) => {
    const vendor = VENDOR_META[order.bom_vendor];
    const itemCount = getItemCount(order);

    return (
        <div className={`kanban-card kanban-card--${order.status}`}>
            <div className="kanban-card__header">
                {vendor ? (
                    <span className="kanban-card__vendor" style={{ color: vendor.color }}>
                        <span className="kanban-card__vendor-dot" style={{ background: vendor.color }} />
                        {vendor.label}
                    </span>
                ) : (
                    <span className="kanban-card__vendor kanban-card__vendor--manual">✏️ ידני</span>
                )}
                <span className="kanban-card__date">
                    {new Date(order.order_date).toLocaleDateString('he-IL')}
                </span>
            </div>

            <div className="kanban-card__body">
                <span className="kanban-card__status">{getStatusLabel(order)}</span>
                {itemCount > 0 && (
                    <span className="kanban-card__items">{itemCount} רכיבים</span>
                )}
                {order.emf_number && (
                    <span className="kanban-card__emf">EMF {order.emf_number}</span>
                )}
            </div>

            {showPrices && (order.total_amount > 0 || order.amount > 0) && (
                <div className="kanban-card__amount">
                    ${(order.total_amount || order.amount || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </div>
            )}

            <div className="kanban-card__actions">
                {order.bom_data && onViewBom && (
                    <button className="kanban-card__btn" title="צפה ב-BOM" onClick={() => onViewBom(order)}>📊</button>
                )}
                <button className="kanban-card__btn" title="קבצים" onClick={() => onManageFiles(order)}>
                    <FiPaperclip size={13} />
                    {order.files?.length > 0 && <span className="kanban-card__badge">{order.files.length}</span>}
                </button>
                <button className="kanban-card__btn" title="היסטוריה" onClick={() => onHistory(order)}>
                    <FiClock size={13} />
                </button>
                {canEditThis && (
                    <>
                        {order.status === 'shipped' && (
                            <button className="kanban-card__btn kanban-card__btn--success" title='סמן כ"התקבל"' onClick={() => onMarkAsReceived(order)}>
                                <FiCheck size={13} />
                            </button>
                        )}
                        {order.status === 'waiting_shipment' && (
                            <button className="kanban-card__btn kanban-card__btn--info" title='סמן כ"נשלח"' onClick={() => onMarkAsOrdered(order)}>
                                <FiTruck size={13} />
                            </button>
                        )}
                        {(isAdmin || order.status !== 'received') && (
                            <button className="kanban-card__btn kanban-card__btn--edit" title="ערוך" onClick={() => onEdit(order)}>
                                <FiEdit2 size={13} />
                            </button>
                        )}
                        {(isAdmin || order.status !== 'received') && (
                            <button className="kanban-card__btn kanban-card__btn--danger" title="מחק" onClick={() => onDelete(order)}>
                                <FiTrash2 size={13} />
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

const KanbanBoard = ({
    orders, onEdit, onDelete, onManageFiles, onHistory, onViewBom,
    onMarkAsOrdered, onMarkAsReceived,
    canEdit = false, canEditOrder = null, isAdmin = false, showPrices = true,
}) => {
    const groupedOrders = COLUMNS.map(col => ({
        ...col,
        orders: orders.filter(o => col.statuses.includes(o.status)),
    }));

    if (!orders || orders.length === 0) {
        return (
            <div className="kanban-empty">
                <span>📋</span>
                <p>אין הזמנות להצגה</p>
            </div>
        );
    }

    return (
        <div className="kanban-board">
            {groupedOrders.map(col => (
                <div key={col.id} className="kanban-column">
                    <div className="kanban-column__header">
                        <span className="kanban-column__dot" style={{ background: col.color }} />
                        <h3 className="kanban-column__title">{col.title}</h3>
                        <span className="kanban-column__count">{col.orders.length}</span>
                    </div>
                    <div className="kanban-column__body">
                        {col.orders.length === 0 ? (
                            <div className="kanban-column__empty">ריק</div>
                        ) : (
                            col.orders.map(order => (
                                <KanbanCard
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
                            ))
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default KanbanBoard;
