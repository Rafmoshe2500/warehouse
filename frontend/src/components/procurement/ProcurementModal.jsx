import React, { useState, useEffect } from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { Button, Input, Select } from '../common';
import Spinner from '../common/Spinner/Spinner';
import { PROCUREMENT_STATUS_OPTIONS } from '../../utils/constants';
import { useToast } from '../../hooks/useToast';
import './ProcurementModal.css';

const ProcurementModal = ({ isOpen, onClose, onSubmit, initialData = null, isEdit = false }) => {
  const [formData, setFormData] = useState({
    order_date: new Date().toISOString().split('T')[0],
    bom_items: [
      {
        item_id: 1,
        catalog_number: '',
        manufacturer: '',
        description: '',
        quantity: 1
      }
    ],
    total_amount: 0,
    status: 'waiting_emf',
    received_emf: false,
    received_bom: false
  });
  const [loading, setLoading] = useState(false);
  const [expandedItemId, setExpandedItemId] = useState(1);
  const { error: toastError } = useToast();

  // Calculate status based on checkboxes
  const calculateStatus = (received_emf, received_bom) => {
    if (received_emf && received_bom) return 'ordered';
    if (received_emf || received_bom) return received_emf ? 'waiting_bom' : 'waiting_emf';
    return 'waiting_emf';
  };

  // Get status label
  const getStatusLabel = () => {
    const { received_emf, received_bom } = formData;
    if (received_emf && received_bom) return '✓ סטטוס יצא לדרך';
    if (received_emf && !received_bom) return 'מחכים ל-BOM';
    if (!received_emf && received_bom) return 'מחכים ל-EMF';
    return 'מחכים ל-BOM + EMF';
  };

  // Check if both EMF and BOM are received
  const canMarkAsCompleted = () => {
    return formData.received_emf && formData.received_bom;
  };

  // Check if at least one is received
  const canSave = () => {
    return true; // Always allow save, especially in edit mode to revert status
  };

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        order_date: new Date(initialData.order_date).toISOString().split('T')[0]
      });
    } else {
      setFormData({
        order_date: new Date().toISOString().split('T')[0],
        bom_items: [
          {
            item_id: 1,
            catalog_number: '',
            manufacturer: '',
            description: '',
            quantity: 1
          }
        ],
        total_amount: 0,
        status: 'waiting_emf',
        received_emf: false,
        received_bom: false
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e, submissionType = 'save') => {
    e.preventDefault();
    
    // Validate all items are complete
    const allValid = formData.bom_items.every(item => 
      item.catalog_number.trim() && 
      item.manufacturer.trim() && 
      item.description.trim() && 
      item.quantity >= 1
    );
    
    if (!allValid) {
      toastError('יש למלא את כל הפרטים של כל הפריטים');
      return;
    }

    if (!formData.total_amount || formData.total_amount <= 0) {
      toastError('יש להזין סכום הזמנה גדול מ-0');
      return;
    }

    // Determine status based on submission type
    let statusToSubmit = calculateStatus(formData.received_emf, formData.received_bom);
    if (isEdit && submissionType === 'complete') {
      statusToSubmit = 'received'; // Mark as received/completed
    }

    const dataToSubmit = {
      ...formData,
      status: statusToSubmit
    };

    setLoading(true);
    try {
      await onSubmit(dataToSubmit);
    } finally {
      setLoading(false);
    }
  };;

  // Filter options based on checkbox state
  const getFilteredOptions = () => {
    return PROCUREMENT_STATUS_OPTIONS.filter(option => {
      if (formData.received_emf && option.value === 'waiting_emf') return false;
      if (formData.received_bom && option.value === 'waiting_bom') return false;
      return true;
    });
  };

  const handleStatusChange = (e) => {
    const newStatus = e.target.value;
    let updates = { status: newStatus };

    // Auto-check boxes if Ordered is selected
    if (newStatus === 'ordered' || newStatus === 'received') {
      updates.received_emf = true;
      updates.received_bom = true;
    }

    setFormData({ ...formData, ...updates });
  };

  const handleCheckboxChange = (field, checked) => {
    const updates = { [field]: checked };
    
    if (checked) {
      if (field === 'received_emf' && formData.status === 'waiting_emf') {
        updates.status = 'waiting_bom';
      } else if (field === 'received_bom' && formData.status === 'waiting_bom') {
        updates.status = 'ordered';
      }
    }
    
    setFormData({ ...formData, ...updates });
  };

  // Add new BOM item
  const addBomItem = () => {
    const newItemId = Math.max(...formData.bom_items.map(i => i.item_id), 0) + 1;
    setFormData({
      ...formData,
      bom_items: [
        ...formData.bom_items,
        {
          item_id: newItemId,
          catalog_number: '',
          manufacturer: '',
          description: '',
          quantity: 1
        }
      ]
    });
    // Switch to new item immediately
    setExpandedItemId(newItemId);
  };

  // Remove BOM item
  const removeBomItem = (itemId) => {
    if (formData.bom_items.length > 1) {
      setFormData({
        ...formData,
        bom_items: formData.bom_items.filter(i => i.item_id !== itemId)
      });
    }
  };

  // Update BOM item field
  const updateBomItem = (itemId, field, value) => {
    setFormData({
      ...formData,
      bom_items: formData.bom_items.map(item =>
        item.item_id === itemId ? { ...item, [field]: value } : item
      )
    });
  };

  // Check if current item is valid
  const isCurrentItemValid = (itemId) => {
    const item = formData.bom_items.find(i => i.item_id === itemId);
    if (!item) return false;
    return (
      item.catalog_number.trim() !== '' &&
      item.manufacturer.trim() !== '' &&
      item.description.trim() !== '' &&
      item.quantity >= 1
    );
  };

  // Check if all items before last one are valid
  const canAddItem = () => {
    const lastItem = formData.bom_items[formData.bom_items.length - 1];
    return isCurrentItemValid(lastItem.item_id);
  };
    
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content procurement-modal" onClick={e => e.stopPropagation()}>
        <h2>{isEdit ? 'עריכת הזמנה' : 'הזמנה חדשה'}</h2>
        
        <form>
          <div className="form-grid">
            <div className="form-row">
              <Input
                label="תאריך הזמנה"
                type="date"
                value={formData.order_date}
                onChange={e => setFormData({...formData, order_date: e.target.value})}
                required
              />

              <Input
                label="סכום ההזמנה"
                type="number"
                value={formData.total_amount}
                onChange={e => setFormData({...formData, total_amount: parseFloat(e.target.value) || 0})}
                required
                min="0"
                step="0.01"
                placeholder="סכום כללי"
              />
            </div>
            <div className="full-width">
              <h3 className="bom-section-title">מק"טים בהזמנה</h3>
              
              <div className="bom-tabs-container">
                {/* BOM Item Tabs */}
                <div className="bom-tabs">
                  {formData.bom_items.map((item, index) => (
                    <div key={item.item_id} className="bom-tab-wrapper">
                      <button
                        type="button"
                        className={`bom-tab ${expandedItemId === item.item_id ? 'active' : ''} ${isCurrentItemValid(item.item_id) ? 'valid' : 'invalid'}`}
                        onClick={() => setExpandedItemId(item.item_id)}
                      >
                        <span className="bom-tab-number">{index + 1}</span>
                        <span className="bom-tab-label">
                          {item.catalog_number || 'פריט חדש'}
                        </span>
                      </button>
                      {formData.bom_items.length > 1 && (
                        <button
                          type="button"
                          className="bom-tab-delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeBomItem(item.item_id);
                            if (expandedItemId === item.item_id && formData.bom_items.length > 1) {
                              setExpandedItemId(formData.bom_items[0].item_id);
                            }
                          }}
                          title="הסר"
                        >
                          <FiTrash2 />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* BOM Item Content */}
                {formData.bom_items.map((item) => (
                  expandedItemId === item.item_id && (
                    <div key={item.item_id} className="bom-item-content">
                      <div className="bom-item-grid">
                        <Input
                          label='מק"ט'
                          value={item.catalog_number}
                          onChange={e => updateBomItem(item.item_id, 'catalog_number', e.target.value)}
                          required
                          placeholder='הכנס מק"ט'
                        />

                        <Input
                          label="יצרן"
                          value={item.manufacturer}
                          onChange={e => updateBomItem(item.item_id, 'manufacturer', e.target.value)}
                          required
                          placeholder="הכנס יצרן"
                        />

                        <Input
                          label="כמות"
                          type="number"
                          value={item.quantity}
                          onChange={e => updateBomItem(item.item_id, 'quantity', parseInt(e.target.value) || 1)}
                          required
                          min="1"
                        />
                      </div>

                      <Input
                        label="תיאור"
                        value={item.description}
                        onChange={e => updateBomItem(item.item_id, 'description', e.target.value)}
                        placeholder='תיאור המק"ט'
                        className="full-width-input"
                        required
                      />
                    </div>
                  )
                ))}
              </div>
            </div>
          </div>

          {/* Buttons with Status */}
                      {/* Controls: Checkboxes on left, Add Button on right */}
            <div className="bom-controls-row">
                            <button
                type="button"
                className="add-bom-item-btn"
                onClick={addBomItem}
                disabled={!canAddItem()}
                title={canAddItem() ? 'הוסף מק"ט נוסף' : 'מלא את הפרטים של הפריט הנוכחי תחילה'}
              >
                <FiPlus /> הוסף מק"ט נוסף
              </button>
              <div className="bom-controls-left">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.received_emf}
                    onChange={e => setFormData({...formData, received_emf: e.target.checked})}
                  />
                  <span>התקבל EMF</span>
                </label>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.received_bom}
                    onChange={e => setFormData({...formData, received_bom: e.target.checked})}
                  />
                  <span>התקבל BOM</span>
                </label>
              </div>
            </div>
          <div className="modal-actions-wrapper">
            <div className="status-info-inline">
              <span className="status-info-label">סטטוס:</span>
              <span className="status-badge-inline">{getStatusLabel()}</span>
            </div>
            <div className="modal-actions">
              <Button 
                variant="secondary" 
                onClick={onClose} 
                disabled={loading}
                type="button"
              >
                ביטול
              </Button>
              {isEdit ? (
                <>
                  {canSave() && (
                    <Button 
                      variant="primary" 
                      onClick={(e) => handleSubmit(e, 'save')}
                      disabled={loading}
                      type="button"
                    >
                      {loading ? <Spinner size="small" /> : 'שמור'}
                    </Button>
                  )}
                  {canMarkAsCompleted() && (
                    <Button 
                      variant="success" 
                      onClick={(e) => handleSubmit(e, 'complete')}
                      disabled={loading}
                      type="button"
                    >
                      {loading ? <Spinner size="small" /> : 'הושלם'}
                    </Button>
                  )}
                </>
              ) : (
                <Button 
                  variant="primary" 
                  type="button"
                  disabled={loading}
                  onClick={(e) => handleSubmit(e, 'save')}
                >
                  {loading ? <Spinner size="small" /> : 'צור הזמנה'}
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProcurementModal;
