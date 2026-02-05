import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiPackage, FiClock, FiActivity } from 'react-icons/fi';
import InventoryPage from './InventoryPage';
import StaleItemsPage from '../StaleItemsPage/StaleItemsPage';
import LogsPage from '../LogsPage/LogsPage';
import './InventoryTabbedPage.css';

const InventoryTabbedPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'current';
  const [activeTab, setActiveTab] = useState(initialTab);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  return (
    <div className="inventory-tabbed-page">
      <div className="access-tabs">
        <button 
          className={`tab-btn ${activeTab === 'current' ? 'active' : ''}`}
          onClick={() => handleTabChange('current')}
        >
          <FiPackage />
          מלאי נוכחי
        </button>
        <button 
          className={`tab-btn ${activeTab === 'stale' ? 'active' : ''}`}
          onClick={() => handleTabChange('stale')}
        >
          <FiClock />
          מלאי ישן
        </button>
        <button 
          className={`tab-btn ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => handleTabChange('logs')}
        >
          <FiActivity />
          תנועות
        </button>
      </div>

      <div className="inventory-tab-content">
        {activeTab === 'current' && <InventoryPage isEmbedded={true} />}
        {activeTab === 'stale' && <StaleItemsPage isEmbedded={true} />}
        {activeTab === 'logs' && <LogsPage isEmbedded={true} />}
      </div>
    </div>
  );
};

export default InventoryTabbedPage;
