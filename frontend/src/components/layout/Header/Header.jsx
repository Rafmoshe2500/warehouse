import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiLogOut, FiUser, FiZap, FiSun, FiMoon } from 'react-icons/fi';
import { useAuth } from '../../../context/AuthContext';
import Button from '../../common/Button/Button';
import './Header.css';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // State for theme
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  // Apply theme effect
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="header__glow"></div>
      <div className="header__container">
        <div className="header__logo">
          <div className="header__logo-icon">
            <FiZap size={28} />
          </div>
          <div className="header__logo-text">
            <h1>890Warehouse</h1>
            <span className="header__logo-subtitle">Next-Gen Warehouse Management</span>
          </div>
        </div>

        <div className="header__actions">
          {/* Theme Toggle Button */}
          <button 
            className="header__theme-btn" 
            onClick={toggleTheme}
            title={theme === 'dark' ? 'עבור למצב בהיר' : 'עבור למצב כהה'}
          >
            {theme === 'dark' ? <FiSun size={20} /> : <FiMoon size={20} />}
          </button>

          <div className="header__user">
            <div className="header__user-avatar">
              <FiUser size={16} />
            </div>
            <span className="header__user-name">{user?.username}</span>
          </div>
          <Button
            variant="outline"
            size="small"
            icon={<FiLogOut />}
            onClick={handleLogout}
            className="header__logout-btn"
          >
            יציאה
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;