import React, { useState } from 'react';
import { FiPlus, FiUsers, FiSearch } from 'react-icons/fi';
import { Button } from '../../components/common';
import { useToast } from '../../hooks/useToast';
import ToastContainer from '../../components/common/Toast/ToastContainer';
import GroupForm from '../../components/admin/GroupForm';
import { useGroups } from '../../hooks/useGroups';
import './UserManagement.css';

const groupColors = [
  'linear-gradient(135deg,#8b5cf6,#3b82f6)',
  'linear-gradient(135deg,#10b981,#8b5cf6)',
  'linear-gradient(135deg,#f59e0b,#10b981)',
  'linear-gradient(135deg,#3b82f6,#06b6d4)',
  'linear-gradient(135deg,#ec4899,#8b5cf6)',
];

const getGroupColor = (name = '') =>
  groupColors[name.charCodeAt(0) % groupColors.length];

const GroupManagement = ({ embedded = false }) => {
  const { toasts, removeToast, success, error: toastError } = useToast();

  const { groups, loading, error: loadError, createGroup, updateGroup, deleteGroup } = useGroups();

  const [isCreating, setIsCreating]         = useState(false);
  const [selectedGroup, setSelectedGroup]   = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [searchQuery, setSearchQuery]       = useState('');

  React.useEffect(() => {
    if (loadError) toastError('שגיאה בטעינת קבוצות');
  }, [loadError, toastError]);

  const handleCreate = () => { setSelectedGroup(null); setIsCreating(true); };
  const handleCardClick = (group) => { setSelectedGroup(group); setIsCreating(false); };

  const handleSubmit = async (formData) => {
    try {
      if (selectedGroup) {
        await updateGroup({ id: selectedGroup.id, data: formData });
        success('הקבוצה עודכנה בהצלחה');
      } else {
        await createGroup(formData);
        success('קבוצה חדשה נוצרה בהצלחה');
        setIsCreating(false);
      }
    } catch (err) {
      toastError(err.response?.data?.detail || 'שגיאה בשמירת הקבוצה');
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteGroup({ id: selectedGroup.id, reason: 'Deleted by admin' });
      success('הקבוצה נמחקה בהצלחה');
      setShowDeleteModal(false);
      setSelectedGroup(null);
    } catch {
      toastError('שגיאה במחיקת הקבוצה');
    }
  };

  const filteredGroups = groups.filter(g =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // When embedded inside UserManagement, render list RIGHT + detail LEFT (matches main layout direction)
  if (embedded) {
    return (
      <>
        <div style={{ display: 'flex', height: '100%' }}>

          {/* List panel — RIGHT in RTL (first child) */}
          <div className="um-list-panel" style={{ borderRadius: 0, border: 'none', borderLeft: '1px solid var(--border-color)' }}>
            <div className="um-list-controls">
              <div className="um-search-wrapper">
                <FiSearch className="um-search-icon" />
                <input
                  className="um-search-input"
                  placeholder="חפש קבוצה..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <button className="um-add-btn" title="הוסף קבוצה" onClick={handleCreate}>
                <FiPlus />
              </button>
            </div>

            <div className="um-list-scroll">
              {loading ? (
                [1,2,3,4].map(i => <div key={i} className="um-skeleton-card" />)
              ) : filteredGroups.length === 0 ? (
                <div className="um-empty-placeholder" style={{ padding: '2rem 1rem' }}>
                  <FiUsers />
                  <p>לא נמצאו קבוצות</p>
                </div>
              ) : filteredGroups.map(group => (
                <div
                  key={group.id}
                  className={`um-card ${selectedGroup?.id === group.id ? 'selected' : ''}`}
                  onClick={() => handleCardClick(group)}
                >
                  <div className="um-avatar group-avatar" style={{ background: getGroupColor(group.name) }}>
                    {group.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="um-card-info">
                    <div className="um-card-name">{group.name}</div>
                    <div className="um-card-meta">
                      <div className={`um-status-dot ${group.is_active ? 'active' : 'inactive'}`} />
                      <span className={`um-badge ${group.role === 'admin' ? 'admin' : 'user'}`}>
                        {group.role === 'admin' ? 'Admin' : 'User'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detail area — LEFT in RTL (second child) */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {(selectedGroup || isCreating) ? (
              <GroupForm
                group={selectedGroup}
                onSubmit={handleSubmit}
                onCancel={() => { setSelectedGroup(null); setIsCreating(false); }}
                onDelete={selectedGroup ? () => setShowDeleteModal(true) : null}
              />
            ) : (
              <div className="um-empty-placeholder">
                <FiUsers />
                <h3>ניהול קבוצות</h3>
                <p>בחר קבוצה מהרשימה כדי לצפות בפרטים ולערוך הרשאות.</p>
              </div>
            )}
          </div>
        </div>

        {/* Delete modal */}
        {showDeleteModal && selectedGroup && (
          <div className="um-modal-overlay" onClick={() => setShowDeleteModal(false)}>
            <div className="um-modal" onClick={e => e.stopPropagation()}>
              <h2>מחיקת קבוצה</h2>
              <div className="um-modal-warning">
                האם אתה בטוח שברצונך למחוק את <strong>{selectedGroup.name}</strong>?
              </div>
              <div className="um-modal-actions">
                <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>ביטול</Button>
                <Button variant="danger" onClick={handleDeleteConfirm}>מחק</Button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Standalone (non-embedded) renders full wrapper — kept for backward compatibility
  return (
    <div className="um-wrapper">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <div className="um-panels">
        <div className="um-detail-panel">
          {(selectedGroup || isCreating) ? (
            <GroupForm
              group={selectedGroup}
              onSubmit={handleSubmit}
              onCancel={() => { setSelectedGroup(null); setIsCreating(false); }}
              onDelete={selectedGroup ? () => setShowDeleteModal(true) : null}
            />
          ) : (
            <div className="um-empty-placeholder">
              <FiUsers />
              <h3>ניהול קבוצות</h3>
              <p>בחר קבוצה מהרשימה כדי לצפות בפרטים ולערוך הרשאות.</p>
            </div>
          )}
        </div>
        <div className="um-list-panel">
          <div className="um-list-controls">
            <div className="um-search-wrapper">
              <FiSearch className="um-search-icon" />
              <input
                className="um-search-input"
                placeholder="חפש קבוצה..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="um-add-btn" onClick={handleCreate}><FiPlus /></button>
          </div>
          <div className="um-list-scroll">
            {loading ? (
              [1,2,3].map(i => <div key={i} className="um-skeleton-card" />)
            ) : filteredGroups.map(group => (
              <div
                key={group.id}
                className={`um-card ${selectedGroup?.id === group.id ? 'selected' : ''}`}
                onClick={() => handleCardClick(group)}
              >
                <div className="um-avatar group-avatar" style={{ background: getGroupColor(group.name) }}>
                  {group.name.charAt(0).toUpperCase()}
                </div>
                <div className="um-card-info">
                  <div className="um-card-name">{group.name}</div>
                  <div className="um-card-meta">
                    <div className={`um-status-dot ${group.is_active ? 'active' : 'inactive'}`} />
                    <span className={`um-badge ${group.role === 'admin' ? 'admin' : 'user'}`}>
                      {group.role === 'admin' ? 'Admin' : 'User'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {showDeleteModal && selectedGroup && (
        <div className="um-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="um-modal" onClick={e => e.stopPropagation()}>
            <h2>מחיקת קבוצה</h2>
            <div className="um-modal-warning">האם אתה בטוח שברצונך למחוק את <strong>{selectedGroup.name}</strong>?</div>
            <div className="um-modal-actions">
              <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>ביטול</Button>
              <Button variant="danger" onClick={handleDeleteConfirm}>מחק</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupManagement;
