import React, { useState, useEffect } from 'react';
import Button from '../../common/Button/Button';
import Input from '../../common/Input/Input'; // וודא שהנתיב נכון אצלך
import './ItemForm.css';

const ItemForm = ({ onSubmit, onCancel, initialData = {} }) => {
  // אתחול בטוח של הנתונים - אם אין מידע, שים מחרוזת ריקה
  const [formData, setFormData] = useState({
    catalog_number: initialData.catalog_number || '',
    serial: initialData.serial || '',
    description: initialData.description || '',
    manufacturer: initialData.manufacturer || '',
    location: initialData.location || '',
    current_stock: initialData.current_stock || '',
    warranty_expiry: initialData.warranty_expiry || '',
    reserved_stock: initialData.reserved_stock || '',
    purpose: initialData.purpose || '',
    notes: initialData.notes || '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form className="item-form" onSubmit={handleSubmit}>
      <div className="item-form__grid">
        <div className="form-group">
          <label>מק"ט (חובה)</label>
          <Input
            name="catalog_number"
            value={formData.catalog_number}
            onChange={handleChange}
            required
            placeholder="הזן מקט..."
          />
        </div>
        <div className="form-group">
          <label>מספר סריאלי</label>
          <Input
            name="serial"
            value={formData.serial}
            onChange={handleChange}
            placeholder="הזן סריאלי..."
          />
        </div>
        <div className="form-group">
          <label>תיאור פריט</label>
          <Input
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="הזן תיאור..."
          />
        </div>

        <div className="form-group">
          <label>יצרן</label>
          <Input
            name="manufacturer"
            value={formData.manufacturer}
            onChange={handleChange}
            placeholder="הזן יצרן..."
          />
        </div>

        <div className="form-group">
          <label>מיקום</label>
          <Input
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="הזן מיקום..."
          />
        </div>

        <div className="form-group">
          <label>מלאי נוכחי</label>
          <Input
            name="current_stock"
            type="number"
            value={formData.current_stock}
            onChange={handleChange}
            placeholder="0"
          />
        </div>

        <div className="form-group">
          <label>תוקף אחריות</label>
          <Input
            name="warranty_expiry"
            type="date"
            value={formData.warranty_expiry ? formData.warranty_expiry.split('T')[0] : ''}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>מלאי משורין</label>
          <Input
            name="reserved_stock"
            type="number"
            value={formData.reserved_stock}
            onChange={handleChange}
            placeholder="0"
          />
        </div>

        <div className="form-group">
          <label>ייעוד</label>
          <Input
            name="purpose"
            value={formData.purpose}
            onChange={handleChange}
            placeholder="הזן ייעוד..."
          />
        </div>

        <div className="form-group item-form__notes">
          <label>הערות</label>
          <Input
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="הזן הערות..."
            multiline
            rows={3}
          />
        </div>
      </div>

      <div className="form-actions">
        <Button type="button" variant="secondary" onClick={onCancel}>ביטול</Button>
        <Button type="submit" variant="primary">שמור פריט</Button>
      </div>
    </form>
  );
};

export default ItemForm;