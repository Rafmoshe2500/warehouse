import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiUsers, FiServer, FiArrowRight } from 'react-icons/fi';
import LoginForm from '../../components/auth/LoginForm/LoginForm';
import { useToast } from '../../hooks/useToast';
import ToastContainer from '../../components/common/Toast/ToastContainer';
import { useTheme } from '../../context/ThemeContext';
import ThemeSelector from '../../components/layout/ThemeSelector/ThemeSelector';
import Logo from '../../components/layout/Logo/Logo';
import { FiLayers, FiSun, FiMoon } from 'react-icons/fi';
import './LoginPage.css';


const LoginPage = () => {
  const [authMode, setAuthMode] = useState(null);
  const [loading, setLoading] = useState(false);
  const { mode, toggleMode } = useTheme();
  const [showThemeSelector, setShowThemeSelector] = React.useState(false);
  const themeSelectorRef = React.useRef(null);

  // Close theme dropdown on outside click
  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (themeSelectorRef.current && !themeSelectorRef.current.contains(e.target)) {
        setShowThemeSelector(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const { toasts, removeToast, error: toastError } = useToast();
  const { login, isAuthenticated, isAdmin, hasPermission } = useAuth();
  const navigate = useNavigate();

  const getRedirectPath = React.useCallback(() => {
    if (isAdmin || hasPermission('inventory:ro') || hasPermission('inventory:rw')) {
      return '/inventory';
    }
    
    if (hasPermission('procurement:ro') || hasPermission('procurement:rw')) {
      return '/procurement';
    }

    return '/dashboard';
  }, [isAdmin, hasPermission]);

  const handleLogin = async (username, password) => {
    setLoading(true);

    try {
      await login({ username, password }); 
    } catch (err) {
      toastError(err.response?.data?.detail || 'שגיאה בהתחברות');
      setLoading(false);
    }
  };

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate(getRedirectPath());
    }
  }, [isAuthenticated, navigate, getRedirectPath]);

  const handleDomainLogin = async () => {
    // בלוגיקה החדשה, התחברות לדומיין מבוצעת על ידי הפניה לשרת (או ל-ADFS).
    // אם זו הדמיה ללא שרת אמיתי, הקוד הבא מדמה את התהליך:
    try {
        const hashedToken = "simulation_token_123"; 
        // בחיים האמיתיים: window.location.href = 'YOUR_ADFS_URL';
        // בהדמיה: מרעננים את הדף עם הטוקן כאילו חזרנו מה-ADFS
        window.location.search = `?hashedToken=${hashedToken}`;
    } catch (error) {
       console.error("Domain login failed:", error);
       toastError('התחברות דומיין נכשלה');
    }
  };

  const handleBack = () => {
    setAuthMode(null);
  };

  // Auth Selection Screen
  const renderAuthSelection = () => (
    <div className="login-selection">
      <div className="login-selection__header">
        <div className="login-selection__logo">
          <FiServer size={48} />
        </div>
        <h1>מערכת ניהול מלאי</h1>
        <p>בחר אופן התחברות</p>
      </div>

      <div className="login-selection__options">
        <button
          className="login-selection__option login-selection__option--local"
          onClick={() => setAuthMode('local')}
          data-testid="local-login-button"
        >
          <div className="login-selection__option-icon">
            <FiUsers size={32} />
          </div>
          <div className="login-selection__option-content">
            <h3>התחברות מקומית</h3>
            <p>התחבר עם שם משתמש וסיסמה מקומיים</p>
          </div>
          <FiArrowRight className="login-selection__option-arrow" />
        </button>

        <button
          className="login-selection__option login-selection__option--domain"
          onClick={handleDomainLogin}
          data-testid="domain-login-button"
        >
          <div className="login-selection__option-icon">
            <FiServer size={32} />
          </div>
          <div className="login-selection__option-content">
            <h3>התחברות דומיינית</h3>
            <p>התחבר דרך Active Directory</p>
          </div>
          <FiArrowRight className="login-selection__option-arrow" />
        </button>
      </div>

      {/* {error && <div className="login-selection__error">{error}</div>} - Replaced by Toast */}
    </div>
  );

  // Local Login Form with Back Button
  const renderLocalLogin = () => (
    <div className="login-local">
      <button className="login-local__back" onClick={handleBack}>
        <FiArrowRight />
        <span>חזרה</span>
      </button>
      <LoginForm onSubmit={handleLogin} loading={loading} />
    </div>
  );

  return (
    <div className="login-page">
      <header className="login-page__header">
        <div className="login-page__header-logo">
          <Logo variant="full" />
        </div>
        <div className="login-page__header-actions">
          <div className="login-page__theme-container" ref={themeSelectorRef}>
            <button
              className={`login-page__theme-btn ${showThemeSelector ? 'active' : ''}`}
              onClick={() => setShowThemeSelector(!showThemeSelector)}
              title="בחר ערכת נושא"
            >
              <FiLayers size={20} />
            </button>
            {showThemeSelector && (
              <div className="login-page__theme-dropdown">
                <ThemeSelector />
              </div>
            )}
          </div>
          <button
            className="login-page__theme-btn"
            onClick={toggleMode}
            title={mode === 'dark' ? 'עבור למצב בהיר' : 'עבור למצב כהה'}
          >
            {mode === 'dark' ? <FiSun size={20} /> : <FiMoon size={20} />}
          </button>
        </div>
      </header>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <div className="login-page__container">
        {authMode === null && renderAuthSelection()}
        {authMode === 'local' && renderLocalLogin()}
      </div>
    </div>
  );
};

export default LoginPage;
