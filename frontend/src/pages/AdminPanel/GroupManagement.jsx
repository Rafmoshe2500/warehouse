import React, { useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiUsers } from 'react-icons/fi';
import { Button, SkeletonTable } from '../../components/common';
import { useToast } from '../../hooks/useToast';
import ToastContainer from '../../components/common/Toast/ToastContainer';
import Spinner from '../../components/common/Spinner/Spinner';
import GroupForm from '../../components/admin/GroupForm';
import { useGroups } from '../../hooks/useGroups';
import './UserManagement.css';

const GroupManagement = () => {
    const { toasts, removeToast, success, error: toastError } = useToast();
    
    // Use React Query Hook
    const { 
        groups, 
        loading, 
        error: loadError,
        createGroup, 
        updateGroup, 
        deleteGroup 
    } = useGroups();

    const [isCreating, setIsCreating] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Initial load error handling
    React.useEffect(() => {
        if (loadError) {
            toastError('שגיאה בטעינת קבוצות');
        }
    }, [loadError, toastError]);

    const handleCreate = () => {
        setSelectedGroup(null);
        setIsCreating(true);
    };

    const handleRowClick = (group) => {
        setSelectedGroup(group);
        setIsCreating(false);
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
            setIsCreating(false);
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

    if (loading) return <SkeletonTable rows={8} columns={5} />;

    return (
        <div className="user-management">
            <ToastContainer toasts={toasts} removeToast={removeToast} />
            <div className="page-top-header">
                <h2>ניהול קבוצות</h2>
            </div>
            
            <div className="management-layout">
                <div className="list-pane">
                    <div className="user-management-header">
                        <Button 
                            variant="primary" 
                            icon={<FiPlus />} 
                            onClick={handleCreate}
                            style={{ width: '100%' }}
                        >
                            קבוצה חדשה
                        </Button>
                    </div>

                    <div className="users-table-container">
                        <table className="users-table">
                            <thead>
                                <tr>
                                    <th>קבוצות ({groups.length})</th>
                                </tr>
                            </thead>
                            <tbody>
                        {groups.map(group => (
                            <tr 
                                key={group.id}
                                onClick={() => handleRowClick(group)}
                                className={selectedGroup?.id === group.id ? 'selected-row clickable-row' : 'clickable-row'}
                            >
                                <td>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ 
                                      width: '32px', 
                                      height: '32px', 
                                      borderRadius: '8px', 
                                      background: 'var(--bg-tertiary)', 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      justifyContent: 'center'
                                    }}>
                                      <FiUsers style={{ color: 'var(--text-muted)' }} />
                                    </div>
                                    {group.name}
                                  </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        <div className="details-pane">
            {(selectedGroup || isCreating) ? (
                <GroupForm 
                    group={selectedGroup}
                    onSubmit={handleSubmit}
                    onCancel={() => {
                        setSelectedGroup(null);
                        setIsCreating(false);
                    }}
                    onDelete={selectedGroup ? () => handleDeleteClick(selectedGroup) : null}
                />
            ) : (
                <div className="empty-selection-placeholder">
                    <div className="placeholder-content">
                        <FiUsers className="placeholder-icon" />
                        <h3>ניהול קבוצות</h3>
                        <p>בחר קבוצה מהרשימה כדי לצפות בפרטים, לערוך הרשאות או למחוק.</p>
                    </div>
                </div>
            )}
        </div>
    </div>

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
