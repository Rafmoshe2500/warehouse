import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { FaPlus, FaTrash, FaCheck } from 'react-icons/fa';
import { Button, Input, Select } from '../../common'; // Assuming Checkbox exists or use input
import { useToast } from '../../../context/ToastContext';
import DeleteModal from '../../common/DeleteModal/DeleteModal';
import collectionsService from '../../../api/services/collectionsService';
import { useQueryClient } from '@tanstack/react-query';
import './CustomFieldsEditor.css';

const FIELD_TYPES = [
  { value: 'text', label: 'טקסט' },
  { value: 'number', label: 'מספר' },
  { value: 'date', label: 'תאריך' },
  { value: 'boolean', label: 'כן/לא' },
  { value: 'select', label: 'רשימה' }
];

const CustomFieldsEditor = ({ collection, canEdit }) => {
  const [newField, setNewField] = useState({
    label: '',
    key: '',
    type: 'text',
    required: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [removeConfirm, setRemoveConfirm] = useState({ isOpen: false, fieldKey: null });
  
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const generateKey = (label) => {
    // Simple slug generator for key
    return label.toLowerCase()
      .replace(/[^\w\s-]/g, '') // remove non-word chars
      .replace(/\s+/g, '_')     // replace spaces with underscore
      .substring(0, 20);
  };

  const handleLabelChange = (val) => {
    setNewField(prev => ({
      ...prev,
      label: val,
      key: prev.key || generateKey(val) // Auto-generate key if empty
    }));
  };

  const handleAddField = async () => {
    if (!newField.label || !newField.key) return;

    // Validate key uniqueness
    if (collection.custom_fields?.some(f => f.key === newField.key)) {
        showToast('קיים כבר שדה עם מזהה זה', 'error');
        return;
    }

    setIsSubmitting(true);
    try {
      const updatedFields = [...(collection.custom_fields || []), newField];
      
      await collectionsService.updateCollection(collection.id, {
        custom_fields: updatedFields
      });
      
      showToast('שדה נוסף בהצלחה', 'success');
      setNewField({ label: '', key: '', type: 'text', required: false });
      queryClient.invalidateQueries(['collection', collection.id]);
    } catch (error) {
       console.error(error);
       showToast('שגיאה בהוספת שדה', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveField = async () => {
    const fieldKey = removeConfirm.fieldKey;
    setRemoveConfirm({ isOpen: false, fieldKey: null });

    try {
        const updatedFields = collection.custom_fields.filter(f => f.key !== fieldKey);
        
        await collectionsService.updateCollection(collection.id, {
            custom_fields: updatedFields
        });
        
        showToast('שדה הוסר בהצלחה', 'success');
        queryClient.invalidateQueries(['collection', collection.id]);
    } catch (error) {
        showToast('שגיאה בהסרת שדה', 'error');
    }
  };

  if (!canEdit) {
      return (
          <div className="custom-fields-editor">
              <div className="fields-header">
                <h3>שדות מותאמים אישית</h3>
                <p>אין לך הרשאת עריכה להגדרות אלו.</p>
              </div>
          </div>
      );
  }

  return (
    <div className="custom-fields-editor" dir="rtl">
      <div className="fields-header">
        <h3>שדות מותאמים אישית</h3>
        <p>הגדר שדות נוספים עבור הפריטים באוסף זה (כגון: מספר סידורי, תאריך תפוגה, הערות).</p>
      </div>

      <div className="custom-fields-content">
        <div className="add-field-form">
        <Input
          label="שם השדה"
          placeholder="לדוגמה: מספר סידורי"
          value={newField.label}
          onChange={(e) => handleLabelChange(e.target.value)}
          disabled={isSubmitting}
        />
        
        <Select
          label="סוג שדה"
          value={newField.type}
          onChange={(e) => setNewField({...newField, type: e.target.value})}
          options={FIELD_TYPES}
          disabled={isSubmitting}
        />

        <div className="field-form-group checkbox-group">
            <label className="text-sm mb-2 text-gray-400">חובה?</label>
            <input 
                type="checkbox"
                checked={newField.required}
                onChange={(e) => setNewField({...newField, required: e.target.checked})}
                className="w-5 h-5 rounded border-gray-300"
            />
        </div>
        
        {/* Placeholder for Key manual edit if needed, or hidden */}
        {/* Placeholder for Key manual edit if needed, or hidden */}
        <div className="field-form-group key-display">
             <label className="text-xs text-gray-400 mb-1">מזהה מערכת</label>
             <div className="text-sm font-mono bg-gray-100 dark:bg-slate-800 p-2 rounded">
                 {newField.key || '-'}
             </div>
        </div>

        <Button
          variant="primary"
          onClick={handleAddField}
          disabled={!newField.label || isSubmitting}
          loading={isSubmitting}
          icon={<FaPlus />}
        >
          הוסף
        </Button>
      </div>

      <div className="fields-list">
         <div className="field-item header font-bold text-gray-500 border-none bg-transparent">
             <span>שם השדה</span>
             <span>סוג</span>
             <span className="text-center">חובה</span>
             <span>מזהה</span>
             <span></span>
         </div>
         
         {collection.custom_fields?.map((field) => (
             <div key={field.key} className="field-item">
                 <div className="field-item-label">
                     {field.label}
                 </div>
                 <div className="field-type-badge">
                     {FIELD_TYPES.find(t => t.value === field.type)?.label || field.type}
                 </div>
                 <div className="field-required-check">
                     {field.required && <FaCheck />}
                 </div>
                 <div className="field-item-key">
                     {field.key}
                 </div>
                 <div className="flex justify-end">
                     <Button 
                         variant="ghost" 
                         className="text-red-500 hover:text-red-700"
                         onClick={() => setRemoveConfirm({ isOpen: true, fieldKey: field.key })}
                         icon={<FaTrash />}
                     />
                 </div>
             </div>
         ))}

         {(!collection.custom_fields || collection.custom_fields.length === 0) && (
             <div className="text-center text-gray-500 py-4">
                 אין שדות מותאמים אישית
             </div>
         )}
      </div>
      </div>

      <DeleteModal
        isOpen={removeConfirm.isOpen}
        onClose={() => setRemoveConfirm({ isOpen: false, fieldKey: null })}
        onConfirm={handleRemoveField}
        title="הסרת שדה"
        message="האם אתה בטוח? מחיקת שדה לא תמחק את המידע הקיים אך הוא לא יוצג יותר."
        type="confirmation"
        confirmText="הסר"
      />
    </div>
  );
};

CustomFieldsEditor.propTypes = {
  collection: PropTypes.object.isRequired,
  canEdit: PropTypes.bool
};

export default CustomFieldsEditor;
