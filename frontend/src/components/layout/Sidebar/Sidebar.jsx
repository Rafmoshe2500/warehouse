import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { FiChevronRight, FiChevronLeft, FiLayers } from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../context/AuthContext';
import collectionsService from '../../../api/services/collectionsService';
import navigationConfig from '../../../config/navigationConfig';
import Logo from '../Logo/Logo';
import './Sidebar.css';

const Sidebar = ({ isCollapsed, onToggle }) => {
  const { isAdmin, isSuperAdmin, hasPermission, hasProcurementAccess } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [expandedGroups, setExpandedGroups] = useState({});

  const currentPath = location.pathname;
  const currentTab = searchParams.get('tab');

  // Fetch user collections for dynamic sidebar children
  const { data: collections = [] } = useQuery({
    queryKey: ['collections'],
    queryFn: collectionsService.getCollections,
    staleTime: 30_000,
  });

  // Inject dynamic collection children into 'my-components' nav item
  const navItems = useMemo(() => {
    return navigationConfig.map(item => {
      if (item.id === 'my-components' && collections.length > 0) {
        return {
          ...item,
          children: collections.map(col => ({
            id: `collection-${col.id}`,
            label: col.name,
            icon: FiLayers,
            path: `/my-components/${col.id}`,
          })),
        };
      }
      return item;
    });
  }, [collections]);

  // Check if a nav item should be visible based on permissions
  const isItemVisible = (item) => {
    if (!item.permission) return true;
    if (item.permission === 'admin') return isAdmin;
    if (item.permission === 'superAdmin') return isSuperAdmin;
    if (item.permission === 'procurement') return hasProcurementAccess();
    if (item.permission === 'compare_prices') return hasPermission('procurement:compare_prices');
    // Standard permission check (e.g., 'inventory:ro')
    return hasPermission(item.permission);
  };

  // Filter visible nav items
  const visibleItems = navItems.filter(isItemVisible);

  // Auto-expand parent group when navigating to a child route
  useEffect(() => {
    const activeParent = visibleItems.find(item => currentPath.startsWith(item.path));
    if (activeParent?.children) {
      setExpandedGroups(prev => ({ ...prev, [activeParent.id]: true }));
    }
  }, [currentPath]);

  const isActive = (item) => {
    if (item.path === '/dashboard') return currentPath === '/dashboard';
    return currentPath.startsWith(item.path);
  };

  const isChildActive = (parent, child) => {
    if (!currentPath.startsWith(parent.path)) return false;
    // Path-based children
    if (child.path) return currentPath === child.path;
    // Tab-based children
    if (!currentTab) return child === parent.children?.filter(c => isItemVisible(c))[0];
    return currentTab === child.tabParam;
  };

  const handleItemClick = (item) => {
    if (item.children) {
      const visibleChildren = item.children.filter(isItemVisible);
      if (isActive(item)) {
        // Already on this route — toggle group expansion
        setExpandedGroups(prev => ({ ...prev, [item.id]: !prev[item.id] }));
      } else {
        // Navigate to the parent's own path and expand its children
        const firstChild = visibleChildren[0];
        const hasPathChildren = firstChild?.path && firstChild.path !== item.path;
        if (hasPathChildren) {
          // Parent has its own meaningful page (e.g. /my-components dashboard)
          navigate(item.path);
        } else if (firstChild?.path) {
          // First child IS the parent page (e.g. guide-overview → /guide)
          navigate(firstChild.path);
        } else {
          // Tab-based children — go to first tab
          navigate(`${item.path}?tab=${firstChild.tabParam}`);
        }
        setExpandedGroups(prev => ({ ...prev, [item.id]: true }));
      }
    } else {
      navigate(item.path);
    }
  };

  const handleChildClick = (parent, child) => {
    if (child.path) {
      navigate(child.path);
    } else {
      navigate(`${parent.path}?tab=${child.tabParam}`);
    }
  };

  const toggleGroup = (itemId) => {
    setExpandedGroups(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  return (
    <aside
      className={`sidebar ${isCollapsed ? 'sidebar--collapsed' : 'sidebar--expanded'}`}
      data-testid="sidebar"
      aria-label="תפריט ניווט"
    >
      {/* Toggle Button */}
      <button
        className="sidebar__toggle"
        onClick={onToggle}
        aria-label={isCollapsed ? 'הרחב תפריט' : 'צמצם תפריט'}
        data-testid="sidebar-toggle"
        title={isCollapsed ? 'הרחב תפריט (Ctrl+B)' : 'צמצם תפריט (Ctrl+B)'}
      >
        {isCollapsed ? <FiChevronLeft size={16} /> : <FiChevronRight size={16} />}
      </button>

      {/* Logo (shown only in collapsed mode as icon) */}
      {isCollapsed && (
        <div className="sidebar__logo">
          <Logo variant="icon" size={28} />
        </div>
      )}

      {/* Navigation Items */}
      <nav className="sidebar__nav" data-testid="sidebar-nav">
        {visibleItems.map(item => {
          const Icon = item.icon;
          const active = isActive(item);
          const hasChildren = item.children && item.children.filter(isItemVisible).length > 0;
          const isExpanded = expandedGroups[item.id];

          return (
            <div key={item.id} className="sidebar__group">
              <button
                className={`sidebar__item ${active ? 'sidebar__item--active' : ''}`}
                onClick={() => handleItemClick(item)}
                data-testid={`sidebar-item-${item.id}`}
                title={isCollapsed ? item.label : undefined}
              >
                <span className="sidebar__item-icon">
                  <Icon size={18} />
                </span>
                <span className="sidebar__item-label">{item.label}</span>
                {hasChildren && !isCollapsed && (
                  <span
                    className={`sidebar__item-arrow ${isExpanded ? 'sidebar__item-arrow--open' : ''}`}
                    onClick={(e) => { e.stopPropagation(); toggleGroup(item.id); }}
                  >
                    <FiChevronLeft size={14} />
                  </span>
                )}
              </button>

              {/* Tooltip for collapsed mode */}
              {isCollapsed && (
                <div className="sidebar__tooltip">
                  <span className="sidebar__tooltip-text">{item.label}</span>
                  {hasChildren && (
                    <div className="sidebar__tooltip-children">
                      {item.children.filter(isItemVisible).map(child => {
                        const ChildIcon = child.icon;
                        return (
                          <button
                            key={child.id}
                            className={`sidebar__tooltip-child ${isChildActive(item, child) ? 'sidebar__tooltip-child--active' : ''}`}
                            onClick={() => handleChildClick(item, child)}
                            data-testid={`sidebar-child-${child.id}`}
                          >
                            <ChildIcon size={14} />
                            <span>{child.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Children (expanded mode) */}
              {hasChildren && !isCollapsed && (
                <div className={`sidebar__children ${isExpanded ? 'sidebar__children--open' : ''}`}>
                  {item.children.filter(isItemVisible).map(child => {
                    const ChildIcon = child.icon;
                    return (
                      <button
                        key={child.id}
                        className={`sidebar__child ${isChildActive(item, child) ? 'sidebar__child--active' : ''}`}
                        onClick={() => handleChildClick(item, child)}
                        data-testid={`sidebar-child-${child.id}`}
                      >
                        <span className="sidebar__child-icon">
                          <ChildIcon size={14} />
                        </span>
                        <span className="sidebar__child-label">{child.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
