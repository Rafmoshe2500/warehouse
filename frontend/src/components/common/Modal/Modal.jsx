import React, { useEffect, useRef, useCallback } from 'react';
import { FiX } from 'react-icons/fi';
import './Modal.css';

const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'medium',
  closeOnOverlay = true,
  className = '',
}) => {
  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement;
      document.body.style.overflow = 'hidden';
      // Focus the modal container after render
      requestAnimationFrame(() => {
        modalRef.current?.focus();
      });
    } else {
      document.body.style.overflow = 'unset';
      // Restore focus to the element that triggered the modal
      previousFocusRef.current?.focus();
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      onClose();
      return;
    }

    // Focus trap: Tab cycles within modal
    if (e.key === 'Tab' && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll(FOCUSABLE_SELECTOR);
      if (focusableElements.length === 0) return;

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  }, [onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && closeOnOverlay) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div
        ref={modalRef}
        className={`modal modal--${size} ${className}`}
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
      >
        <div className="modal__header">
          <h2 className="modal__title">{title}</h2>
          <button className="modal__close" onClick={onClose} aria-label="סגור">
            <FiX size={24} />
          </button>
        </div>

        <div className="modal__body">{children}</div>

        {footer && <div className="modal__footer">{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;
