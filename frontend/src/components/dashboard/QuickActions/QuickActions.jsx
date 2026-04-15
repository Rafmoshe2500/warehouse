import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiUpload, FiDownload, FiTruck } from 'react-icons/fi';
import { useAuth } from '../../../context/AuthContext';
import './QuickActions.css';

const QuickActions = () => {
    const navigate = useNavigate();
    const { hasPermission, hasProcurementAccess } = useAuth();

    const canWriteInventory = hasPermission('inventory:rw');
    const canAccessProcurement = hasProcurementAccess();

    return (
        <div className="quick-actions">
            {canWriteInventory && (
                <button
                    className="quick-action-btn"
                    onClick={() => navigate('/inventory', { state: { openCreate: true } })}
                >
                    <FiPlus />
                    <span>פריט חדש</span>
                </button>
            )}
            {canAccessProcurement && (
                <button
                    className="quick-action-btn"
                    onClick={() => navigate('/procurement', { state: { openCreate: true } })}
                >
                    <FiTruck />
                    <span>הזמנה חדשה</span>
                </button>
            )}
            {canWriteInventory && (
                <button
                    className="quick-action-btn"
                    onClick={() => navigate('/inventory', { state: { openImport: true } })}
                >
                    <FiUpload />
                    <span>ייבוא Excel</span>
                </button>
            )}
            {canWriteInventory && (
                <button
                    className="quick-action-btn"
                    onClick={() => navigate('/inventory', { state: { openExport: true } })}
                >
                    <FiDownload />
                    <span>ייצוא Excel</span>
                </button>
            )}
        </div>
    );
};

export default QuickActions;
