import React, { useState, useRef } from 'react';
import { useToast } from '../../hooks/useToast';
import Spinner from '../common/Spinner/Spinner';
import './FileUploadZone.css';

const FileUploadZone = ({ onUpload, uploading, maxSize = 10 * 1024 * 1024 }) => {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const { error } = useToast();

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateFile = (file) => {
    if (file.size > maxSize) {
      error(`הקובץ גדול מדי. הגודל המקסימלי הוא ${maxSize / 1024 / 1024}MB`);
      return false;
    }
    return true;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        onUpload(file);
      }
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        onUpload(file);
      }
    }
  };

  const onButtonClick = () => {
    fileInputRef.current.click();
  };

  if (uploading) {
    return (
      <div className="file-upload-zone uploading">
        <Spinner size="medium" text="מעלה קובץ..." />
      </div>
    );
  }

  return (
    <div 
      className={`file-upload-zone ${dragActive ? "drag-active" : ""}`}
      onDragEnter={handleDrag} 
      onDragLeave={handleDrag} 
      onDragOver={handleDrag} 
      onDrop={handleDrop}
      onClick={onButtonClick}
    >
      <input 
        ref={fileInputRef}
        type="file" 
        className="file-input" 
        onChange={handleChange}
        accept=".pdf,.jpg,.jpeg,.png,.gif,.xlsx,.xls,.doc,.docx,.txt"
      />
      <div className="upload-content">
        <span className="upload-icon">☁️</span>
        <p>גרור קובץ לכאן או לחץ להעלאה</p>
        <span className="upload-hint">PDF, תמונות, אקסל, וורד (עד 10MB)</span>
      </div>
    </div>
  );
};

export default FileUploadZone;
