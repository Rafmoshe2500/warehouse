import React from 'react';
import './Spinner.css';

const Spinner = ({ size = 'medium', text = '', inline = false, className = '' }) => {
  if (inline) {
    return (
      <div className={`spinner spinner--${size} spinner--inline ${className}`} title={text}></div>
    );
  }

  return (
    <div className={`spinner-container ${className}`}>
      <div className={`spinner spinner--${size}`}></div>
      {text && <p className="spinner-text">{text}</p>}
    </div>
  );
};

export default Spinner;
