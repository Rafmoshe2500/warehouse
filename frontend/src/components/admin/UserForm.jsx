import React, { useState, useEffect } from 'react';
import { Button, Input, Select } from '../common';
import PermissionSelector from './PermissionSelector';
import './UserForm.css';

const USER_TYPE_OPTIONS = [
    { value: 'local', label: 'משתמש מקומי' },
    { value: 'ad', label: 'Active Directory' }
];

const UserForm = ({ user, onSubmit, onCancel, onDelete }) => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        user_type: 'ad',
        role: 'user',
        permissions: [],
        is_active: true,
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                username: user.username || '',
                password: '',
                user_type: user.user_type || 'local',
                role: user.role || 'user',
                permissions: user.permissions || [],
                is_active: user.is_active !== false,
            });
        } else {
            setFormData({
                username: '',
                password: '',
                user_type: 'ad',
                role: 'user',
                permissions: [],
                is_active: true,
            });
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    const handleSelectChange = (e) => {
        const { value } = e.target;
        // Specifically for Select component which passes event-like object but target might be different or standard event
        // The standard select change handler in React gives event with target.name and target.value
        setFormData({
            ...formData,
            user_type: value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const submitData = { ...formData };

            // Don't send empty password on edit or for AD users
            if ((user && !submitData.password) || submitData.user_type === 'ad') {
                delete submitData.password;
            }

            // Don't send username if not changed
            if (user && submitData.username === user.username) {
                delete submitData.username;
            }

            await onSubmit(submitData);
        } catch (err) {
            setError(err.response?.data?.detail || 'שגיאה בשמירת המשתמש');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="user-form">
                {error && <div className="user-form__error">{error}</div>}

                {user && (
                    <div className="readonly-info-grid">
                        <div className="readonly-info-item">
                            <span className="readonly-info-label">שם משתמש</span>
                            <span className="readonly-info-value">{user.username}</span>
                        </div>
                        <div className="readonly-info-item">
                            <span className="readonly-info-label">סוג משתמש</span>
                            <span className="readonly-info-value">
                                <span className={`status-badge ${user.user_type === 'ad' ? 'ad-user' : 'local-user'}`}>
                                    {user.user_type === 'ad' ? 'Active Directory' : 'מקומי'}
                                </span>
                            </span>
                        </div>
                        <div className="readonly-info-item">
                            <span className="readonly-info-label">סטטוס</span>
                            <span className="readonly-info-value">
                                <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                                    {user.is_active ? 'פעיל' : 'לא פעיל'}
                                </span>
                            </span>
                        </div>
                        <div className="readonly-info-item">
                            <span className="readonly-info-label">תפקיד במערכת</span>
                            <span className="readonly-info-value">
                                <span className={`role-badge role-${user.role || 'user'}`}>
                                    {user.role === 'superadmin' ? 'SuperAdmin' : (user.role === 'admin' ? 'Admin' : 'User')}
                                </span>
                            </span>
                        </div>
                        <div className="readonly-info-item">
                            <span className="readonly-info-label">תאריך יצירה</span>
                            <span className="readonly-info-value">{new Date(user.created_at).toLocaleDateString('he-IL')}</span>
                        </div>
                        <div className="readonly-info-item">
                            <span className="readonly-info-label">נוצר על ידי</span>
                            <span className="readonly-info-value">{user.created_by || 'מערכת'}</span>
                        </div>
                        {user.last_login && (
                            <div className="readonly-info-item">
                                <span className="readonly-info-label">התחברות אחרונה</span>
                                <span className="readonly-info-value">{new Date(user.last_login).toLocaleString('he-IL')}</span>
                            </div>
                        )}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                        {!user && (
                            <div className="form-row">
                                <Input
                                    label="שם משתמש"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    required={!user}
                                    minLength={3}
                                    placeholder="הכנס שם משתמש"
                                />

                                <Select
                                    label="סוג משתמש"
                                    name="user_type"
                                    value={formData.user_type}
                                    onChange={handleChange}
                                    options={USER_TYPE_OPTIONS}
                                    disabled={!!user}
                                />
                            </div>
                        )}

                        {/* Row 2: Password (full width, only for local users) */}
                        {formData.user_type === 'local' && (
                            <Input
                                label={`סיסמה ${user ? '(השאר ריק לשמירת הקיים)' : ''}`}
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required={!user && formData.user_type === 'local'}
                                minLength={4}
                                placeholder={user ? '••••••••' : 'הכנס סיסמה'}
                            />
                        )}

                        {/* Row 3: Permissions */}
                        <div style={{ marginTop: user ? '0.5rem' : '0' }}>
                           <PermissionSelector
                               selectedPermissions={formData.permissions}
                               onChange={(newPermissions) => setFormData({ ...formData, permissions: newPermissions })}
                           />
                        </div>

                        {/* Row 4: Active Status (only on edit) */}
                        {user && user.role !== 'superadmin' && (
                            <div className="form-checkboxes">
                                <label className="checkbox-label" style={{ fontWeight: '500' }}>
                                    <input
                                        type="checkbox"
                                        name="is_active"
                                        checked={formData.is_active}
                                        onChange={handleChange}
                                    />
                                   משתמש פעיל
                                </label>
                            </div>
                        )}
                    </div>

                    <div className="form-divider"></div>

                    <div className="user-form__actions" style={{ display: 'flex', justifyContent: onDelete ? 'space-between' : 'flex-end', width: '100%' }}>
                        {onDelete && (
                            <Button type="button" variant="danger" onClick={onDelete} disabled={loading}>
                                מחיקה
                            </Button>
                        )}
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
                                ביטול
                            </Button>
                            <Button type="submit" variant="primary" disabled={loading}>
                                {loading ? 'שומר...' : user ? 'עדכון' : 'הוספה'}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
    );
};

export default UserForm;
