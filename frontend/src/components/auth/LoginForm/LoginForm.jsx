import React, { useState } from 'react';
import { FiUser, FiLock } from 'react-icons/fi';
import Button from '../../common/Button/Button';
import Input from '../../common/Input/Input';
import './LoginForm.css';

const LoginForm = ({ onSubmit, loading }) => {
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

      <div className="login-form__fields">
        <Input
          label="שם משתמש"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="הזן שם משתמש"
          type="text"
          icon={<FiUser />}
          required
          disabled={loading}
          data-testid="username-input"
        />

        <Input
          label="סיסמה"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="הזן סיסמה"
          type="password"
          icon={<FiLock />}
          required
          disabled={loading}
          data-testid="password-input"
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        size="large"
        loading={loading}
        disabled={loading || !username || !password}
        className="login-form__submit"
        data-testid="login-submit-button"
      >
        התחבר
      </Button>
    </form>
  );
};

export default LoginForm;
