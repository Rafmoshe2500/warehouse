import React, { useState, useEffect } from 'react';
import { Button, Input, Select } from '../common';
import PermissionSelector from './PermissionSelector';
import './GroupForm.css';

const GroupForm = ({ group, onSubmit, onCancel }) => {
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
        <div className="group-form-overlay">
            <div className="group-form">
                <h2>{group ? 'עריכת קבוצה' : 'הוספת קבוצה חדשה'}</h2>

                {error && <div className="group-form__error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="group-form__field">
                        <Input
                            label="שם קבוצה"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required={!group}
                            minLength={2}
                            placeholder="הכנס שם קבוצה"
                        />
                    </div>

                    {group && (
                        <div className="group-form__field group-form__field--checkbox">
                            <label>
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

                    <PermissionSelector
                        selectedPermissions={formData.permissions}
                        onChange={(newPermissions) => setFormData({ ...formData, permissions: newPermissions })}
                    />

                    <div className="group-form__actions">
                        <Button type="submit" variant="primary" disabled={loading}>
                            {loading ? 'שומר...' : group ? 'עדכון' : 'הוספה'}
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

export default GroupForm;
