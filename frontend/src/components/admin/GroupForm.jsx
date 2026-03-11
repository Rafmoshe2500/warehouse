import React, { useState, useEffect } from 'react';
import { Button, Input } from '../common';
import PermissionSelector from './PermissionSelector';
import './GroupForm.css';

const GroupForm = ({ group, onSubmit, onCancel, onDelete }) => {
    const [formData, setFormData] = useState({
        name: '',
        role: 'user',
        permissions: [],
        is_active: true,
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (group) {
            setFormData({
                name: group.name || '',
                role: group.role || 'user',
                permissions: group.permissions || [],
                is_active: group.is_active !== false,
            });
        } else {
            setFormData({
                name: '',
                role: 'user',
                permissions: [],
                is_active: true,
            });
        }
    }, [group]);

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

            // Don't send name if not changed on edit
            if (group && submitData.name === group.name) {
                delete submitData.name;
            }

            await onSubmit(submitData);
        } catch (err) {
            setError(err.response?.data?.detail || 'שגיאה בשמירת הקבוצה');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="group-form">
                {error && <div className="group-form__error">{error}</div>}

                {group && (
                    <div className="readonly-info-grid">
                        <div className="readonly-info-item">
                            <span className="readonly-info-label">שם קבוצה</span>
                            <span className="readonly-info-value">{group.name}</span>
                        </div>
                        <div className="readonly-info-item">
                            <span className="readonly-info-label">סטטוס</span>
                            <span className="readonly-info-value">
                                <span className={`status-badge ${group.is_active ? 'active' : 'inactive'}`}>
                                    {group.is_active ? 'פעילה' : 'לא פעילה'}
                                </span>
                            </span>
                        </div>
                        <div className="readonly-info-item">
                            <span className="readonly-info-label">תפקיד מערכת</span>
                            <span className="readonly-info-value">
                                <span className={`role-badge role-${group.role || 'user'}`}>
                                    {group.role === 'admin' ? 'מנהל' : 'משתמש'}
                                </span>
                            </span>
                        </div>
                        <div className="readonly-info-item">
                            <span className="readonly-info-label">תאריך יצירה</span>
                            <span className="readonly-info-value">{new Date(group.created_at).toLocaleDateString('he-IL')}</span>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                        {!group && (
                            <Input
                                label="שם קבוצה"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required={!group}
                                minLength={2}
                                placeholder="הכנס שם קבוצה"
                            />
                        )}
                        
                        <div className="full-width" style={{ marginTop: group ? '0.5rem' : '0' }}>
                            <PermissionSelector
                                selectedPermissions={formData.permissions}
                                onChange={(newPermissions) => setFormData({ ...formData, permissions: newPermissions })}
                            />
                        </div>

                        {group && (
                            <div className="form-checkboxes">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        name="is_active"
                                        checked={formData.is_active}
                                        onChange={handleChange}
                                    />
                                    קבוצה פעילה
                                </label>
                            </div>
                        )}
                    </div>

                    <div className="group-form__actions" style={{ display: 'flex', justifyContent: onDelete ? 'space-between' : 'flex-end', width: '100%' }}>
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
                                {loading ? 'שומר...' : group ? 'עדכון' : 'הוספה'}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
    );
};

export default GroupForm;
