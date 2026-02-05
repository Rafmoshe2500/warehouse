import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { FiArrowRight, FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { Button, Input, Select } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import Spinner from '../../components/common/Spinner/Spinner';
import ToastContainer from '../../components/common/Toast/ToastContainer';
import adminService from '../../api/services/adminService';
import UserForm from '../../components/admin/UserForm';
import './UserManagement.css';

const UserManagement = ({ isEmbedded = false }) => {
  const navigate = useNavigate();
  const { isSuperAdmin } = useAuth();
  const { toasts, removeToast, success, error } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [deleteReason, setDeleteReason] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await adminService.getUsers();
      setUsers(data.users);
    } catch (err) {
      error('שגיאה בטעינת משתמשים');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClick = () => {
    setSelectedUser(null);
    setShowCreateModal(true);
  };

  const handleEditClick = (user) => {
    setSelectedUser(user);
    setShowCreateModal(true);
  };

  const handleUserSubmit = async (userData) => {
    try {
      if (selectedUser) {
        await adminService.updateUser(selectedUser.id, userData);
        success('משתמש עודכן בהצלחה');
      } else {
        await adminService.createUser(userData);
        success('משתמש נוצר בהצלחה!');
      }
      setShowCreateModal(false);
      fetchUsers();
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
      error('נא להזין סיבה למחיקה');
      return;
    }

    try {
      await adminService.deleteUser(userToDelete.id, deleteReason);
      fetchUsers();
      success('משתמש נמחק בהצלחה');
      setShowDeleteModal(false);
      setUserToDelete(null);
      setDeleteReason('');
    } catch (err) {
      error(err.response?.data?.detail || 'שגיאה במחיקת משתמש');
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
    return (
      <div className="user-management-loading">
        <Spinner size="large" text="טוען משתמשים..." />
      </div>
    );
  }

  return (
    <div className="user-management">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      <div className="user-management-header">
        <Button 
          variant="primary" 
          icon={<FiPlus />} 
          onClick={() => setShowCreateModal(true)}
        >
          משתמש חדש
        </Button>
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

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>שם משתמש</th>
              <th>תפקיד</th>
              <th>סטטוס</th>
              <th>נוצר על ידי</th>
              <th>תאריך יצירה</th>
              <th>פעולות</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.username}</td>
                <td>{getRoleBadge(user.role)}</td>
                <td>
                  <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                    {user.is_active ? 'פעיל' : 'לא פעיל'}
                  </span>
                </td>
                <td>{user.created_by || 'system'}</td>
                <td>{new Date(user.created_at).toLocaleDateString('he-IL')}</td>
                <td>
                  {user.role !== 'superadmin' && (
                    <div className="actions-cell">
                      <button 
                        className="icon-btn"
                        onClick={() => handleEditClick(user)}
                        title="ערוך משתמש"
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        className="icon-btn delete-btn"
                        onClick={() => handleDeleteClick(user)}
                        title="מחק משתמש"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create/Edit User Modal */}
      {showCreateModal && (
        <UserForm
          user={selectedUser}
          onSubmit={handleUserSubmit}
          onCancel={() => setShowCreateModal(false)}
        />
      )}

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
