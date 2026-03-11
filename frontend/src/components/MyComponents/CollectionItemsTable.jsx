import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { FaTrash, FaEdit, FaCheck, FaTimes, FaPlus, FaFilter, FaFileExcel } from 'react-icons/fa';
import { FiEdit2, FiColumns } from 'react-icons/fi';
import { Button, Input, Pagination, ScrollableTableLayout } from '../common';
import { usePagination } from '../../hooks/usePagination';
import { useColumnVisibility } from '../../hooks/useColumnVisibility';
import { useCollectionTableData }    from '../../hooks/useCollectionTableData';
import { useCollectionRowSelection } from '../../hooks/useCollectionRowSelection';
import { useCollectionCellSelection } from '../../hooks/useCollectionCellSelection';
import { COLLECTION_TABLE_COLUMNS }  from '../../constants/tableConfig';
import { useToast } from '../../context/ToastContext';
import collectionsService from '../../api/services/collectionsService';
import BulkEditModal from '../inventory/BulkEditModal/BulkEditModal';
import './CollectionItemsTable.css';

// ─────────────────────────────────────────────────────────────────────────────
const CollectionItemsTable = ({
  items,
  customFields = [],
  onUnassign,
  onBulkDelete,
  onUpdateCustomValue,
  onBulkEdit,
  onAddItem,
  isReadOnly = false,
  collectionId
}) => {
  const { showToast } = useToast();

  // ── Inline-edit ──────────────────────────────────────────────────────────
  const [editingId, setEditingId]   = useState(null);
  const [editValues, setEditValues] = useState({});

  const handleStartEdit  = (item) => { setEditingId(item.item_id); setEditValues(item.custom_values || {}); };
  const handleCancelEdit = ()     => { setEditingId(null); setEditValues({}); };
  const handleSaveEdit   = async (item) => {
    await onUpdateCustomValue(item.item_id, { custom_values: editValues });
    setEditingId(null);
  };

  // ── Bulk-edit modal ───────────────────────────────────────────────────────
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);

  // ── Column visibility ─────────────────────────────────────────────────────
  const { visibleColumns, toggleColumn, showFilter: showColumnDropdown, setShowFilter: setShowColumnDropdown, filterRef } =
    useColumnVisibility(collectionId ? `collection_columns_${collectionId}` : null, COLLECTION_TABLE_COLUMNS);

  // ── Data (sort / filter / search) ─────────────────────────────────────────
  const {
    processedItems, sortConfig, filters, showFilters, searchQuery,
    setShowFilters, setSearchQuery, handleSort, handleFilterChange,
  } = useCollectionTableData(items);

  // ── Row selection (Ctrl / Shift) ──────────────────────────────────────────
  const { selectedItems, handleSelectAll, handleCheckboxClick, handleRowClick, clearSelection } =
    useCollectionRowSelection(processedItems);

  // ── Cell selection (click / drag / Ctrl+Arrow / Ctrl+C) ──────────────────
  const { selectedCells, handleCellMouseDown, handleCellMouseEnter, copyToClipboard } =
    useCollectionCellSelection(processedItems, visibleColumns);

  // ── Bulk actions ──────────────────────────────────────────────────────────
  const handleBulkDelete = () => {
    if (onBulkDelete && selectedItems.size > 0) { onBulkDelete(Array.from(selectedItems)); clearSelection(); }
  };
  const handleBulkEditConfirm = async (changes) => {
    if (!onBulkEdit || selectedItems.size === 0) return;
    await onBulkEdit(Array.from(selectedItems), changes);
    setIsBulkEditOpen(false);
    clearSelection();
  };

  const handleExportExcel = async () => {
    try {
      showToast('מייצא נתונים לאקסל...', 'info');
      await collectionsService.exportCollection(collectionId);
      showToast('הקובץ יוצא בהצלחה', 'success');
    } catch (error) {
      console.error('Export error:', error);
      showToast('שגיאה בייצוא לאקסל', 'error');
    }
  };

  // ── Pagination ────────────────────────────────────────────────────────────
  const { currentPage, itemsPerPage, goToPage, setItemsPerPage } = usePagination(1, 25);
  const totalItems = processedItems.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return processedItems.slice(start, start + itemsPerPage);
  }, [processedItems, currentPage, itemsPerPage]);

  // ── Empty state ───────────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="table-empty-state">
        <div className="empty-state-content">
          <p>אין פריטים באוסף זה עדיין.</p>
          {!isReadOnly && onAddItem && (
            <Button variant="primary" onClick={onAddItem} className="mt-4">
              <FaPlus className="ml-2" /> הוסף פריטים
            </Button>
          )}
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  // ── Render ────────────────────────────────────────────────────────────────
  const headerContent = (
    <div className="table-toolbar" dir="rtl" style={{ margin: 0 }}>
      {/* Filters toggle */}
      <Button variant={showFilters ? 'primary' : 'ghost'} size="sm"
        onClick={() => setShowFilters(v => !v)} className="column-filter-button"
        title={showFilters ? 'הסתר פילטרים' : 'הצג פילטרים'}>
        <FaFilter /> {showFilters ? 'הסתרה' : 'פילטרים'}
      </Button>

      {/* Column visibility */}
      <div className="column-filter-wrapper relative" ref={filterRef}>
        <Button variant="ghost" size="sm" onClick={() => setShowColumnDropdown(!showColumnDropdown)} className="column-filter-button">
          <FiColumns /> הצגת עמודות
        </Button>
        {showColumnDropdown && (
          <div className="column-filter-dropdown" style={{ right: 0, top: '100%', position: 'absolute', zIndex: 1000 }}>
            <div className="filter-dropdown-header">בחר עמודות להצגה</div>
            <div className="filter-dropdown-content">
              {COLLECTION_TABLE_COLUMNS.map(col => (
                <label key={col.key} className="column-checkbox-label">
                  <input type="checkbox" checked={visibleColumns[col.key] !== false} onChange={() => toggleColumn(col.key)} />
                  <span>{col.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add */}
      {!isReadOnly && onAddItem && (
        <Button variant="ghost" size="sm" onClick={onAddItem}><FaPlus /> הוסף פריטים</Button>
      )}

      
      {/* Export */}
      <Button variant="ghost" size="sm" onClick={handleExportExcel} title="ייצוא לאקסל">
        <FaFileExcel className="mr-2" style={{ color: '#107c41' }} /> ייצוא
      </Button>

      {/* Bulk Edit */}
      {!isReadOnly && onBulkEdit && (
        <Button variant="ghost" size="sm"
          onClick={() => { if (selectedItems.size === 0) { showToast('יש לבחור פריטים לעריכה', 'warning'); return; } setIsBulkEditOpen(true); }}
          disabled={selectedItems.size === 0}
          title={selectedItems.size === 0 ? 'בחר פריטים לעריכה' : `ערוך ${selectedItems.size} פריטים`}>
          <FiEdit2 /> עריכה {selectedItems.size > 0 ? `(${selectedItems.size})` : ''}
        </Button>
      )}

      {/* Bulk Delete */}
      {!isReadOnly && onBulkDelete && (
        <Button variant="danger" size="sm" onClick={handleBulkDelete} disabled={selectedItems.size === 0}
          title={selectedItems.size === 0 ? 'בחר פריטים למחיקה' : ''}>
          <FaTrash /> מחק {selectedItems.size > 0 ? `(${selectedItems.size})` : ''}
        </Button>
      )}

      {/* Cell selection hint */}
      {selectedCells.length > 0 && (
        <span className="cell-selection-hint">{selectedCells.length} תאים נבחרו &nbsp;·&nbsp; Ctrl+C להעתקה</span>
      )}

      <div style={{ flex: 1 }}></div>

      {/* Search */}
      <div className="collection-search-wrapper" style={{ marginRight: 'auto' }}>
        <input type="text" className="collection-search-input" placeholder="חיפוש חופשי באוסף..."
          value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
      </div>
    </div>
  );

  const paginationContent = totalPages > 1 ? (
    <Pagination
      currentPage={currentPage}
      totalPages={totalPages}
      totalItems={totalItems}
      limit={itemsPerPage}
      onPageChange={goToPage}
      onItemsPerPageChange={setItemsPerPage}
    />
  ) : null;

  return (
    <div className="collection-items-table-container min-h-0 flex-1 flex flex-col" dir="rtl">
      <ScrollableTableLayout header={headerContent} pagination={paginationContent}>
        <div className="items-table-container">
        <table className="collection-items-table" dir="rtl">
          <thead>
            <tr>
              {!isReadOnly && (
                <th scope="col" className="w-10">
                  <input type="checkbox" onChange={handleSelectAll}
                    checked={processedItems.length > 0 && selectedItems.size === processedItems.length} />
                </th>
              )}
              {COLLECTION_TABLE_COLUMNS.map(col => visibleColumns[col.key] !== false ? (
                <th key={col.key} scope="col" onClick={() => handleSort(col.key)}
                  className="sortable-header" style={{ cursor: 'pointer' }}>
                  <div className="flex items-center gap-1">
                    {col.label}
                    {sortConfig.key === col.key && (sortConfig.direction === 'asc' ? ' ↑' : ' ↓')}
                  </div>
                </th>
              ) : null)}
              {customFields.map(f => <th key={f.key} scope="col">{f.label}</th>)}
              {!isReadOnly && <th scope="col" className="actions-header">פעולות</th>}
            </tr>

            {showFilters && (
              <tr className="filter-row bg-gray-50">
                {!isReadOnly && <th className="p-1" />}
                {COLLECTION_TABLE_COLUMNS.map(col => visibleColumns[col.key] !== false ? (
                  <th key={`f-${col.key}`} className="p-1">
                    <Input placeholder="סינון..." value={filters[col.key] || ''}
                      onChange={e => handleFilterChange(col.key, e.target.value)}
                      className="h-[25px] text-xs w-full" />
                  </th>
                ) : null)}
                {customFields.map(f => <th key={`f-${f.key}`} className="p-1" />)}
                {!isReadOnly && <th className="p-1" />}
              </tr>
            )}
          </thead>

          <tbody>
            {paginatedItems.map(item => {
              const isEditing     = editingId === item.item_id;
              const isRowSelected = selectedItems.has(item.item_id);

              return (
                <tr key={item.item_id} className={isRowSelected ? 'row-selected' : ''} onClick={e => handleRowClick(item, e)}>
                  {!isReadOnly && (
                    <td>
                      <input type="checkbox" checked={isRowSelected}
                        onChange={e => handleCheckboxClick(item.item_id, e)}
                        onClick={e => e.stopPropagation()} />
                    </td>
                  )}

                  {COLLECTION_TABLE_COLUMNS.map(col => {
                    if (visibleColumns[col.key] === false) return null;

                    let content = item[col.key];
                    if (col.key === 'current_stock') {
                      content = content !== undefined ? content : '-';
                    } else if (col.key === 'project_allocations' && content && typeof content === 'object') {
                      content = Array.isArray(content)
                        ? content.join(', ')
                        : Object.entries(content).map(([k, v]) => `${k}: ${v}`).join(', ');
                    } else {
                      content = content || '-';
                    }

                    const cellKey      = `${item.item_id}-${col.key}`;
                    const isCellSelected = selectedCells.some(c => c.key === cellKey);

                    return (
                      <td key={col.key}
                        className={[col.key === 'catalog_number' ? 'primary-text' : '', isCellSelected ? 'cell-selected' : ''].join(' ')}
                        onDoubleClick={() => copyToClipboard(content === '-' ? '' : content)}
                        onMouseDown={e => handleCellMouseDown(e, item.item_id, col.key, content)}
                        onMouseEnter={e => handleCellMouseEnter(e, item.item_id, col.key, content)}
                        title="לחץ לבחירה · גרור להרחבה · Ctrl+חצים להרחבה מהמקלדת">
                        {content}
                      </td>
                    );
                  })}

                  {customFields.map(field => (
                    <td key={field.key}>
                      {isEditing
                        ? <Input value={editValues[field.key] || ''}
                            onChange={e => setEditValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                            type={field.type === 'number' ? 'number' : 'text'}
                            className="h-8 text-sm w-full min-w-[100px]" />
                        : <span>{item.custom_values?.[field.key] || '-'}</span>
                      }
                    </td>
                  ))}

                  {!isReadOnly && (
                    <td>
                      <div className="actions-cell">
                        {customFields.length > 0 && (
                          isEditing ? (
                            <>
                              <button onClick={() => handleSaveEdit(item)} className="action-btn save" title="שמור"><FaCheck /></button>
                              <button onClick={handleCancelEdit} className="action-btn cancel" title="ביטול"><FaTimes /></button>
                            </>
                          ) : (
                            <button onClick={() => handleStartEdit(item)} className="action-btn edit" title="ערוך"><FaEdit /></button>
                          )
                        )}
                        {!isEditing && (
                          <button onClick={() => onUnassign(item)} className="action-btn delete" title="הסר מהאוסף"><FaTrash /></button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      </ScrollableTableLayout>

      {!isReadOnly && onBulkEdit && (
        <BulkEditModal isOpen={isBulkEditOpen} onClose={() => setIsBulkEditOpen(false)}
          onConfirm={handleBulkEditConfirm} selectedCount={selectedItems.size} />
      )}
    </div>
  );
};

CollectionItemsTable.propTypes = {
  items:               PropTypes.array.isRequired,
  customFields:        PropTypes.array,
  collectionId:        PropTypes.string,
  onUnassign:          PropTypes.func,
  onBulkDelete:        PropTypes.func,
  onUpdateCustomValue: PropTypes.func,
  onBulkEdit:          PropTypes.func,
  onAddItem:           PropTypes.func,
  isReadOnly:          PropTypes.bool
};

export default CollectionItemsTable;
