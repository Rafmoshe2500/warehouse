import { useState } from 'react';

/**
 * Hook for managing modal states in ProcurementPage
 * Centralizes all modal open/close state (following useInventoryModals pattern)
 */
export const useProcurementModals = () => {
  // Edit/Create Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);

  // Files Modal
  const [isFilesModalOpen, setIsFilesModalOpen] = useState(false);
  const [selectedOrderForFiles, setSelectedOrderForFiles] = useState(null);

  // Delete Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);

  // History Modal
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedOrderForHistory, setSelectedOrderForHistory] = useState(null);

  // BOM Preview Modal
  const [isBomPreviewOpen, setIsBomPreviewOpen] = useState(false);
  const [selectedOrderForBom, setSelectedOrderForBom] = useState(null);

  // Order Type Selection + BOM Prescan
  const [isOrderTypeModalOpen, setIsOrderTypeModalOpen] = useState(false);
  const [newOrderType, setNewOrderType] = useState(null);
  const [isBomPrescanOpen, setIsBomPrescanOpen] = useState(false);
  const [bomPrescanData, setBomPrescanData] = useState(null);

  // Edit/Create Handlers
  const openCreateModal = () => {
    setEditingOrder(null);
    setIsOrderTypeModalOpen(true);
  };

  const openEditModal = (order) => {
    setEditingOrder(order);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingOrder(null);
    setNewOrderType(null);
    setBomPrescanData(null);
  };

  // Delete Handlers
  const openDeleteModal = (order) => {
    setOrderToDelete(order);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setOrderToDelete(null);
  };

  // Files Handlers
  const openFilesModal = (order) => {
    setSelectedOrderForFiles(order);
    setIsFilesModalOpen(true);
  };

  const closeFilesModal = () => {
    setIsFilesModalOpen(false);
  };

  // History Handlers
  const openHistoryModal = (order) => {
    setSelectedOrderForHistory(order);
    setIsHistoryModalOpen(true);
  };

  const closeHistoryModal = () => {
    setIsHistoryModalOpen(false);
  };

  // BOM Preview Handlers
  const openBomPreviewModal = (order) => {
    setSelectedOrderForBom(order);
    setIsBomPreviewOpen(true);
  };

  const closeBomPreviewModal = () => {
    setIsBomPreviewOpen(false);
  };

  // Order Type Selection Handlers
  const handleOrderTypeSelect = (type) => {
    setNewOrderType(type);
    setIsOrderTypeModalOpen(false);
    if (type === 'bom') {
      setBomPrescanData(null);
      setIsBomPrescanOpen(true);
    } else {
      setBomPrescanData(null);
      setIsEditModalOpen(true);
    }
  };

  const closeOrderTypeModal = () => {
    setIsOrderTypeModalOpen(false);
  };

  // BOM Prescan Handlers
  const handleBomPrescanDone = (data) => {
    setIsBomPrescanOpen(false);
    setBomPrescanData(data);
    setIsEditModalOpen(true);
  };

  const closeBomPrescanModal = () => {
    setIsBomPrescanOpen(false);
  };

  return {
    // Edit/Create
    isEditModalOpen,
    editingOrder,
    openCreateModal,
    openEditModal,
    closeEditModal,
    setIsEditModalOpen,

    // Delete
    isDeleteModalOpen,
    orderToDelete,
    openDeleteModal,
    closeDeleteModal,

    // Files
    isFilesModalOpen,
    selectedOrderForFiles,
    setSelectedOrderForFiles,
    openFilesModal,
    closeFilesModal,

    // History
    isHistoryModalOpen,
    selectedOrderForHistory,
    openHistoryModal,
    closeHistoryModal,

    // BOM Preview
    isBomPreviewOpen,
    selectedOrderForBom,
    openBomPreviewModal,
    closeBomPreviewModal,

    // Order Type + BOM Prescan
    isOrderTypeModalOpen,
    newOrderType,
    isBomPrescanOpen,
    bomPrescanData,
    handleOrderTypeSelect,
    closeOrderTypeModal,
    handleBomPrescanDone,
    closeBomPrescanModal,
  };
};
