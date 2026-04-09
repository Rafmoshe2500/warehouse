import React, { useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useItems } from '../../hooks/useItems';
import { useToast } from '../../hooks/useToast';
import { usePagination } from '../../hooks/usePagination';
import { useInventoryModals } from '../../hooks/useInventoryModals';
import { useDebounce } from '../../hooks/useDebounce';
import { useInlineAddItem } from '../../hooks/useInlineAddItem';
import { useAuth } from '../../context/AuthContext';
import excelService from '../../api/services/excelService';

// New Hooks
import { useInventorySelection } from '../../hooks/useInventorySelection';
import { useInventoryExcel } from '../../hooks/useInventoryExcel';
import { useAddToCollection } from '../../hooks/useAddToCollection';
import { useColumnVisibility } from '../../hooks/useColumnVisibility';

// Components
import InventoryHeader from '../../components/inventory/InventoryHeader/InventoryHeader';
import InventoryContent from '../../components/inventory/InventoryContent/InventoryContent';
import InventoryModals from '../../components/inventory/InventoryModals/InventoryModals';
import ExcelManager from '../../components/inventory/ExcelManager/ExcelManager';
import ToastContainer from '../../components/common/Toast/ToastContainer';
import { TABLE_COLUMNS } from '../../constants/tableConfig';

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
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: 'updated_at', direction: 'desc' });
  
  const [searchQuery, setSearchQuery] = useState(() => {
    const params = new URLSearchParams(location.search);
    return params.get('search') || '';
  });

  // 3. Derived State
  const debouncedFilters = useDebounce(filters, 500);

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

  // 6. Custom Hooks Integration
  const {
      selectedItems,
      setSelectedItems,
      handleSelectItem,
      handleSelectAll,
      clearSelection
  } = useInventorySelection(items);

  const {
      visibleColumns,
      toggleColumn
  } = useColumnVisibility('inventory_columns', TABLE_COLUMNS);

  const {
      uploadingExcel,
      importType,
      setImportType,
      handleImportExcel
  } = useInventoryExcel(loadItems, addToast);

  const {
      userCollections,
      collectionsModalItem,
      openCollectionsModal,
      closeCollectionsModal,
      handleAddToCollection
  } = useAddToCollection(canEdit, addToast);

  // File Input Ref for Excel (Local to page as it connects UI to hook)
  const fileInputRef = useRef(null);
  const handleUploadClick = () => fileInputRef.current?.click();

  // 7. Inline Add Logic
  const handleAddItemSuccess = async () => {
      addToast('פריט נוצר בהצלחה', 'success');
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
  
  // ============ HANDLERS ============

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
        clearSelection();
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
      clearSelection();
      modals.closeBulkEdit();
    } catch (err) {
      console.error(err);
      addToast('שגיאה בעדכון מרובה', 'error');
    }
  };

  const handleEditCell = async (itemId, field, value, isUndo = false) => {
    try {
      await updateItem(itemId, field, value, isUndo);
      addToast('הפריט עודכן בהצלחה', 'success');
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

  // Import Handlers
  const handleProjectImportClick = () => {
    setImportType('project');
    handleUploadClick();
  };

  const handleStandardImportClick = () => {
    setImportType('standard');
    handleUploadClick();
  };
  
  // Wrapper for hook's import to accept event
  const onFileChange = (e) => {
      const file = e.target.files[0];
      handleImportExcel(file);
      e.target.value = ''; // Reset input
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

  // Wrapper for Add to Collection to refresh items after (if count needs updating)
  const onAddToCollectionSuccess = () => {
     loadItems(); 
     clearSelection();
  };
  
  const onAddToCollectionClick = (collection) => {
      handleAddToCollection(collection, selectedItems, onAddToCollectionSuccess);
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
        onExportClick={handleExportRequest}
        onAddClick={inlineAdd.startAdd}
        onBulkEdit={handleBulkEditClick}
        onBulkDelete={() => modals.openDeleteConfirm(null, '', true)}

        onImportProjectsClick={handleProjectImportClick}
        
        // Column Toggle Props
        allColumns={TABLE_COLUMNS}
        visibleColumns={Object.keys(visibleColumns).filter(k => visibleColumns[k])} // Convert object to keys array for Header if it expects array? 
        // Wait, Header expects "visibleColumns" as array of keys? 
        // useColumnVisibility returns object { key: true/false }.
        // Previous State was array of strings.
        // I need to check InventoryHeader.
        onColumnToggle={toggleColumn}
      />
      
      <InventoryContent
        canEdit={canEdit}
        isEmbedded={isEmbedded}
        queryParams={queryParams}
        visibleColumns={Object.keys(visibleColumns).filter(k => visibleColumns[k])} // Pass array
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
        onShowCollections={openCollectionsModal} 
        userCollections={userCollections}
        onAddToCollection={onAddToCollectionClick}
      />


      <InventoryModals
        // Item Form Modal
        isItemFormOpen={modals.isItemFormOpen}
        onCloseItemForm={modals.closeItemForm}
        editingItem={modals.editingItem}
        onSaveItem={handleSaveItemModal}
        // Delete Confirmation Modal
        isDeleteOpen={modals.isDeleteOpen}
        onCloseDelete={modals.closeDelete}
        onConfirmDelete={handleConfirmDelete}
        deletingItemName={modals.deletingItemName}
        // Bulk Edit Modal
        isBulkEditOpen={modals.isBulkEditOpen}
        onCloseBulkEdit={modals.closeBulkEdit}
        onConfirmBulkEdit={handleConfirmBulkEdit}
        selectedCount={selectedItems.length}
        // Export Modal
        showExportModal={modals.showExportModal}
        onCloseExport={modals.closeExport}
        onExecuteExport={handleExecuteExport}
        
        // Associated Collections Modal
        showCollectionsModal={!!collectionsModalItem}
        onCloseCollectionsModal={closeCollectionsModal}
        collectionsModalItem={collectionsModalItem}
      />

      <ExcelManager
        fileInputRef={fileInputRef}
        showExportModal={modals.showExportModal}
        onCloseExport={modals.closeExport}
        onUploadChange={onFileChange}
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