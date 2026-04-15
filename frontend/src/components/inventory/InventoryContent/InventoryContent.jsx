import React from 'react';
import ItemTable from '../ItemTable/ItemTable';
import { Pagination, ScrollableTableLayout, SkeletonTable } from '../../common';
import Spinner from '../../common/Spinner/Spinner';
import './InventoryContent.css';
import { useItems } from '../../../hooks/useItems';

const InventoryContent = ({
  canEdit = false,
  queryParams = null,
  viewMode = 'normal',
  viewConfig = {},
  selection = {},
  sorting = {},
  filtering = {},
  pagination = {},
  editing = {},
  onBulkEdit,
  onBulkDelete,
  isAdding,
  newRowData,
  onNewRowChange,
  onSaveNew,
  onCancelNew,
  onShowToast,
  onRestoreItems,
  // Prop for embedded mode
  // Prop for embedded mode
  isEmbedded = false,
  visibleColumns, // New prop
  onShowCollections, // New prop
  userCollections,
  onAddToCollection,
  onRowClick
}) => {
  // Fetch data directly using the hook and passed params
  const { items = [], totalItems = 0, loading = false, error = null } = useItems(queryParams);
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
        <SkeletonTable rows={8} columns={visibleColumns.length || 7} />
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
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            limit={itemsPerPage}
            onPageChange={goToPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        }
      >
        <ItemTable
          canEdit={canEdit}
          items={displayItems}
          selection={{ selectedItems, setSelectedItems, onSelectItem, onSelectAll }}
          sorting={{ sortConfig, onSort }}
          filtering={{ filters, showFilters, onChange: onFilterChange }}
          editing={{ onEdit }}
          onBulkEdit={onBulkEdit}
          onBulkDelete={onBulkDelete}
          visibleColumns={visibleColumns} // Pass to ItemTable
          isAdding={isAdding}
          newRowData={newRowData}
          onNewRowChange={onNewRowChange}
          onSaveNew={onSaveNew}
          onCancelNew={onCancelNew}
          onShowToast={onShowToast}
          onRestoreItems={onRestoreItems}
          onShowCollections={onShowCollections}
          userCollections={userCollections}
          onAddToCollection={onAddToCollection}
          onRowClick={onRowClick}
          viewMode={viewMode}
          viewConfig={viewConfig}
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
