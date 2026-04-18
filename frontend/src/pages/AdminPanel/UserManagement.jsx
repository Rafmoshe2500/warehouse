import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import {
  FiArrowRight, FiPlus, FiUsers, FiUser, FiSearch
} from 'react-icons/fi';
import { Button } from '../../components/common';
import { useToast } from '../../hooks/useToast';
import { useUsers } from '../../hooks/useUsers';
import { useGroups } from '../../hooks/useGroups';
import ToastContainer from '../../components/common/Toast/ToastContainer';
import UserForm from '../../components/admin/UserForm';
import GroupForm from '../../components/admin/GroupForm';
import './UserManagement.css';

/* ── helpers ──────────────────────────────────────── */
const ROLE_LABELS = {
  superadmin: 'SuperAdmin',
  admin: 'Admin',
  user: 'User',
};

const avatarColors = [
  'linear-gradient(135deg,#3b82f6,#8b5cf6)',
  'linear-gradient(135deg,#10b981,#3b82f6)',
  'linear-gradient(135deg,#f59e0b,#ef4444)',
  'linear-gradient(135deg,#8b5cf6,#ec4899)',
  'linear-gradient(135deg,#06b6d4,#3b82f6)',
];
const groupColors = [
  'linear-gradient(135deg,#8b5cf6,#3b82f6)',
  'linear-gradient(135deg,#10b981,#8b5cf6)',
  'linear-gradient(135deg,#f59e0b,#10b981)',
  'linear-gradient(135deg,#3b82f6,#06b6d4)',
];

const getAvatarColor = (name = '') =>
  avatarColors[name.charCodeAt(0) % avatarColors.length];
const getGroupColor = (name = '') =>
  groupColors[name.charCodeAt(0) % groupColors.length];

/* ── Main component ───────────────────────────────── */
const UserManagement = ({ isEmbedded = false }) => {
  const navigate = useNavigate();
  const { toasts, removeToast, success, error: toastError } = useToast();

  /* ── Users ─────────────────────────────────── */
  const { users, loading: usersLoading, error: usersError, createUser, updateUser, deleteUser, isDeleting } = useUsers();

  const [activeTab,    setActiveTab]    = useState('users');
  const [searchQuery,  setSearchQuery]  = useState('');

  // User selection state
  const [selectedUser, setSelectedUser]     = useState(null);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [showUserDeleteModal, setShowUserDeleteModal] = useState(false);
  const [userToDelete,  setUserToDelete]    = useState(null);
  const [userDeleteReason, setUserDeleteReason] = useState('');

  /* ── Groups ────────────────────────────────── */
  const { groups, loading: groupsLoading, error: groupsError, createGroup, updateGroup, deleteGroup } = useGroups();

  const [groupSearch,    setGroupSearch]    = useState('');
  const [selectedGroup,  setSelectedGroup]  = useState(null);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [showGroupDeleteModal, setShowGroupDeleteModal] = useState(false);
  const [groupDeleteReason, setGroupDeleteReason] = useState('');

  React.useEffect(() => {
    if (usersError)  toastError('שגיאה בטעינת משתמשים');
    if (groupsError) toastError('שגיאה בטעינת קבוצות');
  }, [usersError, groupsError, toastError]);

  /* ── Tab switch ─────────────────────────────── */
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchQuery('');
    setGroupSearch('');
    setSelectedUser(null);
    setIsCreatingUser(false);
    setSelectedGroup(null);
    setIsCreatingGroup(false);
  };

  /* ── User handlers ──────────────────────────── */
  const handleUserClick   = (u)  => { setSelectedUser(u); setIsCreatingUser(false); };
  const handleCreateUser  = ()   => { setSelectedUser(null); setIsCreatingUser(true); };

  const handleUserSubmit = async (data) => {
    try {
      if (selectedUser) {
        await updateUser({ id: selectedUser.id, data });
        success('משתמש עודכן בהצלחה');
      } else {
        await createUser(data);
        success('משתמש נוצר בהצלחה!');
        setIsCreatingUser(false);
      }
    } catch (err) { throw err; }
  };

  const handleUserDeleteClick = (u) => { setUserToDelete(u); setShowUserDeleteModal(true); };

  const handleUserDeleteConfirm = async () => {
    if (!userDeleteReason.trim()) { toastError('נא להזין סיבה למחיקה'); return; }
    try {
      await deleteUser({ id: userToDelete.id, reason: userDeleteReason });
      success('משתמש נמחק בהצלחה');
      setShowUserDeleteModal(false);
      setUserToDelete(null);
      setUserDeleteReason('');
      setSelectedUser(null);
    } catch (err) {
      toastError(err.response?.data?.detail || 'שגיאה במחיקת משתמש');
    }
  };

  /* ── Group handlers ─────────────────────────── */
  const handleGroupClick   = (g)  => { setSelectedGroup(g); setIsCreatingGroup(false); };
  const handleCreateGroup  = ()   => { setSelectedGroup(null); setIsCreatingGroup(true); };

  const handleGroupSubmit = async (data) => {
    try {
      if (selectedGroup) {
        await updateGroup({ id: selectedGroup.id, data });
        success('קבוצה עודכנה בהצלחה');
      } else {
        await createGroup(data);
        success('קבוצה נוצרה בהצלחה!');
        setIsCreatingGroup(false);
      }
    } catch (err) { throw err; }
  };

  const handleGroupDeleteConfirm = async () => {
    if (!groupDeleteReason.trim()) { toastError('נא להזין סיבה למחיקה'); return; }
    try {
      await deleteGroup({ id: selectedGroup.id, reason: groupDeleteReason });
      success('קבוצה נמחקה בהצלחה');
      setShowGroupDeleteModal(false);
      setSelectedGroup(null);
      setGroupDeleteReason('');
    } catch (err) {
      toastError(err.response?.data?.detail || 'שגיאה במחיקת קבוצה');
    }
  };

  /* ── Filtered lists ─────────────────────────── */
  const filteredUsers  = users.filter(u =>
    u.username.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );
  const filteredGroups = groups.filter(g =>
    g.name.toLowerCase().includes(groupSearch.trim().toLowerCase())
  );

  /* ── Render ───────────────────────────────────────── */
  return (
    <div className={`um-wrapper ${isEmbedded ? 'um-wrapper--embedded' : ''}`} data-testid="user-management">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Top header — standalone only */}
      {!isEmbedded && (
        <div className="um-top-header">
          <h2>ניהול משתמשים וקבוצות</h2>
          <Button variant="secondary" icon={<FiArrowRight />} onClick={() => navigate('/admin')}>
            חזרה
          </Button>
        </div>
      )}

      {/* Two-panel layout: list RIGHT, detail LEFT (RTL) */}
      <div className="um-panels">

        {/* ── List panel (RIGHT in RTL — first child) ── */}
        <div className="um-list-panel">

          {/* Tab switcher */}
          <div className="um-tabs" role="tablist">
            <button
              role="tab"
              aria-selected={activeTab === 'users'}
              className={`um-tab ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => handleTabChange('users')}
              data-testid="users-tab"
            >
              <FiUser /> משתמשים
              <span style={{ fontSize: '0.72rem', marginRight: '0.25rem', opacity: 0.7 }}>({users.length})</span>
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'groups'}
              className={`um-tab ${activeTab === 'groups' ? 'active' : ''}`}
              onClick={() => handleTabChange('groups')}
              data-testid="groups-tab"
            >
              <FiUsers /> קבוצות
              <span style={{ fontSize: '0.72rem', marginRight: '0.25rem', opacity: 0.7 }}>({groups.length})</span>
            </button>
          </div>

          {/* ── USERS list ──────────────────────────── */}
          {activeTab === 'users' && (
            <>
              <div className="um-list-controls">
                <div className="um-search-wrapper">
                  <FiSearch className="um-search-icon" />
                  <input
                    className="um-search-input"
                    placeholder="חפש משתמש..."
                    aria-label="חפש משתמש"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    data-testid="user-search"
                  />
                </div>
                <button className="um-add-btn" title="הוסף משתמש" aria-label="הוסף משתמש" onClick={handleCreateUser} data-testid="add-user-btn">
                  <FiPlus />
                </button>
              </div>

              <div className="um-list-scroll">
                {usersLoading ? (
                  [1,2,3,4,5].map(i => <div key={i} className="um-skeleton-card" />)
                ) : filteredUsers.length === 0 ? (
                  <div className="um-empty-placeholder" style={{ padding: '2rem 1rem' }}>
                    <FiUser /><p>לא נמצאו משתמשים</p>
                  </div>
                ) : filteredUsers.map(user => (
                  <div
                    key={user.id}
                    className={`um-card ${selectedUser?.id === user.id ? 'selected' : ''}`}
                    onClick={() => handleUserClick(user)}
                    data-testid={`user-card-${user.username}`}
                  >
                    <div className="um-avatar" style={{ background: getAvatarColor(user.username) }}>
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="um-card-info">
                      <div className="um-card-name">{user.username}</div>
                      <div className="um-card-meta">
                        <div className={`um-status-dot ${user.is_active ? 'active' : 'inactive'}`} />
                        <span className={`um-badge ${user.role}`}>{ROLE_LABELS[user.role] || 'User'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── GROUPS list ─────────────────────────── */}
          {activeTab === 'groups' && (
            <>
              <div className="um-list-controls">
                <div className="um-search-wrapper">
                  <FiSearch className="um-search-icon" />
                  <input
                    className="um-search-input"
                    placeholder="חפש קבוצה..."
                    aria-label="חפש קבוצה"
                    value={groupSearch}
                    onChange={e => setGroupSearch(e.target.value)}
                    data-testid="group-search"
                  />
                </div>
                <button className="um-add-btn" title="הוסף קבוצה" aria-label="הוסף קבוצה" onClick={handleCreateGroup} data-testid="add-group-btn">
                  <FiPlus />
                </button>
              </div>

              <div className="um-list-scroll">
                {groupsLoading ? (
                  [1,2,3,4].map(i => <div key={i} className="um-skeleton-card" />)
                ) : filteredGroups.length === 0 ? (
                  <div className="um-empty-placeholder" style={{ padding: '2rem 1rem' }}>
                    <FiUsers /><p>לא נמצאו קבוצות</p>
                  </div>
                ) : filteredGroups.map(group => (
                  <div
                    key={group.id}
                    className={`um-card ${selectedGroup?.id === group.id ? 'selected' : ''}`}
                    onClick={() => handleGroupClick(group)}
                    data-testid={`group-card-${group.name}`}
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
            </>
          )}
        </div>

        {/* ── Detail panel (LEFT in RTL — second child) ── */}
        <div className="um-detail-panel">
          {/* Users detail */}
          {activeTab === 'users' && (
            (selectedUser || isCreatingUser) ? (
              <UserForm
                user={selectedUser}
                onSubmit={handleUserSubmit}
                onCancel={() => { setSelectedUser(null); setIsCreatingUser(false); }}
                onDelete={selectedUser?.role !== 'superadmin' ? () => handleUserDeleteClick(selectedUser) : null}
              />
            ) : (
              <div className="um-empty-placeholder">
                <FiUsers />
                <h3>ניהול משתמשים</h3>
                <p>בחר משתמש מהרשימה כדי לצפות בפרטים ולערוך הרשאות.</p>
              </div>
            )
          )}

          {/* Groups detail */}
          {activeTab === 'groups' && (
            (selectedGroup || isCreatingGroup) ? (
              <GroupForm
                group={selectedGroup}
                onSubmit={handleGroupSubmit}
                onCancel={() => { setSelectedGroup(null); setIsCreatingGroup(false); }}
                onDelete={selectedGroup ? () => setShowGroupDeleteModal(true) : null}
              />
            ) : (
              <div className="um-empty-placeholder">
                <FiUsers />
                <h3>ניהול קבוצות</h3>
                <p>בחר קבוצה מהרשימה כדי לצפות בפרטים ולערוך הרשאות.</p>
              </div>
            )
          )}
        </div>
      </div>

      {/* ── User delete modal ──────────────────── */}
      {showUserDeleteModal && userToDelete && (
        <div className="um-modal-overlay" onClick={() => setShowUserDeleteModal(false)}>
          <div className="um-modal" onClick={e => e.stopPropagation()} data-testid="user-delete-modal">
            <h2>מחיקת משתמש</h2>
            <div className="um-modal-warning">
              האם אתה בטוח שברצונך למחוק את <strong>{userToDelete.username}</strong>? פעולה זו אינה הפיכה.
            </div>
            <div>
              <label className="input-label" style={{ marginBottom: '0.4rem', display: 'block' }}>סיבה למחיקה</label>
              <input
                type="text"
                value={userDeleteReason}
                onChange={e => setUserDeleteReason(e.target.value)}
                placeholder="הזן סיבה למחיקה..."
                data-testid="delete-reason-input"
              />
            </div>
            <div className="um-modal-actions">
              <Button variant="secondary" onClick={() => setShowUserDeleteModal(false)} data-testid="cancel-delete-btn">ביטול</Button>
              <Button variant="danger" onClick={handleUserDeleteConfirm} disabled={isDeleting} data-testid="confirm-delete-btn">{isDeleting ? 'מוחק...' : 'מחק'}</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Group delete modal ───────────────── */}
      {showGroupDeleteModal && selectedGroup && (
        <div className="um-modal-overlay" onClick={() => { setShowGroupDeleteModal(false); setGroupDeleteReason(''); }}>
          <div className="um-modal" onClick={e => e.stopPropagation()} data-testid="group-delete-modal">
            <h2>מחיקת קבוצה</h2>
            <div className="um-modal-warning">
              האם אתה בטוח שברצונך למחוק את <strong>{selectedGroup.name}</strong>? פעולה זו אינה הפיכה.
            </div>
            <div>
              <label className="input-label" style={{ marginBottom: '0.4rem', display: 'block' }}>סיבה למחיקה</label>
              <input
                type="text"
                value={groupDeleteReason}
                onChange={e => setGroupDeleteReason(e.target.value)}
                placeholder="הזן סיבה למחיקה..."
                data-testid="group-delete-reason-input"
              />
            </div>
            <div className="um-modal-actions">
              <Button variant="secondary" onClick={() => { setShowGroupDeleteModal(false); setGroupDeleteReason(''); }} data-testid="group-cancel-delete-btn">ביטול</Button>
              <Button variant="danger" onClick={handleGroupDeleteConfirm} data-testid="group-confirm-delete-btn">מחק</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

UserManagement.propTypes = {
  isEmbedded: PropTypes.bool,
};

export default UserManagement;
