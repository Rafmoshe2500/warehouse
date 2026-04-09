import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { useItems } from '../../hooks/useItems';
import { useToast } from '../../hooks/useToast';
import { usePagination } from '../../hooks/usePagination';
import { useInventoryModals } from '../../hooks/useInventoryModals';
import { useDebounce } from '../../hooks/useDebounce';
import { useAuth } from '../../context/AuthContext';
import excelService from '../../api/services/excelService';

import { useInventorySelection } from '../../hooks/useInventorySelection';
import { useColumnVisibility } from '../../hooks/useColumnVisibility';
import { useAddToCollection } from '../../hooks/useAddToCollection';

import InventoryHeader from '../../components/inventory/InventoryHeader/InventoryHeader';
import InventoryContent from '../../components/inventory/InventoryContent/InventoryContent';
import InventoryModals from '../../components/inventory/InventoryModals/InventoryModals';
import ExcelManager from '../../components/inventory/ExcelManager/ExcelManager';
import ToastContainer from '../../components/common/Toast/ToastContainer';
import { TABLE_COLUMNS } from '../../constants/tableConfig';

import './StaleItemsPage.css';

const StaleItemsPage = ({ isEmbedded = false }) => {
  // 1. Core Hooks & State
  const { addToast, toasts, removeToast } = useToast();
  const { hasPermission } = useAuth();
  const canEdit = hasPermission('inventory:rw');
  const modals = useInventoryModals();

  // 2. Stale-specific: days filter
  const [days, setDays] = useState(30);

  // 3. Pagination & UI State
  const { currentPage, itemsPerPage, goToPage, setItemsPerPage } = usePagination(1, 25);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: 'updated_at', direction: 'asc' });
  const [searchQuery, setSearchQuery] = useState('');

  // 4. Derived State
  const debouncedFilters = useDebounce(filters, 500);

  // 5. Query Params — same as InventoryPage + stale_days
  const queryParams = {
    page: currentPage,
    limit: itemsPerPage,
    search: searchQuery,
    sort_by: sortConfig.key,
    sort_order: sortConfig.direction,
    stale_days: days,
    ...debouncedFilters
  };

  // 6. Data Fetching (reuses useItems with stale_days param)
  const {
    items, totalItems, loading,
    updateItem, bulkUpdate, deleteItem, bulkDelete, restoreItems,
    loadItems
  } = useItems(queryParams);

  // 7. Custom Hooks Integration
  const {
    selectedItems, setSelectedItems,
    handleSelectItem, handleSelectAll, clearSelection
  } = useInventorySelection(items);

  const { visibleColumns, toggleColumn } = useColumnVisibility('stale_items_columns', TABLE_COLUMNS);

  const {
    userCollections, collectionsModalItem,
    openCollectionsModal, closeCollectionsModal, handleAddToCollection
  } = useAddToCollection(canEdit, addToast);

  // Dummy file ref for ExcelManager (export-only, no import)
  const fileInputRef = useRef(null);

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
      let deletedItemsData = [];
      if (modals.isDeletingMultiple) {
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

  const handleSort = (key, direction) => setSortConfig({ key, direction });
  const handleFilterToggle = () => setShowFilters(!showFilters);

  const handleSearch = (query) => {
    setSearchQuery(query);
    goToPage(1);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    if (currentPage !== 1) goToPage(1);
  };

  const handleExportRequest = () => modals.openExport();

  const handleExecuteExport = async (mode) => {
    modals.closeExport();
    addToast('מכין קובץ לייצוא...', 'info');
    try {
      const exportParams = {
        search: searchQuery,
        ...debouncedFilters,
        sort_by: sortConfig.key,
        sort_order: sortConfig.direction,
        stale_days: days,
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

  const onAddToCollectionSuccess = () => {
    loadItems();
    clearSelection();
  };

  const onAddToCollectionClick = (collection) => {
    handleAddToCollection(collection, selectedItems, onAddToCollectionSuccess);
  };

  // Days filter element for InventoryHeader extra content slot
  const daysFilter = (
    <div className="days-filter">
      <label>לא עודכנו למעלה מ-</label>
      <input
        type="number"
        value={days}
        onChange={(e) => { setDays(Number(e.target.value)); goToPage(1); }}
        min="1"
        className="days-input"
      />
      <span>ימים</span>
    </div>
  );

  return (
    <div className={isEmbedded ? "stale-items-page-embedded" : "stale-items-page"}>
      <InventoryHeader
        canEdit={canEdit}
        selectedItems={selectedItems}
        showFilters={showFilters}
        searchQuery={searchQuery}
        onSearch={handleSearch}
        onFilterToggle={handleFilterToggle}
        onExportClick={handleExportRequest}
        onBulkEdit={handleBulkEditClick}
        onBulkDelete={() => modals.openDeleteConfirm(null, '', true)}
        allColumns={TABLE_COLUMNS}
        visibleColumns={Object.keys(visibleColumns).filter(k => visibleColumns[k])}
        onColumnToggle={toggleColumn}
        hideImport
        hideAdd
        extraContent={daysFilter}
      />

      <InventoryContent
        canEdit={canEdit}
        isEmbedded={isEmbedded}
        queryParams={queryParams}
        visibleColumns={Object.keys(visibleColumns).filter(k => visibleColumns[k])}
        selection={{
          selectedItems, setSelectedItems,
          onSelectItem: handleSelectItem,
          onSelectAll: handleSelectAll
        }}
        sorting={{ sortConfig, onSort: handleSort }}
        filtering={{ filters, showFilters, onChange: handleFilterChange }}
        pagination={{ currentPage, itemsPerPage, goToPage, setItemsPerPage }}
        editing={{ onEdit: handleEditCell }}
        onBulkEdit={handleBulkEditClick}
        onBulkDelete={() => modals.openDeleteConfirm(null, '', true)}
        onShowToast={addToast}
        onRestoreItems={restoreItems}
        onShowCollections={openCollectionsModal}
        userCollections={userCollections}
        onAddToCollection={onAddToCollectionClick}
      />

      <InventoryModals
        isItemFormOpen={modals.isItemFormOpen}
        onCloseItemForm={modals.closeItemForm}
        editingItem={modals.editingItem}
        onSaveItem={handleSaveItemModal}
        isDeleteOpen={modals.isDeleteOpen}
        onCloseDelete={modals.closeDelete}
        onConfirmDelete={handleConfirmDelete}
        deletingItemName={modals.deletingItemName}
        isBulkEditOpen={modals.isBulkEditOpen}
        onCloseBulkEdit={modals.closeBulkEdit}
        onConfirmBulkEdit={handleConfirmBulkEdit}
        selectedCount={selectedItems.length}
        showExportModal={modals.showExportModal}
        onCloseExport={modals.closeExport}
        onExecuteExport={handleExecuteExport}
        showCollectionsModal={!!collectionsModalItem}
        onCloseCollectionsModal={closeCollectionsModal}
        collectionsModalItem={collectionsModalItem}
      />

      <ExcelManager
        fileInputRef={fileInputRef}
        showExportModal={modals.showExportModal}
        onCloseExport={modals.closeExport}
        onUploadChange={() => {}}
        onExecuteExport={handleExecuteExport}
        totalItems={totalItems}
        currentPageItems={items.length}
        uploading={false}
      />

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

StaleItemsPage.propTypes = {
  isEmbedded: PropTypes.bool
};

export default StaleItemsPage;
