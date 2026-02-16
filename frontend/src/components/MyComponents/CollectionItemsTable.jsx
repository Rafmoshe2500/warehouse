import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { FaTrash, FaEdit, FaCheck, FaTimes, FaPlus, FaFilter } from 'react-icons/fa';
import { Button, Input } from '../common';
import { useColumnVisibility } from '../../hooks';
import { COLLECTION_TABLE_COLUMNS } from '../../constants/tableConfig';
import { useToast } from '../../context/ToastContext';
import './CollectionItemsTable.css';

const CollectionItemsTable = ({ 
  items, 
  customFields = [], 
  onUnassign, 
  onBulkDelete, 
  onUpdateCustomValue,
  onAddItem,
  isReadOnly = false,
  collectionId
}) => {
  const { showToast } = useToast();
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [filters, setFilters] = useState({});
  const [selectedItems, setSelectedItems] = useState(new Set());

  // Use custom hook for column visibility
  const {
    visibleColumns,
    toggleColumn,
    showFilter,
    setShowFilter,
    filterRef
  } = useColumnVisibility(
    collectionId ? `collection_columns_${collectionId}` : null,
    COLLECTION_TABLE_COLUMNS
  );

  const handleStartEdit = (item) => {
    setEditingId(item.item_id);
    setEditValues(item.custom_values || {});
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValues({});
  };

  const handleSaveEdit = async (item) => {
    await onUpdateCustomValue(item.item_id, { custom_values: editValues });
    setEditingId(null);
  };

  const handleInputChange = (key, value) => {
    setEditValues(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // --- Sorting & Filtering Logic ---
  const handleSort = (key) => {
      let direction = 'asc';
      if (sortConfig.key === key && sortConfig.direction === 'asc') {
          direction = 'desc';
      }
      setSortConfig({ key, direction });
  };

  const handleFilterChange = (key, value) => {
      setFilters(prev => ({
          ...prev,
          [key]: value
      }));
  };

  const getProcessedItems = () => {
      let processed = [...items];

      // 1. Filter
      processed = processed.filter(item => {
          for (const key in filters) {
              if (filters[key]) {
                  const itemValue = String(item[key] || '').toLowerCase();
                  const filterValue = filters[key].toLowerCase();
                  if (!itemValue.includes(filterValue)) {
                      return false;
                  }
              }
          }
          return true;
      });

      // 2. Sort
      if (sortConfig.key) {
          processed.sort((a, b) => {
              const aVal = a[sortConfig.key] || '';
              const bVal = b[sortConfig.key] || '';
              
              if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
              if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
              return 0;
          });
      }

      return processed;
  };

  const processedItems = getProcessedItems();

  // --- Selection Logic ---
  const handleSelectAll = (e) => {
    if (e.target.checked) {
        const allIds = new Set(processedItems.map(item => item.item_id));
        setSelectedItems(allIds);
    } else {
        setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (id) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
        newSelected.delete(id);
    } else {
        newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };
  
  const handleBulkDelete = () => {
      if (onBulkDelete && selectedItems.size > 0) {
          onBulkDelete(Array.from(selectedItems));
          setSelectedItems(new Set());
      }
  };

  const copyToClipboard = async (text) => {
      if (!text || text === '-') return;
      try {
          await navigator.clipboard.writeText(String(text));
          showToast('הועתק ללוח', 'success');
      } catch (err) {
          console.error('Failed to copy:', err);
          showToast('שגיאה בהעתקה', 'error');
      }
  };

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

  return (
    <div className="collection-items-table-container" dir="rtl">
      {/* Table Toolbar */}
      <div className="table-toolbar" dir="rtl">
        <div className="column-filter-wrapper relative" ref={filterRef}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilter(!showFilter)}
            className="column-filter-button"
          >
            <FaFilter />
            הצגת עמודות
          </Button>
          
          {showFilter && (
            <div className="column-filter-dropdown" style={{ right: 0, top: '100%', position: 'absolute', zIndex: 1000 }}>
              <div className="filter-dropdown-header">בחר עמודות להצגה</div>
              <div className="filter-dropdown-content">
                {COLLECTION_TABLE_COLUMNS.map(column => (
                  <label key={column.key} className="column-checkbox-label">
                    <input
                      type="checkbox"
                      checked={visibleColumns[column.key] !== false}
                      onChange={() => toggleColumn(column.key)}
                    />
                    <span>{column.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Add Items Button */}
        {!isReadOnly && onAddItem && (
        <Button
            variant="ghost"
            size="sm"
            onClick={onAddItem}
        >
            <FaPlus />
            הוסף פריטים
        </Button>
        )}

        {/* Bulk Delete Button */}
        {!isReadOnly && onBulkDelete && (
            <Button
                variant="danger"
                size="sm"
                onClick={handleBulkDelete}
                disabled={selectedItems.size === 0}
                title={selectedItems.size === 0 ? "בחר פריטים למחיקה" : ""}
                className={selectedItems.size === 0 ? "opacity-50 cursor-not-allowed" : ""}
            >
                <FaTrash /> מחק {selectedItems.size > 0 ? `(${selectedItems.size})` : ''}
            </Button>
        )}
      </div>

      <div className="items-table-container">
        <table className="collection-items-table" dir="rtl">
          <thead>
            {/* Headers Row */}
            <tr>
              {/* Checkbox Header - Only if not ReadOnly */}
              {!isReadOnly && (
                <th scope="col" className="w-10">
                    <input 
                        type="checkbox" 
                        onChange={handleSelectAll}
                        checked={processedItems.length > 0 && selectedItems.size === processedItems.length}
                    />
                </th>
              )}
              {COLLECTION_TABLE_COLUMNS.map(column => 
                visibleColumns[column.key] !== false ? (
                  <th 
                    key={column.key} 
                    scope="col"
                    onClick={() => handleSort(column.key)}
                    className="sortable-header"
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="flex items-center gap-1">
                        {column.label}
                        {sortConfig.key === column.key && (
                            sortConfig.direction === 'asc' ? ' ↑' : ' ↓'
                        )}
                    </div>
                  </th>
                ) : null
              )}
              {customFields.map(field => (
                <th key={field.key} scope="col">
                  {field.label}
                </th>
              ))}
              {!isReadOnly && <th scope="col" className="actions-header">פעולות</th>}
            </tr>
            {/* Filters Row */}
            <tr className="filter-row bg-gray-50">
                {!isReadOnly && <th className="p-1"></th>}
                {COLLECTION_TABLE_COLUMNS.map(column => 
                    visibleColumns[column.key] !== false ? (
                        <th key={`filter-${column.key}`} className="p-1">
                             <Input 
                                placeholder="סינון..." 
                                value={filters[column.key] || ''}
                                onChange={(e) => handleFilterChange(column.key, e.target.value)}
                                className="h-[25px] text-xs w-full"
                             />
                        </th>
                    ) : null
                )}
                 {/* Spacers for custom fields and actions */}
                 {customFields.map(f => <th key={`filter-${f.key}`} className="p-1"></th>)}
                 {!isReadOnly && <th className="p-1"></th>}
            </tr>
          </thead>
          <tbody>
            {processedItems.map((item) => {
              const isEditing = editingId === item.item_id;
              
              return (
                <tr key={item.item_id}>
                  {/* Checkbox Cell - Only if not ReadOnly */}
                  {!isReadOnly && (
                    <td>
                        <input 
                            type="checkbox"
                            checked={selectedItems.has(item.item_id)}
                            onChange={() => handleSelectItem(item.item_id)}
                        />
                    </td>
                  )}

                  {/* Render standard columns conditionally */}
                  {COLLECTION_TABLE_COLUMNS.map(column => {
                    if (visibleColumns[column.key] === false) return null;
                    
                    let cellContent = item[column.key];
                    
                    // Special handling for different column types
                    if (column.key === 'current_stock') {
                      cellContent = cellContent !== undefined ? cellContent : '-';
                    } else if (column.key === 'project_allocations' && cellContent) {
                      if (typeof cellContent === 'object' && !Array.isArray(cellContent)) {
                        cellContent = Object.entries(cellContent).map(([k, v]) => `${k}: ${v}`).join(', ');
                      } else if (Array.isArray(cellContent)) {
                        cellContent = cellContent.join(', ');
                      }
                    } else {
                      cellContent = cellContent || '-';
                    }
                    
                    return (
                      <td 
                        key={column.key} 
                        className={column.key === 'catalog_number' ? 'primary-text' : ''}
                        onDoubleClick={() => copyToClipboard(cellContent === '-' ? '' : cellContent)} /* Double click copy */
                        title="Double click to copy"
                      >
                        {cellContent}
                      </td>
                    );
                  })}
                  
                  {/* Custom Fields */}
                  {customFields.map(field => (
                    <td key={field.key}>
                      {isEditing ? (
                        <Input
                          value={editValues[field.key] || ''}
                          onChange={(e) => handleInputChange(field.key, e.target.value)}
                          type={field.type === 'number' ? 'number' : 'text'}
                          className="h-8 text-sm w-full min-w-[100px]"
                        />
                      ) : (
                        <span>{(item.custom_values && item.custom_values[field.key]) || '-'}</span>
                      )}
                    </td>
                  ))}
                  
                  {/* Actions */}
                  {!isReadOnly && (
                    <td>
                      <div className="actions-cell">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => handleSaveEdit(item)}
                              className="action-btn save"
                              title="שמור"
                            >
                              <FaCheck />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="action-btn cancel"
                              title="ביטול"
                            >
                              <FaTimes />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleStartEdit(item)}
                              className="action-btn edit"
                              title="ערוך"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => onUnassign(item)}
                              className="action-btn delete"
                              title="הסר מהאוסף"
                            >
                              <FaTrash />
                            </button>
                          </>
                        )
                    }
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

CollectionItemsTable.propTypes = {
  items: PropTypes.array.isRequired,
  customFields: PropTypes.array,
  collectionId: PropTypes.string,
  onUnassign: PropTypes.func,
  onUpdateCustomValue: PropTypes.func,
  onAddItem: PropTypes.func,
  isReadOnly: PropTypes.bool
};

export default CollectionItemsTable;
