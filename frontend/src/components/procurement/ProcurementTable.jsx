import React from 'react';
import { FiEdit2, FiTrash2, FiClock, FiPaperclip } from 'react-icons/fi';
import { Button } from '../common';
import { useAuth } from '../../context/AuthContext';
import './ProcurementTable.css';

const ProcurementTable = ({ orders, onEdit, onDelete, onManageFiles, onHistory }) => {
  const { isAdmin, isSuperAdmin } = useAuth();
  const canEdit = isAdmin || isSuperAdmin;

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
                <td>{order.catalog_number}</td>
                <td>{order.manufacturer}</td>
                <td className="desc-col" title={order.description}>{order.description}</td>
                <td>{order.quantity}</td>
                <td>${order.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td>{new Date(order.order_date).toLocaleDateString('he-IL')}</td>
                <td>
                  <span className={`status-badge status-${order.status || 'waiting_emf'}`}>
                    {order.status === 'received' ? 'רכש הגיע' :
                     order.status === 'ordered' ? 'רכש יצא' :
                     order.status === 'waiting_bom' ? 'מחכה ל-BOM' :
                     'מחכה ל-EMF'}
                  </span>
                </td>
                <td>
                  <span className={`status-dot ${order.received_emf ? 'green' : 'red'}`}></span>
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
                  <td className="actions-cell">
                    <Button 
                      variant="icon"
                      onClick={() => onHistory(order)}
                      title="היסטוריה"
                      icon={<FiClock size={16} />}
                    />
                    <Button 
                      variant="icon"
                      onClick={() => onEdit(order)}
                      title="ערוך"
                      icon={<FiEdit2 size={16} />}
                      style={{ color: '#3b82f6' }}
                    />
                    <Button 
                      variant="icon"
                      onClick={() => onDelete(order)}
                      title="מחק"
                      icon={<FiTrash2 size={16} />}
                      style={{ color: '#ef4444' }}
                    />
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
