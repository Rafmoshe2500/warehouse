import React, { useState, useEffect } from 'react';
import { Button, Input, Select } from '../common';
import PermissionSelector from './PermissionSelector';
import './UserForm.css';

const USER_TYPE_OPTIONS = [
    { value: 'local', label: 'משתמש מקומי' },
    { value: 'ad', label: 'Active Directory' }
];

const UserForm = ({ user, onSubmit, onCancel }) => {
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
        <div className="user-form-overlay" onClick={onCancel}>
            <div className="user-form" onClick={e => e.stopPropagation()}>
                <h2>{user ? 'עריכת משתמש' : 'הוספת משתמש חדש'}</h2>

                {error && <div className="user-form__error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-grid">
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

                        {formData.user_type === 'local' && (
                            <div className="full-width">
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
                            </div>
                        )}

                        <div className="full-width">
                            <PermissionSelector
                                selectedPermissions={formData.permissions}
                                onChange={(newPermissions) => setFormData({ ...formData, permissions: newPermissions })}
                            />
                        </div>

                        {user && (
                            <div className="form-checkboxes">
                                <label className="checkbox-label">
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

                    <div className="user-form__actions">
                        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
                            ביטול
                        </Button>
                        <Button type="submit" variant="primary" disabled={loading}>
                            {loading ? 'שומר...' : user ? 'עדכון' : 'הוספה'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserForm;
