import React from 'react';
import Modal from '../Modal/Modal';
import Button from '../Button/Button';
import './NavigationWarningModal.css';

/**
 * Modal to warn users about navigating away with unsaved changes
 */
const NavigationWarningModal = ({ isOpen, onConfirm, onCancel }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title="אזהרה - שינויים לא שמורים"
      size="small"
      closeOnOverlay={false}
    >
      <div className="navigation-warning-modal">
        <div className="navigation-warning-modal__icon">
          ⚠️
        </div>
        <p className="navigation-warning-modal__message">
          בעת מעבר לעמוד אחר, כל השינויים יישמרו ללא יכולת שחזור.
        </p>
        <p className="navigation-warning-modal__submessage">
          האם אתה בטוח שברצונך להמשיך?
        </p>
      </div>

      <div className="navigation-warning-modal__footer">
        <Button onClick={onCancel} variant="secondary">
          בטל
        </Button>
        <Button onClick={onConfirm} variant="primary">
          המשך בכל זאת
        </Button>
      </div>
    </Modal>
  );
};

export default NavigationWarningModal;
