import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { FiArrowRight, FiPlus, FiEdit2, FiTrash2, FiUsers } from 'react-icons/fi';
import { Button, SkeletonTable } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import { useUsers } from '../../hooks/useUsers';
import ToastContainer from '../../components/common/Toast/ToastContainer';
import UserForm from '../../components/admin/UserForm';
import './UserManagement.css';

const UserManagement = ({ isEmbedded = false }) => {
  const navigate = useNavigate();
  const { isSuperAdmin } = useAuth();
  const { toasts, removeToast, success, error: toastError } = useToast();
  
  // Use React Query Hook
  const { 
    users, 
    loading, 
    error: loadError,
    createUser, 
    updateUser, 
    deleteUser 
  } = useUsers();

  const [isCreating, setIsCreating] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [deleteReason, setDeleteReason] = useState('');

  // Handle load error
  React.useEffect(() => {
    if (loadError) {
      toastError('שגיאה בטעינת משתמשים');
    }
  }, [loadError, toastError]);

  const handleCreateClick = () => {
    setSelectedUser(null);
    setIsCreating(true);
  };

  const handleRowClick = (user) => {
    setSelectedUser(user);
    setIsCreating(false);
  };

  const handleUserSubmit = async (userData) => {
    try {
      if (selectedUser) {
        await updateUser({ id: selectedUser.id, data: userData });
        success('משתמש עודכן בהצלחה');
      } else {
        await createUser(userData);
        success('משתמש נוצר בהצלחה!');
      }
      setIsCreating(false);
    } catch (err) {
      // Rethrow to let UserForm handle the error display
      throw err;
    }
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteReason.trim()) {
      toastError('נא להזין סיבה למחיקה');
      return;
    }

    try {
      await deleteUser({ id: userToDelete.id, reason: deleteReason });
      success('משתמש נמחק בהצלחה');
      setShowDeleteModal(false);
      setUserToDelete(null);
      setDeleteReason('');
    } catch (err) {
      toastError(err.response?.data?.detail || 'שגיאה במחיקת משתמש');
    }
  };

  const getRoleBadge = (role) => {
    const badges = {
      superadmin: { text: 'SuperAdmin', class: 'role-superadmin' },
      admin: { text: 'Admin', class: 'role-admin' },
      user: { text: 'User', class: 'role-user' }
    };
    const badge = badges[role] || badges.user;
    return <span className={`role-badge ${badge.class}`}>{badge.text}</span>;
  };

  if (loading) {
    return <SkeletonTable rows={8} columns={6} />;
  }

  return (
    <div className="user-management">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <div className="page-top-header">
        <h2>ניהול משתמשים</h2>
        {!isEmbedded && (
          <Button 
            variant="secondary" 
            icon={<FiArrowRight />} 
            onClick={() => navigate('/admin')}
          >
            חזרה
          </Button>
        )}
      </div>
      
      <div className="management-layout">
        <div className="list-pane">
          <div className="user-management-header">
            <Button 
              variant="primary" 
              icon={<FiPlus />} 
              onClick={handleCreateClick}
              style={{ width: '100%' }}
            >
              משתמש חדש
            </Button>
          </div>

          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>משתמשים ({users.length})</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr 
                    key={user.id} 
                    onClick={() => handleRowClick(user)}
                    className={selectedUser?.id === user.id ? 'selected-row clickable-row' : 'clickable-row'}
                  >
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ 
                          width: '32px', 
                          height: '32px', 
                          borderRadius: '50%', 
                          background: 'var(--accent-primary)', 
                          color: 'white', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          fontWeight: 'bold'
                        }}>
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        {user.username}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="details-pane">
          {(selectedUser || isCreating) ? (
            <UserForm
              user={selectedUser}
              onSubmit={handleUserSubmit}
              onCancel={() => {
                setSelectedUser(null);
                setIsCreating(false);
              }}
              onDelete={selectedUser?.role !== 'superadmin' ? () => handleDeleteClick(selectedUser) : null}
            />
          ) : (
            <div className="empty-selection-placeholder">
              <div className="placeholder-content">
                <FiUsers className="placeholder-icon" />
                <h3>ניהול משתמשים</h3>
                <p>בחר משתמש מהרשימה כדי לצפות בפרטים, לערוך הרשאות או למחוק.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete User Modal */}
      {showDeleteModal && userToDelete && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>מחיקת משתמש</h2>
            <p className="delete-warning">
              האם אתה בטוח שברצונך למחוק את המשתמש <strong>{userToDelete.username}</strong>?
            </p>
            
            <div className="form-group">
              <label>סיבה למחיקה:</label>
              <input
                type="text"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="הזן סיבה למחיקה..."
                required
              />
            </div>

            <div className="modal-actions">
              <button 
                className="btn-danger"
                onClick={handleDeleteConfirm}
              >
                מחק
              </button>
              <button 
                className="btn-secondary"
                onClick={() => {
                  setShowDeleteModal(false);
                  setUserToDelete(null);
                  setDeleteReason('');
                }}
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

UserManagement.propTypes = {
  isEmbedded: PropTypes.bool
};

export default UserManagement;
