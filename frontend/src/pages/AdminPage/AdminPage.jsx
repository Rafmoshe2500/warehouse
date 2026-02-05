import React, { useState, useEffect } from 'react';
import adminService from '../../api/services/adminService';
import groupService from '../../api/services/groupService';
import { Spinner, Button } from '../../components/common';
import ToastContainer from '../../components/common/Toast/ToastContainer';
import { useToast } from '../../hooks/useToast';
import UserForm from '../../components/admin/UserForm';
import GroupForm from '../../components/admin/GroupForm';
import DeleteConfirmModal from '../../components/admin/DeleteConfirmModal';
import './AdminPage.css';

const AdminPage = () => {
    // Tab state
    const [activeTab, setActiveTab] = useState('users');

    // Users state
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [showUserForm, setShowUserForm] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    // Groups state
    const [groups, setGroups] = useState([]);
    const [loadingGroups, setLoadingGroups] = useState(true);
    const [showGroupForm, setShowGroupForm] = useState(false);
    const [editingGroup, setEditingGroup] = useState(null);

    // Delete modal state
    const [deleteModal, setDeleteModal] = useState({
        isOpen: false,
        entityType: '',
        entityName: '',
        entityId: null,
        onConfirm: null,
    });

    // Toast
    const { toasts, removeToast, success, error } = useToast();

    useEffect(() => {
        loadUsers();
        loadGroups();
    }, []);

    // Users functions
    const loadUsers = async () => {
        setLoadingUsers(true);
        try {
            const data = await adminService.getUsers();
            setUsers(data.users);
        } catch (err) {
            error(err.response?.data?.detail || 'שגיאה בטעינת משתמשים');
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleAddUser = () => {
        setEditingUser(null);
        setShowUserForm(true);
    };

    const handleEditUser = (user) => {
        setEditingUser(user);
        setShowUserForm(true);
    };

    const handleDeleteUserClick = (userId, username) => {
        setDeleteModal({
            isOpen: true,
            entityType: 'משתמש',
            entityName: username,
            entityId: userId,
            onConfirm: async (reason) => {
                try {
                    await adminService.deleteUser(userId, reason);
                    success('משתמש נמחק בהצלחה');
                    loadUsers();
                } catch (err) {
                    error(err.response?.data?.detail || 'שגיאה במחיקת משתמש');
                }
            },
        });
    };

    const handleUserFormSubmit = async (formData) => {
        try {
            if (editingUser) {
                await adminService.updateUser(editingUser.id, formData);
                success('משתמש עודכן בהצלחה');
            } else {
                await adminService.createUser(formData);
                success('משתמש נוצר בהצלחה');
            }
            setShowUserForm(false);
            setEditingUser(null);
            loadUsers();
        } catch (err) {
            throw err;
        }
    };

    const handleUserFormCancel = () => {
        setShowUserForm(false);
        setEditingUser(null);
    };

    // Groups functions
    const loadGroups = async () => {
        setLoadingGroups(true);
        try {
            const data = await groupService.getGroups();
            setGroups(data.groups);
        } catch (err) {
            error(err.response?.data?.detail || 'שגיאה בטעינת קבוצות');
        } finally {
            setLoadingGroups(false);
        }
    };

    const handleAddGroup = () => {
        setEditingGroup(null);
        setShowGroupForm(true);
    };

    const handleEditGroup = (group) => {
        setEditingGroup(group);
        setShowGroupForm(true);
    };

    const handleDeleteGroupClick = (groupId, groupName) => {
        setDeleteModal({
            isOpen: true,
            entityType: 'קבוצה',
            entityName: groupName,
            entityId: groupId,
            onConfirm: async (reason) => {
                try {
                    await groupService.deleteGroup(groupId, reason);
                    success('קבוצה נמחקה בהצלחה');
                    loadGroups();
                } catch (err) {
                    error(err.response?.data?.detail || 'שגיאה במחיקת קבוצה');
                }
            },
        });
    };

    const handleGroupFormSubmit = async (formData) => {
        try {
            if (editingGroup) {
                await groupService.updateGroup(editingGroup.id, formData);
                success('קבוצה עודכנה בהצלחה');
            } else {
                await groupService.createGroup(formData);
                success('קבוצה נוצרה בהצלחה');
            }
            setShowGroupForm(false);
            setEditingGroup(null);
            loadGroups();
        } catch (err) {
            throw err;
        }
    };

    const handleGroupFormCancel = () => {
        setShowGroupForm(false);
        setEditingGroup(null);
    };

    // Delete modal handlers
    const handleDeleteModalClose = () => {
        setDeleteModal({
            isOpen: false,
            entityType: '',
            entityName: '',
            entityId: null,
            onConfirm: null,
        });
    };

    const handleDeleteModalConfirm = (reason) => {
        if (deleteModal.onConfirm) {
            deleteModal.onConfirm(reason);
        }
    };

    // Helper functions
    const getRoleLabel = (role) => {
        return role === 'admin' ? 'אדמין' : 'משתמש';
    };

    const getRoleClass = (role) => {
        return role === 'admin' ? 'admin-page__role--admin' : 'admin-page__role--user';
    };

    const renderUsersTab = () => {
        if (loadingUsers) {
            return <Spinner size="large" text="טוען משתמשים..." />;
        }

        return (
            <>
                <div className="admin-page__header">
                    <h2>ניהול משתמשים</h2>
                    <Button onClick={handleAddUser} variant="primary">
                        + הוסף משתמש
                    </Button>
                </div>

                {showUserForm && (
                    <UserForm
                        user={editingUser}
                        onSubmit={handleUserFormSubmit}
                        onCancel={handleUserFormCancel}
                    />
                )}

                <div className="admin-page__table-container">
                    <table className="admin-page__table">
                        <thead>
                            <tr>
                                <th>שם משתמש</th>
                                <th>תפקיד</th>
                                <th>סטטוס</th>
                                <th>נוצר בתאריך</th>
                                <th>פעולות</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id}>
                                    <td>{user.username}</td>
                                    <td>
                                        <span className={`admin-page__role ${getRoleClass(user.role)}`}>
                                            {getRoleLabel(user.role)}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`admin-page__status ${user.is_active ? 'admin-page__status--active' : 'admin-page__status--inactive'}`}>
                                            {user.is_active ? 'פעיל' : 'לא פעיל'}
                                        </span>
                                    </td>
                                    <td>{new Date(user.created_at).toLocaleDateString('he-IL')}</td>
                                    <td className="admin-page__actions">
                                        <Button size="small" onClick={() => handleEditUser(user)}>
                                            עריכה
                                        </Button>
                                        <Button
                                            size="small"
                                            variant="danger"
                                            onClick={() => handleDeleteUserClick(user.id, user.username)}
                                        >
                                            מחיקה
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {users.length === 0 && (
                        <div className="admin-page__empty">אין משתמשים להצגה</div>
                    )}
                </div>
            </>
        );
    };

    const renderGroupsTab = () => {
        if (loadingGroups) {
            return <Spinner size="large" text="טוען קבוצות..." />;
        }

        return (
            <>
                <div className="admin-page__header">
                    <h2>ניהול קבוצות</h2>
                    <Button onClick={handleAddGroup} variant="primary">
                        + הוסף קבוצה
                    </Button>
                </div>

                {showGroupForm && (
                    <GroupForm
                        group={editingGroup}
                        onSubmit={handleGroupFormSubmit}
                        onCancel={handleGroupFormCancel}
                    />
                )}

                <div className="admin-page__table-container">
                    <table className="admin-page__table">
                        <thead>
                            <tr>
                                <th>שם קבוצה</th>
                                <th>סטטוס</th>
                                <th>נוצר בתאריך</th>
                                <th>פעולות</th>
                            </tr>
                        </thead>
                        <tbody>
                            {groups.map((group) => (
                                <tr key={group.id}>
                                    <td>{group.name}</td>
                                    <td>
                                        <span className={`admin-page__status ${group.is_active ? 'admin-page__status--active' : 'admin-page__status--inactive'}`}>
                                            {group.is_active ? 'פעילה' : 'לא פעילה'}
                                        </span>
                                    </td>
                                    <td>{new Date(group.created_at).toLocaleDateString('he-IL')}</td>
                                    <td className="admin-page__actions">
                                        <Button size="small" onClick={() => handleEditGroup(group)}>
                                            עריכה
                                        </Button>
                                        <Button
                                            size="small"
                                            variant="danger"
                                            onClick={() => handleDeleteGroupClick(group.id, group.name)}
                                        >
                                            מחיקה
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {groups.length === 0 && (
                        <div className="admin-page__empty">אין קבוצות להצגה</div>
                    )}
                </div>
            </>
        );
    };

    return (
        <div className="admin-page">
            {/* Title removed */}

            <div className="admin-page__tabs">
                <button
                    className={`admin-page__tab ${activeTab === 'users' ? 'admin-page__tab--active' : ''}`}
                    onClick={() => setActiveTab('users')}
                >
                    משתמשים
                </button>
                <button
                    className={`admin-page__tab ${activeTab === 'groups' ? 'admin-page__tab--active' : ''}`}
                    onClick={() => setActiveTab('groups')}
                >
                    קבוצות
                </button>
            </div>

            <div className="admin-page__content">
                {activeTab === 'users' ? renderUsersTab() : renderGroupsTab()}
            </div>

            {/* Delete Confirmation Modal */}
            <DeleteConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={handleDeleteModalClose}
                onConfirm={handleDeleteModalConfirm}
                entityName={deleteModal.entityName}
                entityType={deleteModal.entityType}
            />

            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </div>
    );
};

export default AdminPage;
