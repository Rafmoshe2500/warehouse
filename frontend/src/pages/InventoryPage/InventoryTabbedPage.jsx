import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiPackage, FiClock, FiActivity } from 'react-icons/fi';
import InventoryPage from './InventoryPage';
import CatalogPage from '../CatalogPage/CatalogPage';
import StaleItemsPage from '../StaleItemsPage/StaleItemsPage';
import LogsPage from '../LogsPage/LogsPage';
import { Tabs } from '../../components/common';
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
      <Tabs 
        tabs={[
          { id: 'current', label: 'מלאי נוכחי', icon: <FiPackage /> },
          { id: 'stale', label: 'מלאי ישן', icon: <FiClock /> },
          { id: 'catalog', label: 'קטלוג פריטים', icon: <FiPackage /> },
          { id: 'logs', label: 'תנועות', icon: <FiActivity /> }
        ]}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      <div className="inventory-tab-content">
        {activeTab === 'current' && <InventoryPage isEmbedded={true} />}
        {activeTab === 'stale' && <StaleItemsPage isEmbedded={true} />}
        {activeTab === 'catalog' && <CatalogPage isEmbedded={true} />}
        {activeTab === 'logs' && <LogsPage isEmbedded={true} />}
      </div>
    </div>
  );
};

export default InventoryTabbedPage;
