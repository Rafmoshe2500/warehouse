import React from 'react';
import './UserGuidePage.css';

const GuidePageLayout = ({ children }) => {
  return (
    <div className="guide-wrapper" dir="rtl">
      <div className="guide-content-only">
        {children}
      </div>
    </div>
  );
};

export default GuidePageLayout;
