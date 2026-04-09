import React from 'react';
import './ActionMapCard.css';

const ActionMapCard = ({ icon, elementName, action, useCase }) => {
  return (
    <div className="action-map-card">
      <div className="action-map-header">
        {icon && <div className="action-map-icon">{icon}</div>}
        <h4 className="action-map-name">{elementName}</h4>
      </div>
      <div className="action-map-body">
        <div className="action-map-row">
          <span className="action-map-label">פעולה:</span>
          <span className="action-map-value">{action}</span>
        </div>
        <div className="action-map-row use-case">
          <span className="action-map-label">מתי להשתמש:</span>
          <span className="action-map-value">{useCase}</span>
        </div>
      </div>
    </div>
  );
};

export default ActionMapCard;
