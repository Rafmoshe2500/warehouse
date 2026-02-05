import React from 'react';
import './PermissionSelector.css';

const PermissionSelector = ({ selectedPermissions = [], onChange }) => {
    const handleToggle = (permissionId) => {
        if (selectedPermissions.includes(permissionId)) {
            onChange(selectedPermissions.filter(id => id !== permissionId));
        } else {
            onChange([...selectedPermissions, permissionId]);
        }
    };

    const groups = [
        {
            title: 'מלאי',
            permissions: [
                { id: 'inventory:ro', label: 'צפייה בלבד' },
                { id: 'inventory:rw', label: 'מלאה (צפייה + עריכה)' }
            ]
        },
        {
            title: 'רכש',
            permissions: [
                { id: 'procurement:ro', label: 'צפייה בלבד' },
                { id: 'procurement:rw', label: 'מלאה (צפייה + עריכה)' }
            ]
        },
        {
            title: 'מערכת',
            permissions: [
                { id: 'admin', label: 'אדמיניסטרטור' }
            ]
        }
    ];

    return (
        <div className="permission-selector">
            <label className="permission-selector__label">הרשאות מפורטות</label>
            <div className="permission-groups">
                {groups.map((group) => (
                    <div key={group.title} className="permission-group">
                        <div className="permission-group__header">{group.title}</div>
                        <div className="permission-group__options">
                            {group.permissions.map((perm) => (
                                <label key={perm.id} className={`permission-option ${selectedPermissions.includes(perm.id) ? 'active' : ''}`}>
                                    <input
                                        type="checkbox"
                                        checked={selectedPermissions.includes(perm.id)}
                                        onChange={() => handleToggle(perm.id)}
                                    />
                                    <span className="permission-option__label">{perm.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PermissionSelector;
