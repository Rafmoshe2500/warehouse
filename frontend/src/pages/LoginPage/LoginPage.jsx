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
  const { login, domainLogin, isAuthenticated, isAdmin, hasPermission } = useAuth();
  const navigate = useNavigate();

  const getRedirectPath = () => {
    // If user has ONLY procurement permissions (no admin, no inventory), go to procurement
    const hasInventory = hasPermission('inventory:ro') || hasPermission('inventory:rw');
    const hasProcurement = hasPermission('procurement:ro') || hasPermission('procurement:rw');
    
    if (!isAdmin && !hasInventory && hasProcurement) {
      return '/procurement';
    }
    
    // Default to dashboard for everyone else
    return '/dashboard';
  };

  const handleLogin = async (username, password) => {
    setLoading(true);
    setError('');

    try {
      await login(username, password); 
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
    try {
      // TODO: שילוב ספריית ADFS
      // 1. קריאה לספרייה שלך שמבצעת Redirect ל-ADFS
      // 2. קבלת הטוקן וחילוץ שם המשתמש
      
      const adfsUsername = "user_from_adfs_placeholder"; // החלף משתנה זה בערך האמיתי מהספרייה (למשל מהטוקן)
      
      console.log("Starting domain login for:", adfsUsername);

      if (!adfsUsername) {
          setError("נכשל בחילוץ משתמש מה-ADFS");
          return;
      }

      await domainLogin(adfsUsername); // שימוש בפונקציה מה-Context
      // Redirect will be handled by useEffect
    } catch (error) {
       console.error("Domain login failed:", error);
       setError('התחברות דומיין נכשלה: ' + (error.response?.data?.detail || error.message));
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
