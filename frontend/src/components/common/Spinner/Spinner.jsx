import React from 'react';
import './Spinner.css';

const Spinner = ({ size = 'medium', text = '' }) => {
  return (
    <div className="spinner-container">
      <div className={`spinner spinner--${size}`}></div>
      {text && <p className="spinner-text">{text}</p>}
    </div>
  );
};

export default Spinner;
