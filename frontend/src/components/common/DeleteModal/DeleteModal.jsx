
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Modal from '../Modal/Modal';
import Button from '../Button/Button';
import { FiAlertTriangle } from 'react-icons/fi';
import './DeleteModal.css';

/**
 * Standardized Delete Modal Component
 * Supports two modes:
 * 1. 'reason' (default) - Requires entering a reason for deletion
 * 2. 'verification' - Requires typing a specific text (e.g., entity name) to confirm
 */
const DeleteModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'מחיקת פריט',
    message = 'האם אתה בטוח שברצונך למחוק פריט זה?',
    warningText = 'פעולה זו בלתי הפיכה!',
    type = 'reason', // 'reason' | 'verification' | 'confirmation'
    verificationText = '', // Required if type === 'verification'
    placeholder = '',
    confirmText = 'מחק לצמיתות',
    cancelText = 'ביטול',
    isProcessing = false
}) => {
    const [inputValue, setInputValue] = useState('');
    const [error, setError] = useState('');

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setInputValue('');
            setError('');
        }
    }, [isOpen]);

    const handleConfirm = () => {
        setError('');

        if (type === 'confirmation') {
            onConfirm();
            return;
        }

        if (type === 'reason') {
            if (!inputValue || inputValue.trim().length < 3) {
                setError('חובה לציין סיבת מחיקה (לפחות 3 תווים)');
                return;
            }
            onConfirm(inputValue.trim());
        } else if (type === 'verification') {
            if (inputValue !== verificationText) {
                setError('הטקסט שהוקלד אינו תואם');
                return;
            }
            onConfirm();
        }
    };

    const isConfirmDisabled = () => {
        if (isProcessing) return true;
        if (type === 'confirmation') return false;
        if (type === 'verification') {
            return inputValue !== verificationText;
        }
        return false; // For 'reason', we validate on click to show error
    };

    const footer = (
        <div className="delete-modal__footer">
            <Button 
                variant="danger" 
                onClick={handleConfirm}
                disabled={isConfirmDisabled()}
                loading={isProcessing}
            >
                {confirmText}
            </Button>
            <Button variant="secondary" onClick={onClose} disabled={isProcessing}>
                {cancelText}
            </Button>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            size="small"
            footer={footer}
        >
            <div className="delete-modal">
                <div className="delete-modal__icon">
                    <FiAlertTriangle size={48} />
                </div>

                <div className="delete-modal__content">
                    <p className="delete-modal__message">{message}</p>
                    {warningText && (
                        <p className="delete-modal__warning">{warningText}</p>
                    )}
                </div>

                <div className="delete-modal__form">
                    {type === 'confirmation' ? null : type === 'reason' ? (
                        <>
                            <label className="delete-modal__label">סיבת מחיקה</label>
                            <textarea
                                className="delete-modal__textarea"
                                value={inputValue}
                                onChange={(e) => {
                                    setInputValue(e.target.value);
                                    setError('');
                                }}
                                placeholder={placeholder || "למשל: לא בשימוש, טעות בהזנה..."}
                                rows={3}
                                autoFocus
                            />
                            <div className="delete-modal__hint">
                                💡 הסיבה תישמר ביומן הפעולות
                            </div>
                        </>
                    ) : (
                        <>
                            <label className="delete-modal__label">
                                כדי לאשר, אנא הקלד: <strong>{verificationText}</strong>
                            </label>
                            <input
                                type="text"
                                className="delete-modal__input"
                                value={inputValue}
                                onChange={(e) => {
                                    setInputValue(e.target.value);
                                    setError('');
                                }}
                                placeholder={placeholder || verificationText}
                                autoFocus
                                autoComplete="off"
                                onPaste={(e) => e.preventDefault()} // Force typing for safety
                            />
                        </>
                    )}
                    
                    {error && <div className="delete-modal__error">{error}</div>}
                </div>
            </div>
        </Modal>
    );
};

DeleteModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired,
    title: PropTypes.string,
    message: PropTypes.node,
    warningText: PropTypes.string,
    type: PropTypes.oneOf(['reason', 'verification', 'confirmation']),
    verificationText: PropTypes.string,
    placeholder: PropTypes.string,
    confirmText: PropTypes.string,
    cancelText: PropTypes.string,
    isProcessing: PropTypes.bool
};

export default DeleteModal;
