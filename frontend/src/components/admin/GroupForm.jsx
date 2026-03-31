import React, { useState, useEffect } from 'react';
import { Button, Input } from '../common';
import PermissionSelector from './PermissionSelector';
import './UserForm.css';

const groupColors = [
  'linear-gradient(135deg,#8b5cf6,#3b82f6)',
  'linear-gradient(135deg,#10b981,#8b5cf6)',
  'linear-gradient(135deg,#f59e0b,#10b981)',
  'linear-gradient(135deg,#3b82f6,#06b6d4)',
];
const getGroupColor = (name = '') =>
  groupColors[name.charCodeAt(0) % groupColors.length];

const GroupForm = ({ group, onSubmit, onCancel, onDelete }) => {
  const [formData, setFormData] = useState({
    name: '', role: 'user', permissions: [], is_active: true,
  });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (group) {
      setFormData({
        name:        group.name        || '',
        role:        group.role        || 'user',
        permissions: group.permissions || [],
        is_active:   group.is_active   !== false,
      });
    } else {
      setFormData({ name: '', role: 'user', permissions: [], is_active: true });
    }
    setError('');
  }, [group]);

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
      if (group && submitData.name === group.name) delete submitData.name;
      await onSubmit(submitData);
    } catch (err) {
      setError(err.response?.data?.detail || 'שגיאה בשמירת הקבוצה');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="uf-root" onSubmit={handleSubmit}>

      {/* ── Slim header ───────────────────────────────── */}
      <div className="uf-header">
        <div
          className="uf-avatar"
          style={{
            borderRadius: '10px',
            background: group ? getGroupColor(group.name) : 'linear-gradient(135deg,#8b5cf6,#3b82f6)',
          }}
        >
          {group ? group.name.charAt(0).toUpperCase() : '+'}
        </div>
        <div className="uf-header-info">
          <span className="uf-header-name">{group ? group.name : 'קבוצה חדשה'}</span>
          <div className="uf-header-badges">
            {group && (
              <span className={`um-badge ${group.role === 'admin' ? 'admin' : 'user'}`}>
                {group.role === 'admin' ? 'Admin' : 'User'}
              </span>
            )}
            {group && (
              <span className={`um-badge ${group.is_active ? 'active-badge' : 'inactive-badge'}`}>
                {group.is_active ? 'פעילה' : 'לא פעילה'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Error ─────────────────────────────────────── */}
      {error && <div className="uf-error">{error}</div>}

      {/* ── Body: two columns ─────────────────────────── */}
      <div className="uf-body">

        {/* Left: meta + editable fields */}
        <div className="uf-col-left">
          {group && (
            <div className="uf-meta-grid">
              <div className="uf-meta-item">
                <span className="uf-meta-label">שם קבוצה</span>
                <span className="uf-meta-value">{group.name}</span>
              </div>
              <div className="uf-meta-item">
                <span className="uf-meta-label">תאריך יצירה</span>
                <span className="uf-meta-value">{new Date(group.created_at).toLocaleDateString('he-IL')}</span>
              </div>
              <div className="uf-meta-item" style={{ gridColumn: '1/-1' }}>
                <span className="uf-meta-label">תפקיד מערכת</span>
                <span className="uf-meta-value">{group.role === 'admin' ? 'מנהל' : 'משתמש'}</span>
              </div>
            </div>
          )}

          <div className="uf-fields">
            {!group && (
              <Input
                label="שם קבוצה" name="name" value={formData.name}
                onChange={handleChange} required minLength={2} placeholder="שם קבוצה"
              />
            )}

            {group && (
              <div className="uf-field-row">
                <label className="uf-toggle-wrap">
                  <span className="uf-meta-label">סטטוס</span>
                  <label className={`uf-toggle ${formData.is_active ? 'is-active' : ''}`}>
                    <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} />
                    <span className="uf-toggle-track" />
                    <span className="uf-toggle-label">{formData.is_active ? 'פעילה' : 'לא פעילה'}</span>
                  </label>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Right: permissions */}
        <div className="uf-col-right">
          <span className="uf-section-label">הרשאות</span>
          <PermissionSelector
            selectedPermissions={formData.permissions}
            onChange={(p) => setFormData(prev => ({ ...prev, permissions: p }))}
          />
        </div>
      </div>

      {/* ── Action bar ────────────────────────────────── */}
      <div className="uf-actions">
        <div>
          {onDelete && (
            <Button type="button" variant="danger" onClick={onDelete} disabled={loading}>מחיקה</Button>
          )}
        </div>
        <div className="uf-actions-right">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>ביטול</Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'שומר...' : group ? 'עדכון' : 'הוספה'}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default GroupForm;
