import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiLogOut, FiUser, FiZap, FiSun, FiMoon, FiLayers } from 'react-icons/fi'; // Changed FiSettings to FiLayers or similar for theme
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import Button from '../../common/Button/Button';
import ThemeSelector from '../../layout/ThemeSelector/ThemeSelector';
import './Header.css';

const Header = ({ isLogin = false }) => {
  const { user, logout } = useAuth();
  const { mode, toggleMode } = useTheme();
  const navigate = useNavigate();
  const [showThemeSelector, setShowThemeSelector] = React.useState(false);
  const themeSelectorRef = React.useRef(null);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (themeSelectorRef.current && !themeSelectorRef.current.contains(event.target)) {
        setShowThemeSelector(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
          {/* Theme Selector Trigger */}
          <div className="header__theme-container" ref={themeSelectorRef}>
            <button
                className={`header__theme-btn ${showThemeSelector ? 'active' : ''}`}
                onClick={() => setShowThemeSelector(!showThemeSelector)}
                title="בחר ערכת נושא"
            >
                <FiLayers size={20} />
            </button>
            
            {showThemeSelector && (
                <div className="header__theme-dropdown">
                    <ThemeSelector />
                </div>
            )}
          </div>

          {/* Mode Toggle Button (Light/Dark) */}
          <button 
            className="header__theme-btn" 
            onClick={toggleMode}
            title={mode === 'dark' ? 'עבור למצב בהיר' : 'עבור למצב כהה'}
          >
            {mode === 'dark' ? <FiSun size={20} /> : <FiMoon size={20} />}
          </button>

          {!isLogin && (
            <>
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
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;