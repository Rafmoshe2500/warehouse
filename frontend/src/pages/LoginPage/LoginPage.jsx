import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiUsers, FiServer, FiArrowRight } from 'react-icons/fi';
import LoginForm from '../../components/auth/LoginForm/LoginForm';
import authService from '../../api/services/authService';
import './LoginPage.css';

const LoginPage = () => {
  const [authMode, setAuthMode] = useState(null); // null = selection, 'local' = local form, 'domain' = domain
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, isAuthenticated, isAdmin, hasPermission } = useAuth();
  const navigate = useNavigate();

  const getRedirectPath = () => {
    // 1. Admins and Inventory Managers go to Dashboard
    if (isAdmin || hasPermission('inventory:ro') || hasPermission('inventory:rw')) {
      return '/inventory'; // Also covers users with BOTH inventory and procurement
    }
    
    // 2. Procurement ONLY users go to Procurement
    if (hasPermission('procurement:ro') || hasPermission('procurement:rw')) {
      return '/procurement';
    }

    // 3. Fallback
    return '/dashboard';
  };

  const handleLogin = async (username, password) => {
    setLoading(true);
    setError('');

    try {
      await login({ username, password }); 
      // Navigation will be handled by the useEffect below
    } catch (err) {
      setError(err.response?.data?.detail || 'שגיאה בהתחברות');
      setLoading(false);
    }
  };

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate(getRedirectPath());
    }
  }, [isAuthenticated, navigate]);

  const handleDomainLogin = async () => {
    // בלוגיקה החדשה, התחברות לדומיין מבוצעת על ידי הפניה לשרת (או ל-ADFS).
    // אם זו הדמיה ללא שרת אמיתי, הקוד הבא מדמה את התהליך:
    try {
        const hashToken = "simulation_token_123"; 
        // בחיים האמיתיים: window.location.href = 'YOUR_ADFS_URL';
        // בהדמיה: מרעננים את הדף עם הטוקן כאילו חזרנו מה-ADFS
        window.location.search = `?hashToken=${hashToken}`;
    } catch (error) {
       console.error("Domain login failed:", error);
       setError('התחברות דומיין נכשלה');
    }
  };

  const handleBack = () => {
    setAuthMode(null);
    setError('');
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

      {error && <div className="login-selection__error">{error}</div>}
    </div>
  );

  // Local Login Form with Back Button
  const renderLocalLogin = () => (
    <div className="login-local">
      <button className="login-local__back" onClick={handleBack}>
        <FiArrowRight />
        <span>חזרה</span>
      </button>
      <LoginForm onSubmit={handleLogin} loading={loading} error={error} />
    </div>
  );

  return (
    <div className="login-page">
      <div className="login-page__container">
        {authMode === null && renderAuthSelection()}
        {authMode === 'local' && renderLocalLogin()}
      </div>
    </div>
  );
};

export default LoginPage;
