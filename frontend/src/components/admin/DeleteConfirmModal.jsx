import React, { useState } from 'react';
import Modal from '../common/Modal/Modal';
import Button from '../common/Button/Button';
import { FiAlertTriangle } from 'react-icons/fi';
import './DeleteConfirmModal.css';

/**
 * Generic delete confirmation modal for admin entities (users, groups)
 */
const DeleteConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    entityName = '',
    entityType = 'פריט', // 'משתמש', 'קבוצה', etc.
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

    const footer = (
        <div className="delete-confirm-modal__footer">
            <Button variant="danger" onClick={handleConfirm}>
                מחק לצמיתות
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
            title={`מחיקת ${entityType}`}
            size="small"
            footer={footer}
        >
            <div className="delete-confirm-modal">
                {/* אייקון אזהרה */}
                <div className="delete-confirm-modal__icon">
                    <FiAlertTriangle size={48} />
                </div>

                {/* הודעה */}
                <div className="delete-confirm-modal__message">
                    <p>האם אתה בטוח שברצונך למחוק את ה{entityType}{entityName ? `: "${entityName}"` : ''}?</p>
                    <p className="delete-confirm-modal__warning">פעולה זו בלתי הפיכה!</p>
                </div>

                {/* שדה סיבת מחיקה */}
                <div className="delete-confirm-modal__form">
                    <label className="delete-confirm-modal__label">סיבת מחיקה</label>
                    <textarea
                        className="delete-confirm-modal__textarea"
                        value={reason}
                        onChange={(e) => {
                            setReason(e.target.value);
                            setError('');
                        }}
                        placeholder="למשל: חשבון לא בשימוש, טעות ביצירה..."
                        rows={3}
                        autoFocus
                    />
                    {error && <div className="delete-confirm-modal__error">{error}</div>}
                    <div className="delete-confirm-modal__hint">
                        💡 הסיבה תישמר ביומן הפעולות
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default DeleteConfirmModal;
