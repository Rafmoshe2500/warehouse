import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useItems } from '../../hooks/useItems';
import { useToast } from '../../hooks/useToast';
import { usePagination } from '../../hooks/usePagination';
import { useInventoryModals } from '../../hooks/useInventoryModals';
import { useDebounce } from '../../hooks/useDebounce';
import { useInlineAddItem } from '../../hooks/useInlineAddItem';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import excelService from '../../api/services/excelService';

// New Hooks
import { useInventorySelection } from '../../hooks/useInventorySelection';
import { useInventoryExcel } from '../../hooks/useInventoryExcel';
import { useAddToCollection } from '../../hooks/useAddToCollection';
import { useColumnVisibility } from '../../hooks/useColumnVisibility';
import useViewMode from '../../hooks/useViewMode';

// Components
import InventoryHeader from '../../components/inventory/InventoryHeader/InventoryHeader';
import ActiveFiltersBar from '../../components/inventory/ActiveFiltersBar/ActiveFiltersBar';
import DetailPanel from '../../components/inventory/DetailPanel/DetailPanel';
import ViewModeToggle from '../../components/inventory/ViewModeToggle/ViewModeToggle';
import InventoryContent from '../../components/inventory/InventoryContent/InventoryContent';
import InventoryModals from '../../components/inventory/InventoryModals/InventoryModals';
import ExcelManager from '../../components/inventory/ExcelManager/ExcelManager';
import ToastContainer from '../../components/common/Toast/ToastContainer';
import Modal from '../../components/common/Modal/Modal';
import QuantityPopup from '../../components/cart/QuantityPopup/QuantityPopup';
import { TABLE_COLUMNS, KEYBOARD_SHORTCUTS } from '../../constants/tableConfig';

import './InventoryPage.css';

const InventoryPage = ({ isEmbedded = false, staleMode = false }) => {
  // 1. Core Hooks & State
  const { addToast, toasts, removeToast } = useToast();
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const { hasPermission } = useAuth();
  const { addToCart } = useCart();
  const canEdit = hasPermission('inventory:rw');
  const modals = useInventoryModals();
  const location = useLocation();
  
  // 2. Stale-specific: days filter
  const [days, setDays] = useState(30);
  const debouncedDays = useDebounce(days, 400);

  // 3. Pagination & UI State
  const { currentPage, itemsPerPage, goToPage, setItemsPerPage } = usePagination(1, 25);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: 'updated_at', direction: staleMode ? 'asc' : 'desc' });
  const [detailItem, setDetailItem] = useState(null);
  const [quantityPopupItem, setQuantityPopupItem] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState(() => {
    if (staleMode) return '';
    const params = new URLSearchParams(location.search);
    return params.get('search') || '';
  });

  // 3. Derived State
  const debouncedFilters = useDebounce(filters, 500);
  const debouncedSearch = useDebounce(searchQuery, 400); // Bug #9: debounce search

  // 4. Query Params Construction
  const queryParams = {
    page: currentPage,
    limit: itemsPerPage,
    search: debouncedSearch,
    sort_by: sortConfig.key,
    sort_order: sortConfig.direction,
    ...(staleMode && { stale_days: debouncedDays }),
    ...debouncedFilters
  };

  // 5. Data Fetching (React Query)
  const {
    items, totalItems, loading, error,
    createItem, updateItem, bulkUpdate, deleteItem, bulkDelete, restoreItems,
    loadItems // Mapped to refetch
  } = useItems(queryParams);

  // Auto-open detail panel when navigated from GlobalSearch with openItemId state
  // Bug #8: track the last processed openItemId to allow re-navigation to different items
  const autoOpenRef = useRef(null);
  useEffect(() => {
    const openItemId = location.state?.openItemId;
    if (!openItemId || autoOpenRef.current === openItemId || !items.length) return;
    const found = items.find(i => i._id === openItemId);
    if (found) {
      autoOpenRef.current = openItemId;
      setDetailItem(found);
    }
  }, [items, location.state?.openItemId]);

  // Sync detailItem with latest data when items refresh (e.g., after an inline panel edit)
  useEffect(() => {
    if (!detailItem) return;
    const updated = items.find(i => i._id === detailItem._id);
    if (updated && updated !== detailItem) setDetailItem(updated);
  }, [items]); // eslint-disable-line react-hooks/exhaustive-deps

  // 6. Custom Hooks Integration
  const {
      selectedItems,
      setSelectedItems,
      handleSelectItem,
      handleSelectAll,
      clearSelection
  } = useInventorySelection(items);

  // Bug #17: clear selection when navigating to a different page
  useEffect(() => {
    clearSelection();
  }, [currentPage]); // eslint-disable-line react-hooks/exhaustive-deps

  // Bug #25: ref-based record-delete registration (replaces window.__tableRecordDelete)
  const recordDeleteRef = useRef(null);
  const onRegisterRecordDelete = useCallback((fn) => {
    recordDeleteRef.current = fn;
  }, []);

  const {
      visibleColumns,
      toggleColumn
  } = useColumnVisibility(staleMode ? 'stale_items_columns' : 'inventory_columns', TABLE_COLUMNS);

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

  const { viewMode, viewConfig, changeViewMode } = useViewMode();

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
        // Bug #2: update each changed field individually (backend only accepts single-field PATCH)
        const fieldsToUpdate = Object.keys(data).filter(
          key => data[key] !== undefined && String(data[key] ?? '') !== String(modals.editingItem[key] ?? '')
        );
        await Promise.all(
          fieldsToUpdate.map(field => updateItem(modals.editingItem._id, field, String(data[field] ?? '')))
        );
        addToast('הפריט עודכן בהצלחה', 'success');
      } else {
        // Bug #3: missing create path
        await createItem(data);
        addToast('פריט נוצר בהצלחה', 'success');
      }
      modals.closeItemForm();
    } catch (err) {
      const message = err.response?.data?.detail || 'שגיאה בשמירה';
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

      // Bug #25: use prop-based ref instead of window global
      if (deletedItemsData.length > 0 && recordDeleteRef.current) {
        recordDeleteRef.current(deletedItemsData, modals.isDeletingMultiple);
      }

      addToast('המחיקה בוצעה בהצלחה (Ctrl+Z לביטול)', 'success');
      modals.closeDelete();
    } catch (err) {
      addToast('שגיאה במחיקה', 'error');
    }
  };

  // Bug #15: accept optional itemIds from row-level actions to avoid stale closure
  const handleBulkEditClick = (itemIds = null) => {
    const items = itemIds ?? selectedItems;
    if (items.length === 0) {
      addToast('יש לבחור פריטים לעריכה', 'warning');
      return;
    }
    if (itemIds !== null) setSelectedItems(itemIds);
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
      // Bug #14: don't show success toast on undo (undo handler shows its own toast)
      if (!isUndo) {
        addToast('הפריט עודכן בהצלחה', 'success');
      }
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

  const handleRemoveFilter = (key) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    setFilters(newFilters);
    if (currentPage !== 1) goToPage(1);
  };

  const handleClearAllFilters = () => {
    setFilters({});
    setSearchQuery('');
    if (currentPage !== 1) goToPage(1);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    if (currentPage !== 1) goToPage(1);
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
        ...(staleMode && { stale_days: days }),
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
  
  // Bug #6: accept optional itemIds from row-level actions (falls back to selection)
  const onAddToCollectionClick = (collection, itemIds = null) => {
      handleAddToCollection(collection, itemIds ?? selectedItems, onAddToCollectionSuccess);
  };

  // Cart: add selected items to cart
  const handleAddToCart = useCallback(async (itemIds) => {
    const targets = itemIds ?? selectedItems;
    if (!targets.length) return;

    const itemsToAdd = items.filter((i) => targets.includes(i._id));
    const serialItems = itemsToAdd.filter((i) => i.serial && String(i.serial).trim());
    const nonSerialItems = itemsToAdd.filter((i) => !i.serial || !String(i.serial).trim());

    // Serial items — add immediately (qty forced to 1 server-side)
    for (const item of serialItems) {
      try {
        await addToCart(item._id, 1);
      } catch {
        addToast(`שגיאה בהוספת ${item.serial} לעגלה`, 'error');
      }
    }

    // Non-serial items — ask for quantity per item
    for (const item of nonSerialItems) {
      setQuantityPopupItem(item);
      // Wait for the user to confirm/cancel via the popup
      await new Promise((resolve) => {
        const origSet = setQuantityPopupItem;
        window.__cartResolve = resolve;
      });
    }

    if (serialItems.length > 0) {
      addToast(`${serialItems.length} פריטים סריאליים נוספו לעגלה`, 'success');
    }
  }, [selectedItems, items, addToCart, addToast]);

  const handleQuantityConfirm = useCallback(async (qty) => {
    const item = quantityPopupItem;
    setQuantityPopupItem(null);
    if (window.__cartResolve) { window.__cartResolve(); window.__cartResolve = null; }
    try {
      await addToCart(item._id, qty);
      addToast(`${item.catalog_number} נוסף לעגלה`, 'success');
    } catch {
      addToast('שגיאה בהוספה לעגלה', 'error');
    }
  }, [quantityPopupItem, addToCart, addToast]);

  const handleQuantityCancel = useCallback(() => {
    setQuantityPopupItem(null);
    if (window.__cartResolve) { window.__cartResolve(); window.__cartResolve = null; }
  }, []);

  // Days filter element for stale mode
  const daysFilter = staleMode ? (
    <div className="days-filter">
      <label>לא עודכנו למעלה מ-</label>
      <input
        type="number"
        value={days}
        onChange={(e) => {
          // Bug #11: enforce minimum of 1
          const v = Math.max(1, Number(e.target.value) || 1);
          setDays(v);
          goToPage(1);
        }}
        min="1"
        className="days-input"
      />
      <span>ימים</span>
    </div>
  ) : null;

  return (
    <div className={isEmbedded ? "inventory-page-embedded" : "inventory-page"}>
      <InventoryHeader
        canEdit={canEdit}
        selectedItems={selectedItems}
        showFilters={showFilters}
        uploadingExcel={staleMode ? false : uploadingExcel}
        onFilterToggle={handleFilterToggle}
        onBulkEdit={handleBulkEditClick}
        onBulkDelete={() => modals.openDeleteConfirm(null, '', true)}
        allColumns={TABLE_COLUMNS}
        visibleColumns={Object.keys(visibleColumns).filter(k => visibleColumns[k])}
        onColumnToggle={toggleColumn}
        extraContent={staleMode
          ? daysFilter
          : <ViewModeToggle viewMode={viewMode} onChange={changeViewMode} />
        }
        searchQuery={searchQuery}
        onSearch={handleSearch}
        onExportClick={handleExportRequest}
        onShowShortcuts={() => setShowShortcutsModal(true)}
        {...(!staleMode && {
          onUploadClick: handleStandardImportClick,
          onAddClick: inlineAdd.startAdd,
          onImportProjectsClick: handleProjectImportClick,
        })}
        {...(staleMode && { hideImport: true, hideAdd: true })}
      />

      {/* Bug #12: show ActiveFiltersBar in all modes, not just non-stale */}
      <ActiveFiltersBar
        filters={filters}
        searchQuery={searchQuery}
        onRemoveFilter={handleRemoveFilter}
        onClearAll={handleClearAllFilters}
        onClearSearch={handleClearSearch}
      />

      <div className="inventory-page__body">
        <InventoryContent
        canEdit={canEdit}
        isEmbedded={isEmbedded}
        queryParams={queryParams}
        {...(!staleMode && { viewMode, viewConfig })}
        visibleColumns={Object.keys(visibleColumns).filter(k => visibleColumns[k])}
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

        {...(!staleMode && {
          isAdding: inlineAdd.isAdding,
          newRowData: inlineAdd.newRowData,
          onNewRowChange: inlineAdd.handleNewRowChange,
          onSaveNew: inlineAdd.saveNewItem,
          onCancelNew: inlineAdd.cancelAdd,
        })}

        onShowToast={addToast}
        onRestoreItems={restoreItems}
        onShowCollections={openCollectionsModal} 
        userCollections={userCollections}
        onAddToCollection={onAddToCollectionClick}
        onAddToCart={handleAddToCart}
        {...(!staleMode && { onRowClick: setDetailItem })}
        onRegisterRecordDelete={onRegisterRecordDelete}
      />

      {!staleMode && detailItem && (
        <DetailPanel
          item={detailItem}
          onClose={() => setDetailItem(null)}
          onShowCollections={canEdit ? openCollectionsModal : null}
          onEdit={handleEditCell}
          canEdit={canEdit}
        />
      )}

      {quantityPopupItem && (
        <QuantityPopup
          item={quantityPopupItem}
          onConfirm={handleQuantityConfirm}
          onCancel={handleQuantityCancel}
        />
      )}
      </div>


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
        onUploadChange={staleMode ? () => {} : onFileChange}
        onExecuteExport={handleExecuteExport}
        totalItems={totalItems}
        currentPageItems={items.length}
        uploading={staleMode ? false : uploadingExcel}
      />

      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Keyboard Shortcuts Modal */}
      <Modal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
        title="קיצורי מקלדת"
        size="small"
      >
        <div className="shortcuts-modal-grid">
          {Object.entries(KEYBOARD_SHORTCUTS).map(([key, description]) => (
            <div key={key} className="shortcuts-modal-row">
              <kbd className="shortcuts-key">{key}</kbd>
              <span className="shortcuts-description">{description}</span>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};

InventoryPage.propTypes = {
  isEmbedded: PropTypes.bool,
  staleMode: PropTypes.bool,
};

export default InventoryPage;