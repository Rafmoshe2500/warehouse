import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useItems } from '../../hooks/useItems';
import { useToast } from '../../hooks/useToast';
import { usePagination } from '../../hooks/usePagination';
import { useExcelManager } from '../../hooks/useExcelManager';
import { useInventoryModals } from '../../hooks/useInventoryModals';
import { useDebounce } from '../../hooks/useDebounce';
import { useInlineAddItem } from '../../hooks/useInlineAddItem';
import { useAuth } from '../../context/AuthContext';
import excelService from '../../api/services/excelService';

// Components
import InventoryHeader from '../../components/inventory/InventoryHeader/InventoryHeader';
import InventoryContent from '../../components/inventory/InventoryContent/InventoryContent';
import InventoryModals from '../../components/inventory/InventoryModals/InventoryModals';
import ExcelManager from '../../components/inventory/ExcelManager/ExcelManager';
import ToastContainer from '../../components/common/Toast/ToastContainer';

import './InventoryPage.css';

const InventoryPage = ({ isEmbedded = false }) => {
  // 1. Core Hooks & State
  const { addToast, toasts, removeToast } = useToast();
  const { hasPermission } = useAuth();
  const canEdit = hasPermission('inventory:rw');
  const modals = useInventoryModals();
  const location = useLocation();
  
  // 2. Pagination & UI State
  const { currentPage, itemsPerPage, goToPage, setItemsPerPage } = usePagination(1, 25);
  const [selectedItems, setSelectedItems] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: 'updated_at', direction: 'desc' });
  
  const [searchQuery, setSearchQuery] = useState(() => {
    const params = new URLSearchParams(location.search);
    return params.get('search') || '';
  });

  // 3. Derived State
  const debouncedFilters = useDebounce(filters, 500);
  const { uploadingExcel, setUploadingExcel, showExportModal, fileInputRef, handleUploadClick } = useExcelManager();

  // 4. Query Params Construction
  const queryParams = {
    page: currentPage,
    limit: itemsPerPage,
    search: searchQuery,
    sort_by: sortConfig.key,
    sort_order: sortConfig.direction,
    ...debouncedFilters
  };

  // 5. Data Fetching (React Query)
  const {
    items, totalItems, loading, error,
    createItem, updateItem, bulkUpdate, deleteItem, bulkDelete, restoreItems,
    loadItems // Mapped to refetch
  } = useItems(queryParams);
  
  // 6. Inline Add Logic
  const handleAddItemSuccess = async () => {
      addToast('פריט נוצר בהצלחה', 'success');
      // React Query auto-invalidates, but valid to reset page
      goToPage(1);
  };

  const handleAddItemError = (msg) => {
      addToast(msg, 'error');
  };

  const inlineAdd = useInlineAddItem(
    createItem, 
    handleAddItemSuccess,
    handleAddItemError
  );
  
  // Destructure inline add - kept separate to match existing pattern if needed, or structured here
  const { 
    isAdding, 
    newRowData, 
    startAdd: handleStartAdd, 
    cancelAdd: handleCancelNew, 
    handleNewRowChange, 
    saveNewItem: handleSaveNewItem 
  } = inlineAdd;


  // ============ EXISTING HANDLERS ============

  const handleSaveItemModal = async (data) => {
    try {
      if (modals.editingItem) {
        await updateItem(modals.editingItem._id, data);
        addToast('הפריט עודכן בהצלחה', 'success');
      }
      modals.closeItemForm();
    } catch (err) {
      const message = err.response?.data?.detail || 'שגיאה בעדכון';
      addToast(message, 'error');
    }
  };

  const handleConfirmDelete = async (reason) => {
    try {
      // Record items for undo before deleting
      let deletedItemsData = [];

      if (modals.isDeletingMultiple) {
        // Get all items that will be deleted
        deletedItemsData = items.filter(i => selectedItems.includes(i._id));
        await bulkDelete(selectedItems, reason);
        setSelectedItems([]);
      } else {
        const item = items.find(i => i._id === modals.deletingItemName);
        if (item) {
          deletedItemsData = [item];
          await deleteItem(item._id, reason);
        }
      }

      // Record for undo (via global function exposed by ItemTable)
      if (deletedItemsData.length > 0 && window.__tableRecordDelete) {
        window.__tableRecordDelete(deletedItemsData, modals.isDeletingMultiple);
      }

      addToast('המחיקה בוצעה בהצלחה (Ctrl+Z לביטול)', 'success');
      modals.closeDelete();
    } catch (err) {
      addToast('שגיאה במחיקה', 'error');
    }
  };

  const handleBulkEditClick = () => {
    if (selectedItems.length === 0) {
      addToast('יש לבחור פריטים לעריכה', 'warning');
      return;
    }
    modals.openBulkEdit();
  };

  const handleConfirmBulkEdit = async (updates) => {
    try {
      await bulkUpdate(selectedItems, updates);
      
      addToast('עדכון מרובה בוצע בהצלחה', 'success');
      setSelectedItems([]);
      modals.closeBulkEdit();
    } catch (err) {
      console.error(err);
      addToast('שגיאה בעדכון מרובה', 'error');
    }
  };

  const handleSelectItem = (id) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedItems(
      selectedItems.length === items.length ? [] : items.map(i => i._id)
    );
  };

  const handleEditCell = async (itemId, field, value, isUndo = false) => {
    try {
      await updateItem(itemId, field, value, isUndo);
      addToast('הפריט עודכן בהצלחה', 'success');
      // No manual reload needed
    } catch (err) {
      addToast('שגיאה בעדכון הפריט', 'error');
    }
  };

  const handleSort = (key, direction) => {
    setSortConfig({ key, direction });
  };

  const handleFilterToggle = () => {
    setShowFilters(!showFilters);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    goToPage(1);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    if (currentPage !== 1) goToPage(1);
  };

  // Import State
  const [importType, setImportType] = useState('standard'); // 'standard' | 'project'

  const handleProjectImportClick = () => {
    setImportType('project');
    handleUploadClick();
  };

  const handleStandardImportClick = () => {
    setImportType('standard');
    handleUploadClick();
  };

  const handleImportExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingExcel(true);
    try {
      let result;
      if (importType === 'project') {
        result = await excelService.importProjectExcel(file);
        addToast(result.message, 'success');
      } else {
        result = await excelService.importExcel(file);
        let message = `יבוא הושלם! נוצרו: ${result.added}, עודכנו: ${result.updated}`;
        if (result.skipped > 0) message += `, דולגו: ${result.skipped}`;
        addToast(message, 'success');
        if (result.errors && result.errors.length > 0) {
          addToast(`שימו לב: היו שגיאות ב-${result.errors.length} שורות`, 'warning');
        }
      }

      // Invalidate queries instead of manual reload
      await loadItems(); // loadItems is now refetch
      goToPage(1);
    } catch (err) {
      addToast(err.response?.data?.detail || 'שגיאה ביבוא מאקסל', 'error');
    } finally {
      setUploadingExcel(false);
      e.target.value = '';
      setImportType('standard'); // Reset to default
    }
  };

  const handleExportRequest = () => {
    modals.openExport();
  };

  const handleExecuteExport = async (mode) => {
    modals.closeExport();
    addToast('מכין קובץ לייצוא...', 'info');

    try {
      const exportParams = {
        search: searchQuery,
        ...debouncedFilters,
        sort_by: sortConfig.key,
        sort_order: sortConfig.direction,
        export_mode: mode,
        page: currentPage,
        limit: itemsPerPage
      };

      await excelService.exportExcel(exportParams);
      addToast('הקובץ ירד בהצלחה', 'success');
    } catch (err) {
      addToast('שגיאה בייצוא לאקסל', 'error');
    }
  };

  return (
    <div className={isEmbedded ? "inventory-page-embedded" : "inventory-page"}>
      <InventoryHeader
        canEdit={canEdit}
        selectedItems={selectedItems}
        showFilters={showFilters}
        uploadingExcel={uploadingExcel}
        searchQuery={searchQuery}
        onSearch={handleSearch}
        onFilterToggle={handleFilterToggle}
        onUploadClick={handleStandardImportClick}
      />
      
      <InventoryContent
        canEdit={canEdit}
        isEmbedded={isEmbedded}
        queryParams={queryParams} // New prop
        // data prop removed
        selection={{
          selectedItems,
          setSelectedItems,
          onSelectItem: handleSelectItem,
          onSelectAll: handleSelectAll
        }}
        sorting={{ sortConfig, onSort: handleSort }}
        filtering={{ filters, showFilters, onChange: handleFilterChange }}
        pagination={{ currentPage, itemsPerPage, goToPage, setItemsPerPage }}
        editing={{ onEdit: handleEditCell }}
        onBulkEdit={handleBulkEditClick}
        onBulkDelete={() => modals.openDeleteConfirm(null, '', true)}

        /* Inline Add Props */
        isAdding={inlineAdd.isAdding}
        newRowData={inlineAdd.newRowData}
        onNewRowChange={inlineAdd.handleNewRowChange}
        onSaveNew={inlineAdd.saveNewItem}
        onCancelNew={inlineAdd.cancelAdd}

        onShowToast={addToast}
        onRestoreItems={restoreItems}
      />


      <InventoryModals
        modals={modals}
        onSaveItem={handleSaveItemModal}
        onConfirmDelete={handleConfirmDelete}
        deletingItemCount={modals.isDeletingMultiple ? selectedItems.length : 1}
        isDeletingMultiple={modals.isDeletingMultiple}
        isBulkEditOpen={modals.isBulkEditOpen}
        onCloseBulkEdit={modals.closeBulkEdit}
        onConfirmBulkEdit={handleConfirmBulkEdit}
        selectedCount={selectedItems.length}
        showExportModal={modals.showExportModal}
        onCloseExport={modals.closeExport}
        onExecuteExport={handleExecuteExport}
      />

      <ExcelManager
        fileInputRef={fileInputRef}
        showExportModal={modals.showExportModal}
        onCloseExport={modals.closeExport}
        onUploadChange={handleImportExcel}
        onExecuteExport={handleExecuteExport}
        totalItems={totalItems}
        currentPageItems={items.length}
        uploading={uploadingExcel}
      />

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default InventoryPage;