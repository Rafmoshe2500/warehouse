import React, { useState } from 'react';
import FileUploadZone from './FileUploadZone';
import procurementService from '../../api/services/procurementService';
import './ProcurementFilesModal.css';
import { useToast } from '../../context/ToastContext';
import DeleteModal from '../common/DeleteModal/DeleteModal';

const ProcurementFilesModal = ({ isOpen, onClose, order, onFileChange, canEdit = false }) => {
  const { showToast } = useToast();
  const error = (msg) => showToast(msg, 'error');
  const success = (msg) => showToast(msg, 'success');

  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, fileId: null });

  const handleUpload = async (file) => {
    setUploading(true);
    const uploadStartTime = Date.now();
    
    try {
      await procurementService.uploadFile(order.id, file);
      success('הקובץ הועלה בהצלחה');
      
      // Ensure minimum animation display time (1500ms) on success only
      const elapsedTime = Date.now() - uploadStartTime;
      const remainingTime = Math.max(0, 1500 - elapsedTime);
      if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }
      
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

  const handleDeleteClick = (fileId) => {
    setDeleteConfirm({ isOpen: true, fileId });
  };

  const handleDeleteConfirm = async () => {
    const fileId = deleteConfirm.fileId;
    setDeleteConfirm({ isOpen: false, fileId: null });
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
    if (bytes == null || isNaN(bytes)) return '—';
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
          <h2>קבצים מצורפים - {order.emf_number || order.bom_vendor || 'הזמנה'}</h2>
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
                      onClick={() => handleDeleteClick(file.file_id)}
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

        <DeleteModal
          isOpen={deleteConfirm.isOpen}
          onClose={() => setDeleteConfirm({ isOpen: false, fileId: null })}
          onConfirm={handleDeleteConfirm}
          title="מחיקת קובץ"
          message="האם אתה בטוח שברצונך למחוק קובץ זה?"
          type="confirmation"
          confirmText="מחק"
        />
      </div>
    </div>
  );
};

export default ProcurementFilesModal;
