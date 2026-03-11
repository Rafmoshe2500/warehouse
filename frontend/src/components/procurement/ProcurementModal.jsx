import React, { useState, useEffect } from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { Button, Input, Select } from '../common';
import Spinner from '../common/Spinner/Spinner';
import { PROCUREMENT_STATUS_OPTIONS } from '../../utils/constants';
import { useToast } from '../../hooks/useToast';
import { useCatalog } from '../../hooks/useCatalog';
import { useDebounce } from '../../hooks/useDebounce';
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
    status: 'waiting_bom_emf',
    emf_number: '',
    received_bom: false
  });
  const [loading, setLoading] = useState(false);
  const [expandedItemId, setExpandedItemId] = useState(1);
  const { error: toastError } = useToast();

  // --- Auto-Complete State ---
  const [activeSuggestionItemId, setActiveSuggestionItemId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  // Fetch suggestions only when query length is >= 5 chars
  const { items: catalogSuggestions, loading: loadingSuggestions } = useCatalog({
      search: debouncedSearchQuery,
      limit: 10
  });

  // Automatically check for exact match or show dropdown
  useEffect(() => {
    if (!activeSuggestionItemId || debouncedSearchQuery.length < 5) return;

    // Check exact match (100% matched by text, case-insensitive)
    const exactMatch = catalogSuggestions?.find(
        (c) => c.catalog_number.trim().toLowerCase() === debouncedSearchQuery.trim().toLowerCase()
    );

    if (exactMatch) {
       // Auto-fill manufacturer and description if exact match!
       setFormData(prev => ({
           ...prev,
           bom_items: prev.bom_items.map(item => 
               item.item_id === activeSuggestionItemId
                   ? { 
                       ...item, 
                       manufacturer: exactMatch.manufacturer, 
                       description: exactMatch.description 
                   }
                   : item
           )
       }));
       // Optionally close suggestions immediately upon exact match
       // setActiveSuggestionItemId(null); 
    }
  }, [catalogSuggestions, debouncedSearchQuery, activeSuggestionItemId]);

  const handleSuggestionSelect = (itemId, suggestion) => {
    setFormData(prev => ({
       ...prev,
       bom_items: prev.bom_items.map(item => 
           item.item_id === itemId
               ? { 
                   ...item, 
                   catalog_number: suggestion.catalog_number,
                   manufacturer: suggestion.manufacturer, 
                   description: suggestion.description 
               }
               : item
       )
    }));
    setActiveSuggestionItemId(null);
    setSearchQuery('');
  };

  // Get status label
  const getStatusLabel = () => {
    const { emf_number, received_bom, status } = formData;
    if (status === 'received') return '✓ רכש הגיע';
    if (status === 'ordered') return '✓ רכש יצא';
    if (emf_number && received_bom) return 'מחכה שרכש ייצא';
    if (emf_number && !received_bom) return 'מחכה ל-BOM';
    if (!emf_number && received_bom) return 'מחכה ל-EMF';
    return 'מחכה ל-BOM ו-EMF';
  };

  // Check if both EMF and BOM are received
  const canMarkAsCompleted = () => {
    return !!formData.emf_number && formData.received_bom;
  };

  // Check if at least one is received
  const canSave = () => {
    return true; // Always allow save, especially in edit mode to revert status
  };

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        order_date: new Date(initialData.order_date).toISOString().split('T')[0],
        emf_number: initialData.emf_number || ''
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
        status: 'waiting_bom_emf',
        emf_number: '',
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
    let statusToSubmit = formData.status;
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

  // Filter options based on state
  const getFilteredOptions = () => {
    return PROCUREMENT_STATUS_OPTIONS.filter(option => {
      if (formData.emf_number && option.value === 'waiting_bom_emf') return false;
      if (formData.emf_number && option.value === 'waiting_emf') return false;
      if (formData.received_bom && option.value === 'waiting_bom_emf') return false;
      if (formData.received_bom && option.value === 'waiting_bom') return false;
      return true;
    });
  };

  const handleStatusChange = (e) => {
    setFormData({ ...formData, status: e.target.value });
  };

  const handleCheckboxChange = (field, checked) => {
    setFormData({ ...formData, [field]: checked });
  };

  const handleEmfNumberChange = (e) => {
    const val = e.target.value;
    const updates = { emf_number: val };
    
    // Add temporary logic here just in case, but actual calculation happens on backend
    if (!val && formData.status !== 'received' && formData.status !== 'ordered') {
      updates.status = formData.received_bom ? 'waiting_emf' : 'waiting_bom_emf';
    } else if (val && formData.status !== 'received' && formData.status !== 'ordered') {
      updates.status = formData.received_bom ? 'waiting_order' : 'waiting_bom';
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

    if (field === 'catalog_number') {
        setSearchQuery(value);
        if (value.length >= 5) {
            setActiveSuggestionItemId(itemId);
        } else {
            setActiveSuggestionItemId(null);
        }
    }
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
                        <div className="autocomplete-container" style={{ position: 'relative' }}>
                          <Input
                            label='מק"ט'
                            value={item.catalog_number}
                            onChange={e => updateBomItem(item.item_id, 'catalog_number', e.target.value)}
                            onFocus={() => {
                               if (item.catalog_number.length >= 5) {
                                  setSearchQuery(item.catalog_number);
                                  setActiveSuggestionItemId(item.item_id);
                               }
                            }}
                            onBlur={() => {
                               // Delay hiding to allow click events on suggestions
                               setTimeout(() => setActiveSuggestionItemId(null), 200);
                            }}
                            required
                            placeholder='הכנס מק"ט'
                          />
                          
                          {/* Auto-Complete Dropdown */}
                          {activeSuggestionItemId === item.item_id && debouncedSearchQuery.length >= 5 && (
                             <div className="autocomplete-dropdown">
                                {loadingSuggestions ? (
                                   <div className="autocomplete-loading"><Spinner inline size="small" /> מחפש...</div>
                                ) : catalogSuggestions?.length > 0 ? (
                                   catalogSuggestions.map(suggestion => (
                                      <div 
                                         key={suggestion._id} 
                                         className="autocomplete-item"
                                         onMouseDown={(e) => {
                                             e.preventDefault(); // Prevent input onBlur from firing before click
                                             handleSuggestionSelect(item.item_id, suggestion);
                                         }}
                                      >
                                          <div className="ac-cat">{suggestion.catalog_number}</div>
                                          <div className="ac-details">{suggestion.manufacturer} | {suggestion.description}</div>
                                      </div>
                                   ))
                                ) : (
                                   <div className="autocomplete-empty">לא נמצאו התאמות</div>
                                )}
                             </div>
                          )}
                        </div>

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
              <div className="bom-controls-left" style={{ alignItems: 'center' }}>
                {(!formData.emf_number && formData.emf_number !== null && !formData.emf_number.trim()) ? (
                   <div style={{ width: '220px', display: 'flex', alignItems: 'center', height: '38px' }}>
                     <label className="checkbox-label" style={{ marginBottom: 0 }}>
                       <input
                         type="checkbox"
                         checked={false}
                         onChange={(e) => {
                           if (e.target.checked) setFormData({...formData, emf_number: ' '}); // Space to trigger input
                         }}
                       />
                       <span>התקבל EMF</span>
                     </label>
                   </div>
                ) : (
                   <div style={{ width: '220px', display: 'flex', alignItems: 'center', gap: '8px', height: '38px' }}>
                     <Input
                        placeholder="מספר EMF..."
                        value={formData.emf_number.trim()}
                        onChange={handleEmfNumberChange}
                        onBlur={(e) => {
                           if (!e.target.value.trim()) {
                               handleEmfNumberChange({ target: { value: '' } });
                           }
                        }}
                        autoFocus
                     />
                     <Button 
                       variant="icon" 
                       type="button" 
                       onClick={() => handleEmfNumberChange({ target: { value: '' } })} 
                       title="נקה EMF"
                       className="delete-btn"
                     >
                       <FiTrash2 size={14} />
                     </Button>
                   </div>
                )}

                <label className="checkbox-label" style={{ marginBottom: 0 }}>
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
