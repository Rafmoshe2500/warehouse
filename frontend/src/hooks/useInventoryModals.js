import { useState } from 'react';

/**
 * Hook for managing modal states in InventoryPage
 * Centralizes all modal open/close state
 */
export const useInventoryModals = () => {
  // Item Form Modal
  const [isItemFormOpen, setIsItemFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Delete Confirmation Modal
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingItemName, setDeletingItemName] = useState('');
  const [isDeletingMultiple, setIsDeletingMultiple] = useState(false);

  // Bulk Edit Modal
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);

  // Export Modal
  const [showExportModal, setShowExportModal] = useState(false);

  // Item Form Handlers
  const openItemForm = (item = null) => {
    setEditingItem(item);
    setIsItemFormOpen(true);
  };

  const closeItemForm = () => {
    setIsItemFormOpen(false);
    setEditingItem(null);
  };

  // Delete Handlers
  const openDeleteConfirm = (itemId, itemName, isMultiple = false) => {
    setDeletingItemName(isMultiple ? '' : itemName);
    setIsDeletingMultiple(isMultiple);
    setIsDeleteOpen(true);
  };

  const closeDelete = () => {
    setIsDeleteOpen(false);
    setDeletingItemName('');
    setIsDeletingMultiple(false);
  };

  // Bulk Edit Handlers
  const openBulkEdit = () => {
    setIsBulkEditOpen(true);
  };

  const closeBulkEdit = () => {
    setIsBulkEditOpen(false);
  };

  // Export Handlers
  const openExport = () => {
    setShowExportModal(true);
  };

  const closeExport = () => {
    setShowExportModal(false);
  };

  return {
    // Item Form
    isItemFormOpen,
    editingItem,
    openItemForm,
    closeItemForm,
    // Delete
    isDeleteOpen,
    deletingItemName,
    isDeletingMultiple,
    openDeleteConfirm,
    closeDelete,
    // Bulk Edit
    isBulkEditOpen,
    openBulkEdit,
    closeBulkEdit,
    // Export
    showExportModal,
    openExport,
    closeExport,
  };
};
