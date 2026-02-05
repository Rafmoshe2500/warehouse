import React, { useState } from 'react';
import { FiUser, FiLock } from 'react-icons/fi';
import Button from '../../common/Button/Button';
import './LoginForm.css';

const LoginForm = ({ onSubmit, loading, error }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username && password) {
      onSubmit(username, password);
    }
  };

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <div className="login-form__header">
        <h1>מערכת ניהול מלאי</h1>
        <p>התחבר כדי להמשיך</p>
      </div>

      {error && <div className="login-form__error">{error}</div>}

      <div className="login-form__fields">
        <div className="login-form__field">
          <label className="login-form__label">שם משתמש</label>
          <div className="login-form__input-wrapper">
            <FiUser className="login-form__icon" />
            <input
              type="text"
              placeholder="הזן שם משתמש"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="login-form__input"
              required
              disabled={loading}
            />
          </div>
        </div>

        <div className="login-form__field">
          <label className="login-form__label">סיסמה</label>
          <div className="login-form__input-wrapper">
            <FiLock className="login-form__icon" />
            <input
              type="password"
              placeholder="הזן סיסמה"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="login-form__input"
              required
              disabled={loading}
            />
          </div>
        </div>
      </div>

      <Button
        type="submit"
        variant="primary"
        size="large"
        loading={loading}
        disabled={loading || !username || !password}
        className="login-form__submit"
      >
        התחבר
      </Button>
    </form>
  );
};

export default LoginForm;
