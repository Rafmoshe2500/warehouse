import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { FiLogOut, FiUser, FiSun, FiMoon, FiLayers, FiSearch, FiChevronDown } from 'react-icons/fi';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { useCart } from '../../../context/CartContext';
import ThemeSelector from '../ThemeSelector/ThemeSelector';
import Logo from '../Logo/Logo';
import navigationConfig from '../../../config/navigationConfig';
import CartIcon from '../../cart/CartIcon/CartIcon';
import CartModal from '../../cart/CartModal/CartModal';
import './TopBar.css';

const getPageTitle = (pathname) => {
  for (const item of navigationConfig) {
    if (item.children) {
      for (const child of item.children) {
        if (child.path && pathname === child.path) return child.label;
      }
    }
    if (item.path === pathname) return item.label;
  }
  for (const item of navigationConfig) {
    if (item.path !== '/' && pathname.startsWith(item.path)) return item.label;
  }
  return '';
};

const TopBar = ({ onOpenSearch }) => {
  const { user, logout } = useAuth();
  const { mode, toggleMode } = useTheme();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const pageTitle = getPageTitle(location.pathname);

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);
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
    <>
    <header className="topbar" data-testid="topbar">
      <div className="topbar__container">
        {/* Logo */}
        <NavLink to="/dashboard" className="topbar__logo-link">
          <Logo variant="full" size={28} />
        </NavLink>

        {/* Page Title */}
        {pageTitle && (
          <div className="topbar__page-title" aria-label="עמוד נוכחי">
            <span className="topbar__page-title-text">{pageTitle}</span>
          </div>
        )}

        {/* Right Actions */}
        <div className="topbar__actions">
          {/* Cart Icon */}
          <CartIcon count={cartCount} onClick={() => setShowCartModal(true)} />

          {/* Search Trigger */}
          <button
            className="topbar__search-btn"
            onClick={onOpenSearch}
            title="חיפוש גלובלי (Ctrl+K)"
            aria-label="חיפוש גלובלי"
          >
            <FiSearch size={16} />
            <span className="topbar__search-hint">Ctrl+K</span>
          </button>

          {/* User Menu */}
          <div className="topbar__user-menu" ref={userMenuRef}>
            <button
              className="topbar__user-btn"
              onClick={() => setShowUserMenu(!showUserMenu)}
              aria-label="תפריט משתמש"
              aria-expanded={showUserMenu}
              data-testid="user-menu-btn"
            >
              <div className="topbar__avatar">
                <FiUser size={14} />
              </div>
              <span className="topbar__username">{user?.username}</span>
              <FiChevronDown size={14} className={`topbar__chevron ${showUserMenu ? 'open' : ''}`} />
            </button>

            {showUserMenu && (
              <div className="topbar__dropdown" data-testid="user-dropdown">
                <div className="topbar__dropdown-header">
                  <div className="topbar__dropdown-avatar">
                    <FiUser size={18} />
                  </div>
                  <div className="topbar__dropdown-info">
                    <span className="topbar__dropdown-name">{user?.username}</span>
                    <span className="topbar__dropdown-role">{user?.role}</span>
                  </div>
                </div>

                <div className="topbar__dropdown-divider" />

                {/* Theme Controls */}
                <div className="topbar__dropdown-section">
                  <button className="topbar__dropdown-item" onClick={toggleMode}>
                    {mode === 'dark' ? <FiSun size={16} /> : <FiMoon size={16} />}
                    <span>{mode === 'dark' ? 'מצב בהיר' : 'מצב כהה'}</span>
                  </button>

                  <div className="topbar__theme-row" ref={themeSelectorRef}>
                    <button
                      className="topbar__dropdown-item"
                      onClick={() => setShowThemeSelector(!showThemeSelector)}
                    >
                      <FiLayers size={16} />
                      <span>ערכת נושא</span>
                      <FiChevronDown size={14} className={`topbar__chevron-inline ${showThemeSelector ? 'open' : ''}`} />
                    </button>
                    {showThemeSelector && (
                      <div className="topbar__theme-panel">
                        <ThemeSelector />
                      </div>
                    )}
                  </div>
                </div>

                <div className="topbar__dropdown-divider" />

                <button
                  className="topbar__dropdown-item topbar__dropdown-item--danger"
                  onClick={handleLogout}
                  data-testid="logout-button"
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

    {showCartModal && (
      <CartModal onClose={() => setShowCartModal(false)} />
    )}
  </>
  );
};

export default TopBar;
