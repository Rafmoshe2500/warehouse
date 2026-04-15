import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiAlertTriangle, FiClock, FiFileText, FiList, FiPackage, FiChevronLeft } from 'react-icons/fi';
import { useStaleItems } from '../../../hooks/useStaleItems';
import './SmartAlertsPanel.css';

const SmartAlertsPanel = ({ procurement }) => {
    const navigate = useNavigate();
    const { items: staleItems, totalItems: staleCount } = useStaleItems(90, 1, 5);

    const alerts = [];

    if (staleCount > 0) {
        alerts.push({
            id: 'stale',
            icon: FiClock,
            color: 'amber',
            text: `${staleCount} פריטים לא עודכנו 90+ ימים`,
            onClick: () => navigate('/inventory', { state: { tab: 'stale' } }),
        });
    }

    if (procurement?.waiting_emf > 0) {
        alerts.push({
            id: 'emf',
            icon: FiFileText,
            color: 'purple',
            text: `${procurement.waiting_emf} הזמנות ממתינות ל-EMF`,
            onClick: () => navigate('/procurement'),
        });
    }

    if (procurement?.waiting_bom > 0) {
        alerts.push({
            id: 'bom',
            icon: FiList,
            color: 'blue',
            text: `${procurement.waiting_bom} הזמנות ממתינות ל-BOM`,
            onClick: () => navigate('/procurement'),
        });
    }

    if (procurement?.ordered > 0) {
        alerts.push({
            id: 'ordered',
            icon: FiPackage,
            color: 'green',
            text: `${procurement.ordered} הזמנות בדרך אלינו`,
            onClick: () => navigate('/procurement'),
        });
    }

    if (alerts.length === 0) {
        return (
            <div className="smart-alerts-panel">
                <div className="smart-alerts-empty">
                    <FiAlertTriangle />
                    <span>אין התראות פעילות</span>
                </div>
            </div>
        );
    }

    return (
        <div className="smart-alerts-panel">
            {alerts.map((alert) => (
                <button
                    key={alert.id}
                    className={`smart-alert-item smart-alert-item--${alert.color}`}
                    onClick={alert.onClick}
                >
                    <alert.icon className="smart-alert-icon" />
                    <span className="smart-alert-text">{alert.text}</span>
                    <FiChevronLeft className="smart-alert-arrow" />
                </button>
            ))}
        </div>
    );
};

export default SmartAlertsPanel;
