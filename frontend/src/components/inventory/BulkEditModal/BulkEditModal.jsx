import React, { useState, useEffect } from 'react';
import Modal from '../../common/Modal/Modal';
import Input from '../../common/Input/Input';
import Button from '../../common/Button/Button';
import { TARGET_SITES } from '../../../constants/sites';
import './BulkEditModal.css';

const BulkEditModal = ({ isOpen, onClose, onConfirm, selectedCount }) => {
  const [updates, setUpdates] = useState({
    purpose: { enabled: false, value: '' },
    notes: { enabled: false, value: '' },
    target_site: { enabled: false, value: '' },
    current_stock: { enabled: false, value: '' },
    warranty_expiry: { enabled: false, value: '' }
  });

  // Reset state whenever modal closes
  useEffect(() => {
    if (!isOpen) {
      setUpdates({
        purpose: { enabled: false, value: '' },
        notes: { enabled: false, value: '' },
        target_site: { enabled: false, value: '' },
        current_stock: { enabled: false, value: '' },
        warranty_expiry: { enabled: false, value: '' }
      });
    }
  }, [isOpen]);
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
    if (updates.current_stock.enabled && updates.current_stock.value !== '') changes.current_stock = Number(updates.current_stock.value);
    if (updates.warranty_expiry.enabled) changes.warranty_expiry = updates.warranty_expiry.value;

    if (Object.keys(changes).length > 0) {
      onConfirm(changes);
      handleClose();
    }
  };

  const handleClose = () => {
    setUpdates({
        purpose: { enabled: false, value: '' },
        notes: { enabled: false, value: '' },
        target_site: { enabled: false, value: '' },
        current_stock: { enabled: false, value: '' },
        warranty_expiry: { enabled: false, value: '' }
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

        {/* Current Stock */}
        <div className="bulk-field-row">
            <div className="bulk-checkbox-wrapper">
                <input
                    type="checkbox"
                    id="chk-stock"
                    checked={updates.current_stock.enabled}
                    onChange={() => handleToggle('current_stock')}
                />
                <label htmlFor="chk-stock">מלאי נוכחי</label>
            </div>
            <Input
                type="number"
                min="0"
                disabled={!updates.current_stock.enabled}
                value={updates.current_stock.value}
                onChange={(e) => handleChange('current_stock', e.target.value)}
                placeholder="הכנס כמות"
            />
        </div>

        {/* Warranty Expiry */}
        <div className="bulk-field-row">
            <div className="bulk-checkbox-wrapper">
                <input
                    type="checkbox"
                    id="chk-warranty"
                    checked={updates.warranty_expiry.enabled}
                    onChange={() => handleToggle('warranty_expiry')}
                />
                <label htmlFor="chk-warranty">תאריך אחריות</label>
            </div>
            <Input
                type="date"
                disabled={!updates.warranty_expiry.enabled}
                value={updates.warranty_expiry.value}
                onChange={(e) => handleChange('warranty_expiry', e.target.value)}
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
