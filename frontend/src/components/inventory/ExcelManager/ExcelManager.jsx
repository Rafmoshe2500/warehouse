import React from 'react';
import Modal from '../../common/Modal/Modal';
import Button from '../../common/Button/Button';
import { FiFileText, FiLayers } from 'react-icons/fi';
import './ExcelManager.css';

/**
 * ExcelManager Component
 * Manages Excel import/export UI without business logic
 * Business logic is handled by parent (InventoryPage)
 */
const ExcelManager = ({
  fileInputRef,
  showExportModal,
  onCloseExport,
  onUploadClick,
  onExecuteExport,
  onUploadChange,
  totalItems,
  currentPageItems = 0,
  uploading = false,
}) => {
  if (!fileInputRef) return null;

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={onUploadChange}
        style={{ display: 'none' }}
      />

      {/* Export Options Modal */}
      <Modal
        isOpen={showExportModal}
        onClose={onCloseExport}
        title="אפשרויות ייצוא לאקסל"
      >
        <div className="export-options-modal">
          <p style={{ marginBottom: '20px', color: '#666' }}>
            כיצד תרצה לייצא את הנתונים?
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Button
              onClick={() => onExecuteExport('current')}
              variant="secondary"
              style={{ justifyContent: 'flex-start', padding: '12px' }}
            >
              <FiFileText style={{ marginLeft: '10px' }} />
              ייצא עמוד נוכחי בלבד ({currentPageItems} שורות)
            </Button>

            <Button
              onClick={() => onExecuteExport('all')}
              variant="primary"
              style={{ justifyContent: 'flex-start', padding: '12px' }}
            >
              <FiLayers style={{ marginLeft: '10px' }} />
              ייצא את כל התוצאות ({totalItems} שורות)
            </Button>
          </div>
          <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '15px', display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={onCloseExport}>ביטול</Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ExcelManager;
