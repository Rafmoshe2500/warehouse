import React, { useState, useEffect } from 'react';
import { Button, Input, Select, Spinner } from '../common';
import { PROCUREMENT_STATUS_OPTIONS } from '../../utils/constants';
import './ProcurementModal.css';

const ProcurementModal = ({ isOpen, onClose, onSubmit, initialData = null, isEdit = false }) => {
  const [formData, setFormData] = useState({
    catalog_number: '',
    manufacturer: '',
    description: '',
    quantity: 1,
    order_date: new Date().toISOString().split('T')[0],
    amount: 0,
    status: 'waiting_emf',
    received_emf: false,
    received_bom: false
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        order_date: new Date(initialData.order_date).toISOString().split('T')[0]
      });
    } else {
      setFormData({
        catalog_number: '',
        manufacturer: '',
        description: '',
        quantity: 1,
        order_date: new Date().toISOString().split('T')[0],
        amount: 0,
        status: 'waiting_emf',
        received_emf: false,
        received_bom: false
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  };

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
    
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content procurement-modal" onClick={e => e.stopPropagation()}>
        <h2>{isEdit ? 'עריכת הזמנה' : 'הזמנה חדשה'}</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <Input
              label="מק&quot;ט"
              value={formData.catalog_number}
              onChange={e => setFormData({...formData, catalog_number: e.target.value})}
              required
              placeholder="הכנס מק&quot;ט"
            />

            <Input
              label="יצרן"
              value={formData.manufacturer}
              onChange={e => setFormData({...formData, manufacturer: e.target.value})}
              required
              placeholder="הכנס יצרן"
            />

            <div className="full-width">
              <Input
                label="תיאור"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                required
                multiline
                rows={3}
                placeholder="הכנס תיאור מפורט"
              />
            </div>

            <Input
              label="כמות"
              type="number"
              value={formData.quantity}
              onChange={e => setFormData({...formData, quantity: parseInt(e.target.value) || 0})}
              required
              min="1"
            />

            <Input
              label="סכום ($)"
              type="number"
              value={formData.amount}
              onChange={e => setFormData({...formData, amount: parseFloat(e.target.value) || 0})}
              required
              min="0"
              step="0.01"
            />

            <Input
              label="תאריך הזמנה"
              type="date"
              value={formData.order_date}
              onChange={e => setFormData({...formData, order_date: e.target.value})}
              required
            />

            <Select
              label="סטטוס"
              value={formData.status}
              onChange={handleStatusChange}
              options={getFilteredOptions()}
              required
            />

            <div className="form-checkboxes">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.received_emf}
                  onChange={e => handleCheckboxChange('received_emf', e.target.checked)}
                  disabled={formData.status === 'ordered' || formData.status === 'received'}
                />
                התקבל EMF
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.received_bom}
                  onChange={e => handleCheckboxChange('received_bom', e.target.checked)}
                  disabled={formData.status === 'ordered' || formData.status === 'received'}
                />
                התקבל BOM
              </label>
            </div>
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
            <Button 
              variant="primary" 
              type="submit" 
              disabled={loading}
            >
              {loading ? <Spinner size="small" /> : (isEdit ? 'שמור שינויים' : 'צור הזמנה')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProcurementModal;
