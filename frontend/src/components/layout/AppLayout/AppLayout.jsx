import React from 'react';
import TopBar from '../TopBar/TopBar';
import Sidebar from '../Sidebar/Sidebar';
import useSidebar from '../../../hooks/useSidebar';
import './AppLayout.css';

const AppLayout = ({ children, onOpenSearch }) => {
  const { isCollapsed, toggle } = useSidebar();
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  return (
    <div className="app-layout" data-testid="app-layout">
      <TopBar onOpenSearch={onOpenSearch} />
      <div className="app-layout__body">
        <main className="app-layout__content">
          {children}
        </main>
        <Sidebar isCollapsed={isCollapsed} onToggle={toggle} />
        {/* Mobile backdrop */}
        {isMobile && !isCollapsed && (
          <div className="sidebar-backdrop" onClick={toggle} />
        )}
      </div>
    </div>
  );
};

export default AppLayout;
