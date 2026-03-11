import React, { useState } from 'react';
import Modal from '../../common/Modal/Modal';
import Button from '../../common/Button/Button';
import { FiAlertTriangle } from 'react-icons/fi';
import './DeleteConfirmation.css';

const DeleteConfirmation = ({
  isOpen,
  onClose,
  onConfirm,
  itemCount = 1,
  itemName = '',
  type = 'single', // 'single', 'bulk'
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (!reason || reason.trim().length < 3) {
      setError('חובה לציין סיבת מחיקה (לפחות 3 תווים)');
      return;
    }

    onConfirm(reason.trim());
    handleClose();
  };

  const handleClose = () => {
    setReason('');
    setError('');
    onClose();
  };

  const getTitle = () => {
    switch (type) {
      case 'bulk':
        return `מחיקת ${itemCount} פריטים`;
      default:
        return 'מחיקת פריט';
    }
  };

  const getMessage = () => {
    switch (type) {
      case 'bulk':
        return `האם אתה בטוח שברצונך למחוק ${itemCount} פריטים?`;
      default:
        return `האם אתה בטוח שברצונך למחוק את הפריט${itemName ? `: ${itemName}` : ''
          }?`;
    }
  };

  const footer = (
    <div className="delete-confirmation__footer">
      <Button variant="danger" onClick={handleConfirm}>
        מחק
      </Button>
      <Button variant="secondary" onClick={handleClose}>
        ביטול
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={getTitle()}
      size="small"
      footer={footer}
    >
      <div className="delete-confirmation">
        {/* אייקון אזהרה */}
        <div className="delete-confirmation__icon">
          <FiAlertTriangle size={48} />
        </div>

        {/* הודעה */}
        <div className="delete-confirmation__message">
          <p>{getMessage()}</p>
          <p className="delete-confirmation__warning">פעולה זו בלתי הפיכה!</p>
        </div>

        {/* שדה סיבת מחיקה */}
        <div className="delete-confirmation__form">
          <label className="delete-confirmation__label">סיבת מחיקה</label>
          <textarea
            className="delete-confirmation__textarea"
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setError('');
            }}
            placeholder="למשל: פריט פגום, סיום פרויקט, טעות בהזנה..."
            rows={3}
            autoFocus
          />
          {error && <div className="delete-confirmation__error">{error}</div>}
          <div className="delete-confirmation__hint">
            💡 הסיבה תישמר ביומן הפעולות
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteConfirmation;

