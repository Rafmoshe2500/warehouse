import React from 'react';
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX } from 'react-icons/fi';
import './Toast.css';

const Toast = ({ type = 'info', message, onClose }) => {
  const icons = {
    success: <FiCheckCircle size={24} />,
    error: <FiAlertCircle size={24} />,
    info: <FiInfo size={24} />,
    warning: <FiAlertCircle size={24} />
  };

  return (
    <div className={`toast toast--${type}`}>
      <div className="toast__icon">{icons[type]}</div>
      <div className="toast__message">{message}</div>
      <button className="toast__close" onClick={onClose}>
        <FiX size={18} />
      </button>
    </div>
  );
};

export default Toast;
