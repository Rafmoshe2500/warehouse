import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Input, Button } from '../common';
import collectionsService from '../../api/services/collectionsService';
import { useToast } from '../../context/ToastContext';
import './CreateCollectionDialog.css';

const CreateCollectionDialog = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const createMutation = useMutation({
    mutationFn: (data) => collectionsService.createCollection(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['collections']);
      showToast('האוסף נוצר בהצלחה', 'success');
      handleClose();
    },
    onError: (err) => {
      setError(err.response?.data?.detail || 'שגיאה ביצירת האוסף');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('שם האוסף הוא שדה חובה');
      return;
    }
    
    createMutation.mutate({
      name,
      description
    });
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="create-collection-overlay" onClick={handleClose}>
      <div className="create-collection-dialog" onClick={e => e.stopPropagation()}>
        <h2>צור אוסף חדש</h2>
        
        {error && (
          <div className="create-collection-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <Input
              label="שם האוסף"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="לדוגמה: רכיבי אלקטרוניקה"
              required
              autoFocus
            />
            
            <Input
              label="תיאור"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="תיאור קצר של האוסף..."
              multiline
              rows={3}
            />
          </div>

          <div className="dialog-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={createMutation.isPending}
            >
              ביטול
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'יוצר...' : 'צור אוסף'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

CreateCollectionDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

export default CreateCollectionDialog;
