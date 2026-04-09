import React from 'react';
import ItemForm from '../ItemForm/ItemForm';
import DeleteModal from '../../common/DeleteModal/DeleteModal';
import BulkEditModal from '../BulkEditModal/BulkEditModal';
import AssociatedCollectionsModal from '../AssociatedCollectionsModal/AssociatedCollectionsModal';
import Modal from '../../common/Modal/Modal';
import './InventoryModals.css';

const InventoryModals = ({
  // Item Form Modal
  isItemFormOpen,
  onCloseItemForm,
  onSaveItem,
  editingItem,

  // Delete Confirmation Modal
  isDeleteOpen,
  onCloseDelete,
  onConfirmDelete,
  deletingItemName,

  // Bulk Edit Modal
  isBulkEditOpen,
  onCloseBulkEdit,
  onConfirmBulkEdit,
  selectedCount,

  // Export Modal
  showExportModal,
  onCloseExport,
  exportProgress,
  onExecuteExport,

  // Associated Collections Modal
  showCollectionsModal,
  onCloseCollectionsModal,
  collectionsModalItem,
}) => {
  return (
    <>
      {/* Item Form Modal for Create/Edit */}
      <Modal
        isOpen={isItemFormOpen}
        onClose={onCloseItemForm}
        title={editingItem ? 'עריכת פריט' : 'הוספת פריט חדש'}
      >
        <ItemForm
          initialItem={editingItem}
          onSubmit={onSaveItem}
          onCancel={onCloseItemForm}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={isDeleteOpen}
        onClose={onCloseDelete}
        onConfirm={onConfirmDelete}
        type="reason"
        title="מחיקת פריט"
        message={`האם אתה בטוח שברצונך למחוק את הפריט${deletingItemName ? `: ${deletingItemName}` : ''}?`}
        warningText="פעולה זו בלתי הפיכה!"
        placeholder="למשל: פריט פגום, סיום פרויקט, טעות בהזנה..."
      />

      {/* Bulk Edit Modal */}
      <BulkEditModal
        isOpen={isBulkEditOpen}
        onClose={onCloseBulkEdit}
        onConfirm={onConfirmBulkEdit}
        selectedCount={selectedCount}
      />

      {/* Export Progress Modal */}
      {showExportModal && (
        <Modal
          isOpen={showExportModal}
          onClose={onCloseExport}
          title="התקדמות ייצוא"
        >
          <div className="export-modal-content">
            <div className="progress-container">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${exportProgress || 0}%`,
                  }}
                ></div>
              </div>
              <p className="progress-text">{exportProgress || 0}% Complete</p>
            </div>
            <button
              onClick={onExecuteExport}
              className="btn btn-primary"
              disabled={exportProgress === 100}
            >
              {exportProgress === 100 ? 'Export Complete' : 'Start Export'}
            </button>
          </div>
        </Modal>
      )}

      {/* Associated Collections Modal */}
      {showCollectionsModal && (
        <AssociatedCollectionsModal
          isOpen={showCollectionsModal}
          onClose={onCloseCollectionsModal}
          item={collectionsModalItem}
        />
      )}
    </>
  );
};

export default InventoryModals;
