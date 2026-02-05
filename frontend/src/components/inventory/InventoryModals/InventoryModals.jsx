import React from 'react';
import ItemForm from '../ItemForm/ItemForm';
import DeleteConfirmation from '../DeleteConfirmation/DeleteConfirmation';
import BulkEditModal from '../BulkEditModal/BulkEditModal';
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
  deletingItemCount,
  isDeletingMultiple,

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
      <DeleteConfirmation
        isOpen={isDeleteOpen}
        onClose={onCloseDelete}
        onConfirm={onConfirmDelete}
        itemName={deletingItemName}
        itemCount={deletingItemCount}
        type={isDeletingMultiple ? 'multiple' : 'single'}
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
    </>
  );
};

export default InventoryModals;
