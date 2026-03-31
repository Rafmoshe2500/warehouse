import React, { useState, useEffect } from 'react';
import { Button, Input, Select } from '../common';
import PermissionSelector from './PermissionSelector';
import './UserForm.css';

const USER_TYPE_OPTIONS = [
  { value: 'local', label: 'מקומי' },
  { value: 'ad',    label: 'Active Directory' },
];

const ROLE_OPTIONS = [
  { value: 'user',  label: 'User' },
  { value: 'admin', label: 'Admin' },
];

const ROLE_META = {
  superadmin: { label: 'SuperAdmin', cls: 'superadmin' },
  admin:      { label: 'Admin',      cls: 'admin' },
  user:       { label: 'User',       cls: 'user' },
};

const avatarColors = [
  'linear-gradient(135deg,#3b82f6,#8b5cf6)',
  'linear-gradient(135deg,#10b981,#3b82f6)',
  'linear-gradient(135deg,#f59e0b,#ef4444)',
  'linear-gradient(135deg,#8b5cf6,#ec4899)',
  'linear-gradient(135deg,#06b6d4,#3b82f6)',
];
const getAvatarColor = (name = '') =>
  avatarColors[name.charCodeAt(0) % avatarColors.length];

const UserForm = ({ user, onSubmit, onCancel, onDelete }) => {
  const [formData, setFormData] = useState({
    username: '', password: '', user_type: 'ad',
    role: 'user', permissions: [], is_active: true,
  });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        username:    user.username    || '',
        password:    '',
        user_type:   user.user_type   || 'local',
        role:        user.role        || 'user',
        permissions: user.permissions || [],
        is_active:   user.is_active   !== false,
      });
    } else {
      setFormData({ username: '', password: '', user_type: 'ad', role: 'user', permissions: [], is_active: true });
    }
    setError('');
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const submitData = { ...formData };
      if ((user && !submitData.password) || submitData.user_type === 'ad') delete submitData.password;
      if (user && submitData.username === user.username) delete submitData.username;
      await onSubmit(submitData);
    } catch (err) {
      setError(err.response?.data?.detail || 'שגיאה בשמירת המשתמש');
    } finally {
      setLoading(false);
    }
  };

  const roleMeta = ROLE_META[user?.role] || ROLE_META.user;

  return (
    <form className="uf-root" onSubmit={handleSubmit}>

      {/* ── Slim header ──────────────────────────────── */}
      <div className="uf-header">
        <div
          className="uf-avatar"
          style={{ background: user ? getAvatarColor(user.username) : 'linear-gradient(135deg,#3b82f6,#8b5cf6)' }}
        >
          {user ? user.username.charAt(0).toUpperCase() : '+'}
        </div>
        <div className="uf-header-info">
          <span className="uf-header-name">{user ? user.username : 'משתמש חדש'}</span>
          <div className="uf-header-badges">
            {user && <span className={`um-badge ${roleMeta.cls}`}>{roleMeta.label}</span>}
            {user && (
              <span className={`um-badge ${user.is_active ? 'active-badge' : 'inactive-badge'}`}>
                {user.is_active ? 'פעיל' : 'לא פעיל'}
              </span>
            )}
            {user?.user_type === 'ad' && (
              <span className="um-badge" style={{ background: 'rgba(139,92,246,0.15)', color: '#8b5cf6' }}>AD</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Error ────────────────────────────────────── */}
      {error && <div className="uf-error">{error}</div>}

      {/* ── Body: two columns ────────────────────────── */}
      <div className="uf-body">

        {/* LEFT column: meta info + editable fields */}
        <div className="uf-col-left">

          {/* Readonly meta (edit mode) */}
          {user && (
            <div className="uf-meta-grid">
              <div className="uf-meta-item">
                <span className="uf-meta-label">שם משתמש</span>
                <span className="uf-meta-value">{user.username}</span>
              </div>
              <div className="uf-meta-item">
                <span className="uf-meta-label">סוג</span>
                <span className="uf-meta-value">{user.user_type === 'ad' ? 'Active Directory' : 'מקומי'}</span>
              </div>
              <div className="uf-meta-item">
                <span className="uf-meta-label">נוצר</span>
                <span className="uf-meta-value">{new Date(user.created_at).toLocaleDateString('he-IL')}</span>
              </div>
              <div className="uf-meta-item">
                <span className="uf-meta-label">נוצר ע"י</span>
                <span className="uf-meta-value">{user.created_by || 'מערכת'}</span>
              </div>
              {user.last_login && (
                <div className="uf-meta-item" style={{ gridColumn: '1/-1' }}>
                  <span className="uf-meta-label">כניסה אחרונה</span>
                  <span className="uf-meta-value">{new Date(user.last_login).toLocaleString('he-IL')}</span>
                </div>
              )}
            </div>
          )}

          {/* Editable fields */}
          <div className="uf-fields">
            {/* New user: username + type */}
            {!user && (
              <div className="uf-field-row">
                <Input label="שם משתמש" name="username" value={formData.username}
                  onChange={handleChange} required minLength={3} placeholder="שם משתמש" />
                <Select label="סוג" name="user_type" value={formData.user_type}
                  onChange={handleChange} options={USER_TYPE_OPTIONS} />
              </div>
            )}

            {/* Password (new local user OR reset for local existing user) */}
            {formData.user_type === 'local' && (
              <Input
                label={user ? 'סיסמה חדשה (ריק = ללא שינוי)' : 'סיסמה'}
                type="password" name="password" value={formData.password}
                onChange={handleChange} required={!user} minLength={4}
                placeholder={user ? '••••••••' : 'הכנס סיסמה'}
              />
            )}

            {/* Role selector (edit, non-superadmin) */}
            {user && user.role !== 'superadmin' && (
              <div className="uf-field-row">
                <Select label="תפקיד" name="role" value={formData.role}
                  onChange={handleChange} options={ROLE_OPTIONS} />
                <label className="uf-toggle-wrap">
                  <span className="uf-meta-label">סטטוס</span>
                  <label className={`uf-toggle ${formData.is_active ? 'is-active' : ''}`}>
                    <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} />
                    <span className="uf-toggle-track" />
                    <span className="uf-toggle-label">{formData.is_active ? 'פעיל' : 'לא פעיל'}</span>
                  </label>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT column: permissions */}
        <div className="uf-col-right">
          <span className="uf-section-label">הרשאות</span>
          <PermissionSelector
            selectedPermissions={formData.permissions}
            onChange={(p) => setFormData(prev => ({ ...prev, permissions: p }))}
          />
        </div>
      </div>

      {/* ── Action bar ───────────────────────────────── */}
      <div className="uf-actions">
        <div>
          {onDelete && (
            <Button type="button" variant="danger" onClick={onDelete} disabled={loading}>מחיקה</Button>
          )}
        </div>
        <div className="uf-actions-right">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>ביטול</Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'שומר...' : user ? 'עדכון' : 'הוספה'}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default UserForm;
