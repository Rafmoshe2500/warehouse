import React from 'react';
import ItemTable from '../ItemTable/ItemTable';
import { Pagination, ScrollableTableLayout } from '../../common';
import Spinner from '../../common/Spinner/Spinner';
import './InventoryContent.css';

const InventoryContent = ({
  data = {},
  selection = {},
  sorting = {},
  filtering = {},
  pagination = {},
  editing = {},
  onBulkEdit,
  onBulkDelete,
  // Props להוספה
  isAdding,
  newRowData,
  onNewRowChange,
  onSaveNew,
  onCancelNew,
  // Prop להודעות
  onShowToast,
  // Prop לשחזור פריטים
  onRestoreItems
}) => {
  const { items = [], totalItems = 0, loading = false, error = null } = data;
  const { selectedItems = [], setSelectedItems, onSelectItem, onSelectAll } = selection;
  const { sortConfig, onSort } = sorting;
  const { filters = {}, showFilters = false, onChange: onFilterChange } = filtering;
  const { currentPage, itemsPerPage, goToPage, setItemsPerPage } = pagination;
  const { onEdit } = editing;

  // Items are already sorted from the server, no need for client-side sorting
  const displayItems = items;

  if (loading && !items.length) {
    return (
      <div className="inventory-content loading">
        <Spinner message="טוען מלאי..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="inventory-content error">
        <div className="error-message">
          <p>שגיאה בטעינת מלאי: {error}</p>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div className="inventory-content">
      <ScrollableTableLayout
        pagination={
          totalItems > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              limit={itemsPerPage}
              onPageChange={goToPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          )
        }
        contentMaxHeight="calc(100vh - 320px)"
      >
        <ItemTable
          items={displayItems}
          selection={{ selectedItems, setSelectedItems, onSelectItem, onSelectAll }}
          sorting={{ sortConfig, onSort }}
          filtering={{ filters, showFilters, onChange: onFilterChange }}
          editing={{ onEdit }}
          onBulkEdit={onBulkEdit}
          onBulkDelete={onBulkDelete}

          /* העברה לטבלה */
          isAdding={isAdding}
          newRowData={newRowData}
          onNewRowChange={onNewRowChange}
          onSaveNew={onSaveNew}
          onCancelNew={onCancelNew}
          onShowToast={onShowToast}
          onRestoreItems={onRestoreItems}
        />

        {totalItems === 0 && !loading && !isAdding && (
          <div className="empty-state">
            <p>לא נמצאו פריטים</p>
          </div>
        )}
      </ScrollableTableLayout>
    </div>
  );
};

export default InventoryContent;
