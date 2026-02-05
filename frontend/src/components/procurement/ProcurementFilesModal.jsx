import React, { useState } from 'react';
import Spinner from '../common/Spinner/Spinner';
import FileUploadZone from './FileUploadZone';
import { useAuth } from '../../context/AuthContext';
import procurementService from '../../api/services/procurementService';
import './ProcurementFilesModal.css';
import { useToast } from '../../hooks/useToast';

const ProcurementFilesModal = ({ isOpen, onClose, order, onFileChange }) => {
  const { isAdmin, isSuperAdmin } = useAuth();
  const { error, success } = useToast();
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const canEdit = isAdmin || isSuperAdmin;

  const handleUpload = async (file) => {
    setUploading(true);
    try {
      await procurementService.uploadFile(order.id, file);
      success('הקובץ הועלה בהצלחה');
      onFileChange(); // Refresh order data
    } catch (err) {
      error(err.response?.data?.detail || 'שגיאה בהעלאת הקובץ');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (file) => {
    try {
      await procurementService.downloadFile(order.id, file.file_id, file.filename);
    } catch (err) {
      error('שגיאה בהורדת הקובץ');
    }
  };

  const handleDelete = async (fileId) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק קובץ זה?')) return;
    
    setDeletingId(fileId);
    try {
      await procurementService.deleteFile(order.id, fileId);
      success('הקובץ נמחק בהצלחה');
      onFileChange();
    } catch (err) {
      error('שגיאה במחיקת הקובץ');
    } finally {
      setDeletingId(null);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen || !order) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content files-modal" onClick={e => e.stopPropagation()}>
        <div className="files-modal-header">
          <h2>קבצים מצורפים - {order.catalog_number}</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="files-list">
          {order.files && order.files.length > 0 ? (
            order.files.map(file => (
              <div key={file.file_id} className="file-item">
                <div className="file-info">
                  <span className="file-icon">📄</span>
                  <div className="file-details">
                    <span className="file-name">{file.filename}</span>
                    <span className="file-meta">
                      {formatFileSize(file.file_size)} • {new Date(file.uploaded_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="file-actions">
                  <button 
                    className="action-btn download-btn"
                    onClick={() => handleDownload(file)}
                    title="הורד"
                  >
                    ⬇️
                  </button>
                  {canEdit && (
                    <button 
                      className="action-btn delete-btn"
                      onClick={() => handleDelete(file.file_id)}
                      disabled={deletingId === file.file_id}
                      title="מחק"
                    >
                      {deletingId === file.file_id ? '...' : '🗑️'}
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="no-files">אין קבצים מצורפים</div>
          )}
        </div>

        {canEdit && (
          <div className="upload-section">
            <h3>העלאת קובץ חדש</h3>
            <FileUploadZone onUpload={handleUpload} uploading={uploading} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProcurementFilesModal;
