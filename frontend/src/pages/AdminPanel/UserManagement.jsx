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
import './UserManagement.css';

const UserManagement = ({ isEmbedded = false }) => {
  const navigate = useNavigate();
  const { isSuperAdmin } = useAuth();
  const { toasts, removeToast, success, error } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'user',
    is_active: true
  });

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
    setFormData({ username: '', password: '', role: 'user', is_active: true });
    setShowCreateModal(true);
  };

  const handleEditClick = (user) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      password: '', // Don't show password
      role: user.role,
      is_active: user.is_active
    });
    setShowCreateModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);
    
    try {
      if (selectedUser) {
        const updateData = { ...formData };
        if (!updateData.password) delete updateData.password; // Only send if changed
        
        await adminService.updateUser(selectedUser.id, updateData);
        success('משתמש עודכן בהצלחה');
      } else {
        await adminService.createUser(formData);
        success('משתמש נוצר בהצלחה!');
      }
      setShowCreateModal(false);
      fetchUsers();
    } catch (err) {
      error(err.response?.data?.detail || (selectedUser ? 'שגיאה בעדכון משתמש' : 'שגיאה ביצירת משתמש'));
    } finally {
      setCreating(false);
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
        <div className="modal-overlay" onClick={() => !creating && setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{selectedUser ? 'עריכת משתמש' : 'יצירת משתמש חדש'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <Input
                  label="שם משתמש"
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  minLength={3}
                  disabled={creating || (selectedUser && true)} // Disable username edit if desired, or allow it
                />
              </div>

              <div className="form-group">
                <Input
                  label={selectedUser ? "סיסמה (השאר ריק ללא שינוי)" : "סיסמה"}
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!selectedUser}
                  minLength={4}
                  disabled={creating}
                />
              </div>

              <div className="form-group">
                <Select
                  label="תפקיד"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  disabled={creating}
                  options={[
                    { value: 'user', label: 'User' },
                    ...(isSuperAdmin ? [{ value: 'admin', label: 'Admin' }] : [])
                  ]}
                />
              </div>

              {selectedUser && (
                 <div className="form-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        disabled={creating}
                      />
                      משתמש פעיל
                    </label>
                 </div>
              )}

              <div className="modal-actions">
                {creating ? (
                  <div className="modal-spinner">
                    <Spinner size="small" text={selectedUser ? "מעדכן..." : "יוצר..."} />
                  </div>
                ) : (
                  <>
                    <Button type="submit" variant="primary">
                      {selectedUser ? 'עדכן משתמש' : 'צור משתמש'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="secondary"
                      onClick={() => setShowCreateModal(false)}
                    >
                      ביטול
                    </Button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
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
