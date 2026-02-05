import React, { useState, useEffect } from 'react';
import { Button } from '../common';
import PermissionSelector from './PermissionSelector';
import './UserForm.css';

const UserForm = ({ user, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const submitData = { ...formData };

            // Don't send empty password on edit
            if (user && !submitData.password) {
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
        <div className="user-form-overlay">
            <div className="user-form">
                <h2>{user ? 'עריכת משתמש' : 'הוספת משתמש חדש'}</h2>

                {error && <div className="user-form__error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="user-form__field">
                        <label htmlFor="username">שם משתמש</label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            required={!user}
                            minLength={3}
                            placeholder="הכנס שם משתמש"
                        />
                    </div>

                    <div className="user-form__field">
                        <label htmlFor="password">
                            סיסמה {user && '(השאר ריק לשמירת הסיסמה הנוכחית)'}
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required={!user}
                            minLength={4}
                            placeholder={user ? '••••••••' : 'הכנס סיסמה'}
                        />
                    </div>

                    <PermissionSelector
                        selectedPermissions={formData.permissions}
                        onChange={(newPermissions) => setFormData({ ...formData, permissions: newPermissions })}
                    />

                    {user && (
                        <div className="user-form__field user-form__field--checkbox">
                            <label>
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

                    <div className="user-form__actions">
                        <Button type="submit" variant="primary" disabled={loading}>
                            {loading ? 'שומר...' : user ? 'עדכון' : 'הוספה'}
                        </Button>
                        <Button type="button" variant="secondary" onClick={onCancel}>
                            ביטול
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserForm;
