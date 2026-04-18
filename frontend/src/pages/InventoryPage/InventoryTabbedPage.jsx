import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import InventoryPage from './InventoryPage';
import CatalogPage from '../CatalogPage/CatalogPage';
import LogsPage from '../LogsPage/LogsPage';
import './InventoryTabbedPage.css';

const VALID_TABS = ['current', 'stale', 'catalog', 'logs'];

const InventoryTabbedPage = () => {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab = VALID_TABS.includes(tabParam) ? tabParam : 'current';

  return (
    <div className="inventory-tabbed-page">
      <div className="inventory-tab-content">
        {activeTab === 'current' && <InventoryPage isEmbedded={true} />}
        {activeTab === 'stale' && <InventoryPage isEmbedded={true} staleMode={true} />}
        {activeTab === 'catalog' && <CatalogPage isEmbedded={true} />}
        {activeTab === 'logs' && <LogsPage isEmbedded={true} />}
      </div>
    </div>
  );
};

export default InventoryTabbedPage;
