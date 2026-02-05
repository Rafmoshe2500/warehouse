import React, { useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { Button } from '../../components/common';
import { useToast } from '../../hooks/useToast';
import Spinner from '../../components/common/Spinner/Spinner';
import GroupForm from '../../components/admin/GroupForm';
import { useGroups } from '../../hooks/useGroups'; // Import hook
import './UserManagement.css'; 

const GroupManagement = () => {
    const { success, error: toastError } = useToast();
    
    // Use React Query Hook
    const { 
        groups, 
        loading, 
        error: loadError,
        createGroup, 
        updateGroup, 
        deleteGroup 
    } = useGroups();

    const [showModal, setShowModal] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Initial load error handling
    if (loadError) {
        toastError('שגיאה בטעינת קבוצות');
    }

    const handleCreate = () => {
        setSelectedGroup(null);
        setShowModal(true);
    };

    const handleEdit = (group) => {
        setSelectedGroup(group);
        setShowModal(true);
    };

    const handleDeleteClick = (group) => {
        setSelectedGroup(group);
        setShowDeleteModal(true);
    };

    const handleSubmit = async (formData) => {
        try {
            if (selectedGroup) {
                await updateGroup({ id: selectedGroup.id, data: formData });
                success('הקבוצה עודכנה בהצלחה');
            } else {
                await createGroup(formData);
                success('קבוצה חדשה נוצרה בהצלחה');
            }
            setShowModal(false);
        } catch (err) {
            toastError(err.response?.data?.detail || 'שגיאה בשמירת הקבוצה');
        }
    };

    const handleDeleteConfirm = async () => {
        try {
            await deleteGroup({ id: selectedGroup.id, reason: 'Deleted by admin' }); 
            success('הקבוצה נמחקה בהצלחה');
            setShowDeleteModal(false);
        } catch (err) {
            toastError('שגיאה במחיקת הקבוצה');
        }
    };

    if (loading) return <div className="user-management-loading"><Spinner size="large" /></div>;

    return (
        <div className="user-management"> {/* Reusing class for layout */}
            <div className="user-management-header">
                <Button 
                    variant="primary" 
                    icon={<FiPlus />} 
                    onClick={handleCreate}
                >
                    קבוצה חדשה
                </Button>
            </div>

            <div className="users-table-container">
                <table className="users-table">
                    <thead>
                        <tr>
                            <th>שם קבוצה</th>
                            <th>תפקיד</th>
                            <th>סטטוס</th>
                            <th>נוצר בתאריך</th>
                            <th>פעולות</th>
                        </tr>
                    </thead>
                    <tbody>
                        {groups.map(group => (
                            <tr key={group.id}>
                                <td>{group.name}</td>
                                <td>
                                    <span className={`role-badge role-${group.role || 'user'}`}>
                                        {group.role === 'admin' ? 'מנהל' : 'משתמש'}
                                    </span>
                                </td>
                                <td>
                                    <span className={`status-badge ${group.is_active ? 'active' : 'inactive'}`}>
                                        {group.is_active ? 'פעיל' : 'לא פעיל'}
                                    </span>
                                </td>
                                <td>{new Date(group.created_at).toLocaleDateString('he-IL')}</td>
                                <td>
                                    <div className="actions-cell">
                                        <button className="icon-btn" onClick={() => handleEdit(group)}>
                                            <FiEdit2 />
                                        </button>
                                        <button className="icon-btn delete-btn" onClick={() => handleDeleteClick(group)}>
                                            <FiTrash2 />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <GroupForm 
                    group={selectedGroup}
                    onSubmit={handleSubmit}
                    onCancel={() => setShowModal(false)}
                />
            )}

            {showDeleteModal && (
                <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2>מחיקת קבוצה</h2>
                        <p>האם אתה בטוח שברצונך למחוק את הקבוצה <strong>{selectedGroup?.name}</strong>?</p>
                        <div className="modal-actions">
                            <Button variant="danger" onClick={handleDeleteConfirm}>מחק</Button>
                            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>ביטול</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GroupManagement;
