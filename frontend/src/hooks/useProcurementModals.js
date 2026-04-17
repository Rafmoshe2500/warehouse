import { useState, useCallback } from 'react';

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
  const openCreateModal = useCallback(() => {
    setEditingOrder(null);
    setIsOrderTypeModalOpen(true);
  }, []);

  const openEditModal = useCallback((order) => {
    setEditingOrder(order);
    setIsEditModalOpen(true);
  }, []);

  const closeEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setEditingOrder(null);
    setNewOrderType(null);
    setBomPrescanData(null);
  }, []);

  // Delete Handlers
  const openDeleteModal = useCallback((order) => {
    setOrderToDelete(order);
    setIsDeleteModalOpen(true);
  }, []);

  const closeDeleteModal = useCallback(() => {
    setIsDeleteModalOpen(false);
    setOrderToDelete(null);
  }, []);

  // Files Handlers
  const openFilesModal = useCallback((order) => {
    setSelectedOrderForFiles(order);
    setIsFilesModalOpen(true);
  }, []);

  const closeFilesModal = useCallback(() => {
    setIsFilesModalOpen(false);
    setSelectedOrderForFiles(null);
  }, []);

  // History Handlers
  const openHistoryModal = useCallback((order) => {
    setSelectedOrderForHistory(order);
    setIsHistoryModalOpen(true);
  }, []);

  const closeHistoryModal = useCallback(() => {
    setIsHistoryModalOpen(false);
    setSelectedOrderForHistory(null);
  }, []);

  // BOM Preview Handlers
  const openBomPreviewModal = useCallback((order) => {
    setSelectedOrderForBom(order);
    setIsBomPreviewOpen(true);
  }, []);

  const closeBomPreviewModal = useCallback(() => {
    setIsBomPreviewOpen(false);
    setSelectedOrderForBom(null);
  }, []);

  const updateSelectedOrderBomGroups = useCallback((updatedGroups) => {
    setSelectedOrderForBom(prev =>
      prev ? { ...prev, bom_data: { ...prev.bom_data, groups: updatedGroups } } : prev
    );
  }, []);

  // Order Type Selection Handlers
  const handleOrderTypeSelect = useCallback((type) => {
    setNewOrderType(type);
    setIsOrderTypeModalOpen(false);
    if (type === 'bom') {
      setBomPrescanData(null);
      setIsBomPrescanOpen(true);
    } else {
      setBomPrescanData(null);
      setIsEditModalOpen(true);
    }
  }, []);

  const closeOrderTypeModal = useCallback(() => {
    setIsOrderTypeModalOpen(false);
  }, []);

  // BOM Prescan Handlers
  const handleBomPrescanDone = useCallback((data) => {
    setIsBomPrescanOpen(false);
    setBomPrescanData(data);
    setIsEditModalOpen(true);
  }, []);

  const closeBomPrescanModal = useCallback(() => {
    setIsBomPrescanOpen(false);
  }, []);

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
    updateSelectedOrderBomGroups,

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
