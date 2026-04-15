import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  FiLogOut, FiUser, FiZap, FiSun, FiMoon, FiLayers,
  FiPackage, FiShoppingCart, FiPieChart, FiUsers, FiHelpCircle, FiSearch, FiChevronDown
} from 'react-icons/fi';
import { FaBoxOpen } from 'react-icons/fa';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import ThemeSelector from '../ThemeSelector/ThemeSelector';
import './UnifiedHeader.css';

const UnifiedHeader = ({ onOpenSearch }) => {
  const { user, logout, isAdmin, hasPermission, hasProcurementAccess } = useAuth();
  const { mode, toggleMode } = useTheme();
  const navigate = useNavigate();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const userMenuRef = useRef(null);
  const themeSelectorRef = useRef(null);

  const handleLogout = async () => {
    setShowUserMenu(false);
    await logout();
    navigate('/login');
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (themeSelectorRef.current && !themeSelectorRef.current.contains(event.target)) {
        setShowThemeSelector(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Ctrl+K global search shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        onOpenSearch?.();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onOpenSearch]);

  return (
    <header className="unified-header">
      <div className="unified-header__container">
        {/* Logo */}
        <NavLink to="/dashboard" className="unified-header__logo">
          <div className="unified-header__logo-icon">
            <FiZap size={20} />
          </div>
          <span className="unified-header__logo-text">890W</span>
        </NavLink>

        {/* Navigation */}
        <nav className="unified-header__nav">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `unified-header__nav-link ${isActive ? 'unified-header__nav-link--active' : ''}`
            }
          >
            <FiPieChart size={16} />
            <span>דשבורד</span>
          </NavLink>

          {hasPermission('inventory:ro') && (
            <NavLink
              to="/inventory"
              className={({ isActive }) =>
                `unified-header__nav-link ${isActive ? 'unified-header__nav-link--active' : ''}`
              }
            >
              <FiPackage size={16} />
              <span>מלאי</span>
            </NavLink>
          )}

          <NavLink
            to="/my-components"
            className={({ isActive }) =>
              `unified-header__nav-link ${isActive ? 'unified-header__nav-link--active' : ''}`
            }
          >
            <FaBoxOpen size={16} />
            <span>המלאי שלי</span>
          </NavLink>

          {hasProcurementAccess() && (
            <NavLink
              to="/procurement"
              className={({ isActive }) =>
                `unified-header__nav-link ${isActive ? 'unified-header__nav-link--active' : ''}`
              }
            >
              <FiShoppingCart size={16} />
              <span>ניהול רכש</span>
            </NavLink>
          )}

          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `unified-header__nav-link ${isActive ? 'unified-header__nav-link--active' : ''}`
              }
            >
              <FiUsers size={16} />
              <span>ניהול</span>
            </NavLink>
          )}

          <NavLink
            to="/guide"
            className={({ isActive }) =>
              `unified-header__nav-link ${isActive ? 'unified-header__nav-link--active' : ''}`
            }
          >
            <FiHelpCircle size={16} />
            <span>מדריך</span>
          </NavLink>
        </nav>

        {/* Right Actions */}
        <div className="unified-header__actions">
          {/* Search Trigger */}
          <button
            className="unified-header__search-btn"
            onClick={onOpenSearch}
            title="חיפוש גלובלי (Ctrl+K)"
            aria-label="חיפוש גלובלי"
          >
            <FiSearch size={16} />
            <span className="unified-header__search-hint">Ctrl+K</span>
          </button>

          {/* User Menu */}
          <div className="unified-header__user-menu" ref={userMenuRef}>
            <button
              className="unified-header__user-btn"
              onClick={() => setShowUserMenu(!showUserMenu)}
              aria-label="תפריט משתמש"
              aria-expanded={showUserMenu}
            >
              <div className="unified-header__avatar">
                <FiUser size={14} />
              </div>
              <FiChevronDown size={14} className={`unified-header__chevron ${showUserMenu ? 'open' : ''}`} />
            </button>

            {showUserMenu && (
              <div className="unified-header__dropdown">
                <div className="unified-header__dropdown-header">
                  <div className="unified-header__dropdown-avatar">
                    <FiUser size={18} />
                  </div>
                  <div className="unified-header__dropdown-info">
                    <span className="unified-header__dropdown-name">{user?.username}</span>
                    <span className="unified-header__dropdown-role">{user?.role}</span>
                  </div>
                </div>

                <div className="unified-header__dropdown-divider" />

                {/* Theme Controls */}
                <div className="unified-header__dropdown-section">
                  <button
                    className="unified-header__dropdown-item"
                    onClick={toggleMode}
                  >
                    {mode === 'dark' ? <FiSun size={16} /> : <FiMoon size={16} />}
                    <span>{mode === 'dark' ? 'מצב בהיר' : 'מצב כהה'}</span>
                  </button>

                  <div className="unified-header__theme-row" ref={themeSelectorRef}>
                    <button
                      className="unified-header__dropdown-item"
                      onClick={() => setShowThemeSelector(!showThemeSelector)}
                    >
                      <FiLayers size={16} />
                      <span>ערכת נושא</span>
                      <FiChevronDown size={14} className={`unified-header__chevron-inline ${showThemeSelector ? 'open' : ''}`} />
                    </button>
                    {showThemeSelector && (
                      <div className="unified-header__theme-panel">
                        <ThemeSelector />
                      </div>
                    )}
                  </div>
                </div>

                <div className="unified-header__dropdown-divider" />

                <button
                  className="unified-header__dropdown-item unified-header__dropdown-item--danger"
                  onClick={handleLogout}
                >
                  <FiLogOut size={16} />
                  <span>יציאה</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default UnifiedHeader;
