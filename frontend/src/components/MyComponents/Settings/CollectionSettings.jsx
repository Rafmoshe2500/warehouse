import React, { useState } from 'react';
import PropTypes from 'prop-types';
import PermissionsManager from './PermissionsManager';
import CustomFieldsEditor from './CustomFieldsEditor';
import { Button } from '../../common';
import DeleteModal from '../../common/DeleteModal/DeleteModal';
import { FaTrash, FaExclamationTriangle } from 'react-icons/fa';
import collectionsService from '../../../api/services/collectionsService';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../../context/ToastContext';
import './CollectionSettings.css';

const CollectionSettings = ({ collection, isOwner, canEdit }) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
        await collectionsService.deleteCollection(collection.id);
        showToast('האוסף נמחק בהצלחה', 'success');
        navigate('/my-components');
    } catch (error) {
        showToast('שגיאה במחיקת האוסף', 'error');
        setIsDeleting(false);
    }
  };

  return (
    <div className="settings-container space-y-8">
      {/* 1. Permissions */}
      <PermissionsManager 
        collection={collection} 
        isOwner={isOwner} 
      />

      {/* 2. Custom Fields */}
      <CustomFieldsEditor 
        collection={collection} 
        canEdit={canEdit} 
      />

      {/* 4. Delete Modal */}
      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="מחיקת אוסף"
        message={`האם אתה בטוח שברצונך למחוק את האוסף "${collection.name}"?`}
        type="verification"
        verificationText={collection.name}
        confirmText="מחק אוסף"
        isProcessing={isDeleting}
      />

      {/* 3. Danger Zone */}
      {isOwner && (
          <div className="danger-zone">
              <div className="danger-zone-header">
                  <FaExclamationTriangle size={24} />
                  <h3 className="danger-zone-title">אזור מסוכן</h3>
              </div>
              <p className="danger-zone-description">
                  מחיקת האוסף היא פעולה בלתי הפיכה. כל השיוכים וההגדרות יימחקו לצמיתות.
              </p>
              <Button 
                variant="danger" 
                onClick={() => setIsDeleteModalOpen(true)}
                icon={<FaTrash />}
              >
                  מחק את האוסף
              </Button>
          </div>
      )}
    </div>
  );
};

CollectionSettings.propTypes = {
  collection: PropTypes.object.isRequired,
  isOwner: PropTypes.bool.isRequired,
  canEdit: PropTypes.bool.isRequired
};

export default CollectionSettings;
