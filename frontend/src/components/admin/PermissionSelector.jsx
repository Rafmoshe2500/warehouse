import React from 'react';
import './PermissionSelector.css';

const PERMISSION_GROUPS = [
  {
    id: 'inventory',
    label: 'מלאי',
    color: '#3b82f6',
    permissions: [
      { id: 'inventory:ro', label: 'קריאה' },
      { id: 'inventory:rw', label: 'קריאה/כתיבה' },
    ],
  },
  {
    id: 'procurement',
    label: 'רכש',
    color: '#10b981',
    permissions: [
      { id: 'procurement:ro', label: 'קריאה' },
      { id: 'procurement:rw', label: 'קריאה/כתיבה' },
    ],
  },
  {
    id: 'system',
    label: 'מערכת',
    color: '#8b5cf6',
    permissions: [
      { id: 'admin', label: 'אדמין' },
    ],
  },
];

const PermissionSelector = ({ selectedPermissions = [], onChange }) => {
  const toggle = (id) => {
    if (selectedPermissions.includes(id)) {
      onChange(selectedPermissions.filter(p => p !== id));
    } else {
      onChange([...selectedPermissions, id]);
    }
  };

  return (
    <div className="ps-root">
      {PERMISSION_GROUPS.map(group => (
        <div key={group.id} className="ps-group">
          <span className="ps-group-label" style={{ color: group.color }}>{group.label}</span>
          <div className="ps-chips">
            {group.permissions.map(perm => {
              const active = selectedPermissions.includes(perm.id);
              return (
                <button
                  key={perm.id}
                  type="button"
                  className={`ps-chip ${active ? 'active' : ''}`}
                  style={active ? { borderColor: group.color, background: `${group.color}20`, color: group.color } : {}}
                  onClick={() => toggle(perm.id)}
                >
                  <span className="ps-chip-dot" style={active ? { background: group.color } : {}} />
                  {perm.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PermissionSelector;
