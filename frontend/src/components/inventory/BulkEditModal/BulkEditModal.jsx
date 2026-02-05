import React, { useState } from 'react';
import Modal from '../../common/Modal/Modal';
import Input from '../../common/Input/Input';
import Button from '../../common/Button/Button';
import { TARGET_SITES } from '../../../constants/sites';
import './BulkEditModal.css';

const BulkEditModal = ({ isOpen, onClose, onConfirm, selectedCount }) => {
  const [updates, setUpdates] = useState({
    purpose: { enabled: false, value: '' },
    notes: { enabled: false, value: '' },
    target_site: { enabled: false, value: '' }
  });

  const handleToggle = (field) => {
    setUpdates(prev => ({
      ...prev,
      [field]: { ...prev[field], enabled: !prev[field].enabled }
    }));
  };

  const handleChange = (field, value) => {
    setUpdates(prev => ({
      ...prev,
      [field]: { ...prev[field], value }
    }));
  };

  const handleConfirm = () => {
    const changes = {};
    if (updates.purpose.enabled) changes.purpose = updates.purpose.value;
    if (updates.notes.enabled) changes.notes = updates.notes.value;
    if (updates.target_site.enabled) changes.target_site = updates.target_site.value;

    if (Object.keys(changes).length > 0) {
      onConfirm(changes);
      handleClose();
    }
  };

  const handleClose = () => {
    setUpdates({
        purpose: { enabled: false, value: '' },
        notes: { enabled: false, value: '' },
        target_site: { enabled: false, value: '' }
    });
    onClose();
  };

  const footer = (
    <div className="bulk-edit-modal__footer">
      <Button 
        variant="primary" 
        onClick={handleConfirm}
        disabled={!Object.values(updates).some(u => u.enabled)}
      >
        עדכן {selectedCount} פריטים
      </Button>
      <Button 
        variant="secondary" 
        onClick={handleClose}
      >
        ביטול
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="עדכון מרובה"
      size="medium"
      footer={footer}
    >
      <div className="bulk-edit-modal">
        <p style={{marginBottom: '1rem'}}>בחר את השדות שברצונך לעדכן:</p>
        
        {/* Purpose */}
        <div className="bulk-field-row">
            <div className="bulk-checkbox-wrapper">
                <input 
                    type="checkbox" 
                    id="chk-purpose" 
                    checked={updates.purpose.enabled} 
                    onChange={() => handleToggle('purpose')}
                />
                <label htmlFor="chk-purpose">יעוד</label>
            </div>
            <Input 
                disabled={!updates.purpose.enabled}
                value={updates.purpose.value}
                onChange={(e) => handleChange('purpose', e.target.value)}
                placeholder="הכנס יעוד חדש"
            />
        </div>

        {/* Target Site */}
        <div className="bulk-field-row">
            <div className="bulk-checkbox-wrapper">
                <input 
                    type="checkbox" 
                    id="chk-site" 
                    checked={updates.target_site.enabled} 
                    onChange={() => handleToggle('target_site')}
                />
                <label htmlFor="chk-site">אתר יעד</label>
            </div>
            <select
                className="bulk-select"
                disabled={!updates.target_site.enabled}
                value={updates.target_site.value}
                onChange={(e) => handleChange('target_site', e.target.value)}
            >
                <option value="">בחר אתר...</option>
                {TARGET_SITES.map(site => (
                    <option key={site} value={site}>{site}</option>
                ))}
            </select>
        </div>

        {/* Notes */}
        <div className="bulk-field-row">
            <div className="bulk-checkbox-wrapper">
                <input 
                    type="checkbox" 
                    id="chk-notes" 
                    checked={updates.notes.enabled} 
                    onChange={() => handleToggle('notes')}
                />
                <label htmlFor="chk-notes">הערות</label>
            </div>
             <Input 
                disabled={!updates.notes.enabled}
                value={updates.notes.value}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="הכנס הערה"
            />
        </div>

        <div className="bulk-edit-modal__warning">
            <div className="bulk-edit-modal__warning-icon">⚠️</div>
            <div className="bulk-edit-modal__warning-content">
              <strong>שים לב:</strong>
              <p>השינויים יחולו על כל הפריטים שנבחרו ודורסים ערכים קיימים.</p>
            </div>
        </div>

      </div>
    </Modal>
  );
};

export default BulkEditModal;
