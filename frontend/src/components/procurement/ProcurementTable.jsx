import React from 'react';
import { FiEdit2, FiTrash2, FiClock, FiPaperclip, FiTruck, FiCheck } from 'react-icons/fi';
import { Button } from '../common';
import { useAuth } from '../../context/AuthContext';
import './ProcurementTable.css';

const ProcurementTable = ({ 
  orders, 
  onEdit, 
  onDelete, 
  onManageFiles, 
  onHistory,
  onMarkAsOrdered,
  onMarkAsReceived,
  canEdit = false,
  isAdmin = false
}) => {

  return (
    <div className="procurement-table-container">
      <table className="procurement-table">
        <thead>
          <tr>
            <th>מק"ט</th>
            <th>יצרן</th>
            <th className="desc-col">תיאור</th>
            <th>כמות</th>
            <th>סכום</th>
            <th>תאריך הזמנה</th>
            <th>סטטוס</th>
            <th>EMF</th>
            <th>BOM</th>
            <th>קבצים</th>
            {canEdit && <th>פעולות</th>}
          </tr>
        </thead>
        <tbody>
          {orders.length > 0 ? (
            orders.map(order => (
              <tr key={order.id}>
                <td>
                  <div className="bom-items-list">
                    {order.bom_items ? (
                      order.bom_items.map((item, idx) => (
                        <div key={idx} className="bom-item-row">
                          {item.catalog_number}
                        </div>
                      ))
                    ) : (
                      <span>{order.catalog_number || '-'}</span>
                    )}
                  </div>
                </td>
                <td>
                  <div className="bom-items-list">
                    {order.bom_items ? (
                      order.bom_items.map((item, idx) => (
                        <div key={idx} className="bom-item-row">
                          {item.manufacturer}
                        </div>
                      ))
                    ) : (
                      <span>{order.manufacturer || '-'}</span>
                    )}
                  </div>
                </td>
                <td className="desc-col">
                  <div className="bom-items-list">
                    {order.bom_items ? (
                      order.bom_items.map((item, idx) => (
                        <div key={idx} className="bom-item-row" title={item.description}>
                          {item.description || item.catalog_number}
                        </div>
                      ))
                    ) : (
                      <span title={order.description}>{order.description || '-'}</span>
                    )}
                  </div>
                </td>
                <td>
                  <div className="bom-items-list">
                    {order.bom_items ? (
                      order.bom_items.map((item, idx) => (
                        <div key={idx} className="bom-item-row">
                          {item.quantity}x
                        </div>
                      ))
                    ) : (
                      <span>{order.quantity || 1}</span>
                    )}
                  </div>
                </td>
                <td className="amount-cell">
                  ${order.total_amount ? order.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : order.amount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                  {order.bom_items && order.bom_items.length > 1 && (
                    <small className="item-count">({order.bom_items.length} items)</small>
                  )}
                </td>
                <td>{new Date(order.order_date).toLocaleDateString('he-IL')}</td>
                <td>
                  <span className={`status-badge status-${order.status || 'waiting_bom_emf'}`}>
                    {order.status === 'received' ? 'רכש הגיע' :
                     order.status === 'ordered' ? 'רכש יצא' :
                     order.status === 'waiting_order' ? 'מחכה שרכש ייצא' :
                     order.status === 'waiting_bom' ? 'מחכה ל-BOM' :
                     order.status === 'waiting_emf' ? 'מחכה ל-EMF' :
                     'מחכה ל-BOM ו-EMF'}
                  </span>
                </td>
                <td>
                  <span>{order.emf_number || '-'}</span>
                </td>
                <td>
                  <span className={`status-dot ${order.received_bom ? 'green' : 'red'}`}></span>
                </td>
                <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                     <Button 
                        variant="icon"
                        onClick={() => onManageFiles(order)}
                        title="קבצים"
                        icon={<FiPaperclip size={16} />}
                     />
                     <span style={{ fontSize: '0.8rem' }}>{order.files?.length || 0}</span>
                    </div>
                </td>
                {canEdit && (
                  <td>
                    <div className="action-buttons-grid">
                        {/* 1. Edit */}
                        {(isAdmin || (order.status !== 'received' && order.status !== 'ordered')) ? (
                            <Button 
                              variant="icon"
                              onClick={() => onEdit(order)}
                              title="ערוך"
                              icon={<FiEdit2 size={16} />}
                              className="edit-btn"
                            />
                        ) : <div />}

                        {/* 2. Delete */}
                        {(isAdmin || (order.status !== 'received' && order.status !== 'ordered')) ? (
                            <Button 
                              variant="icon"
                              onClick={() => onDelete(order)}
                              title="מחק"
                              icon={<FiTrash2 size={16} />}
                              className="delete-btn"
                            />
                        ) : <div />}

                        {/* 3. History */}
                        <Button 
                          variant="icon"
                          onClick={() => onHistory(order)}
                          title="היסטוריה"
                          icon={<FiClock size={16} />}
                          className="history-btn"
                        />
                        
                        {/* 4. Truck or Check */}
                        {order.status === 'ordered' ? (
                            <Button 
                              variant="icon"
                              onClick={() => onMarkAsReceived(order)}
                              title='סמן כ"הגיע"'
                              icon={<FiCheck size={16} />}
                              className="received-btn"
                            />
                        ) : (order.status === 'waiting_order' ? (
                            <Button 
                              variant="icon"
                              onClick={() => onMarkAsOrdered(order)}
                              title='סמן כ"יצא לדרך"'
                              icon={<FiTruck size={16} />}
                              className="ordered-btn"
                            />
                        ) : <div />)}
                    </div>
                  </td>
                )}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={canEdit ? 11 : 10} className="no-data">
                אין הזמנות להצגה
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ProcurementTable;
