import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { FiArrowUp, FiArrowDown, FiSave, FiX } from 'react-icons/fi';
import Input from '../../common/Input/Input';
import { useUndoRedo } from '../../../hooks/useUndoRedo';
import { useTableKeyboard } from '../../../hooks/useTableKeyboard';
import { useTableSelection } from '../../../hooks/useTableSelection';
import { useCellEditing } from '../../../hooks/useCellEditing';
import { useContextMenu } from '../../../hooks/useContextMenu';
import { TABLE_COLUMNS, IMMUTABLE_FIELDS } from '../../../constants/tableConfig';
import { formatCellValue } from '../../../utils/formatters';
import logService from '../../../api/services/logService';
import { useAuth } from '../../../context/AuthContext';

import { TableCell, ContextMenu, FloatingToolbar, SelectionIndicator } from '../../common';

import './ItemTable.css';

const ItemTable = ({
  canEdit = false,
  items,
  selection = {},
  sorting = {},
  filtering = {},
  editing = {},
  onBulkEdit,
  onBulkDelete,
  isAdding,
  newRowData,
  onNewRowChange,
  onSaveNew,
  onCancelNew,
  onShowToast,
  onRestoreItems
}) => {
  const { selectedItems = [], setSelectedItems, onSelectItem, onSelectAll } = selection;
  const { sortConfig, onSort } = sorting;
  const { filters = {}, showFilters = false, onChange: onFilterChange } = filtering;
  const { onEdit } = editing;

  const [lastSelectedId, setLastSelectedId] = useState(null);
  const tableContainerRef = useRef(null);
  const columns = TABLE_COLUMNS;
  const { user } = useAuth();

  // Undo/Redo hook
  const {
    executeEdit,
    recordDelete,
    undoEdit,
    undoDelete,
    redo,
    canUndo,
    canRedo,
    undo
  } = useUndoRedo({
    onEdit: async (itemId, field, value, isUndo = false) => {
      await onEdit(itemId, field, value, isUndo);
    },
    onRestoreItems: onRestoreItems,
    onCreateUndoLog: async (type, details) => {
      // Get current user from auth context
      const username = user?.username || 'unknown';
      
      if (type === 'edit') {
        await logService.createLog({
          action: 'undo',
          user: username,
          details: `ביטול עריכה: ${details.field} מ-"${details.from}" ל-"${details.to}"`,
          changes: {
            [details.field]: {
              old: details.from,
              new: details.to
            }
          }
        });
      } else if (type === 'delete') {
        await logService.createLog({
          action: 'undo',
          user: username,
          details: details.isBulk 
            ? `ביטול מחיקה של ${details.count} פריטים`
            : `ביטול מחיקת פריט`,
          count: details.count
        });
      }
    }
  });

  // Cell selection hook
  const {
    selectedCells,
    focusedCell,
    setFocusedCell,
    setSelectedCells,
    copySelectedCells,
    clearSelection,
    handleCellMouseDown,
    handleCellMouseEnter
  } = useTableSelection({ onShowToast });

  // Cell editing hook
  const {
    editingCell,
    editValue,
    startEdit,
    saveEdit,
    cancelEdit,
    updateEditValue,
    isEditing
  } = useCellEditing({ onEdit, executeEdit, immutableFields: IMMUTABLE_FIELDS });

  // Context menu hook
  const {
    contextMenu,
    handleContextMenu: handleContextMenuOpen,
    closeContextMenu
  } = useContextMenu();

  // Handle undo with toast notification
  const handleUndo = useCallback(async () => {
    if (canUndo) {
      await undo();
      // The type of undo (edit/delete) isn't returned by undo(), but we can infer or use a generic message
      // Or we could check history length change, but keeps it simple for now.
      if (onShowToast) onShowToast('פעולה בוטלה', 'info');
    }
  }, [canUndo, undo, onShowToast]);

  // Handle redo with toast notification
  const handleRedo = useCallback(async () => {
    if (canRedo) {
      await redo();
      if (onShowToast) onShowToast('פעולה שוחזרה', 'info');
    }
  }, [canRedo, redo, onShowToast]);

  // Keyboard handler hook
  useTableKeyboard({
    editingCell,
    selectedCells,
    focusedCell,
    canUndo,
    canRedo,
    items,
    columns,
    onSaveEdit: saveEdit,
    onCopySelectedCells: copySelectedCells,
    onUndo: handleUndo,
    onRedo: handleRedo,
    onStartEditing: startEdit,
    onCancelEdit: cancelEdit,
    onClearSelection: clearSelection,
    onMoveFocus: setFocusedCell,
    onShowToast,
    setSelectedCells,
    immutableFields: IMMUTABLE_FIELDS
  });

  // Expose recordDelete for parent component
  useEffect(() => {
    if (window) {
      window.__tableRecordDelete = recordDelete;
    }
    return () => {
      if (window) {
        delete window.__tableRecordDelete;
      }
    };
  }, [recordDelete]);

  // Double-click handler for cells
  const handleCellDoubleClick = async (item, field, value) => {
    if (!canEdit) return; // Prevent editing for RO users

    if (IMMUTABLE_FIELDS.includes(field)) {
      try {
        const textToCopy = formatCellValue(value);
        await navigator.clipboard.writeText(textToCopy);
        if (onShowToast) {
          onShowToast(`הועתק ללוח: ${textToCopy}`, 'success');
        }
      } catch (err) {
        if (onShowToast) onShowToast('שגיאה בהעתקה', 'error');
      }
      return;
    }
    startEdit(item._id, field, value);
  };

  // Row click handler
  const handleRowClick = (item, e) => {
    if (isAdding) return;
    if (e.target.tagName === 'INPUT' && e.target.type !== 'checkbox') return;
    if (e.target.closest('.item-table__edit-container')) return;

    const id = item._id;

    if (e.ctrlKey || e.metaKey) {
      if (selectedItems.includes(id)) {
        if (setSelectedItems) setSelectedItems(prev => prev.filter(i => i !== id));
        else onSelectItem(id);
      } else {
        if (setSelectedItems) setSelectedItems(prev => [...prev, id]);
        else onSelectItem(id);
      }
      setLastSelectedId(id);
    } else if (e.shiftKey) {
      e.preventDefault();
      if (lastSelectedId && items.find(i => i._id === lastSelectedId) && setSelectedItems) {
        const currentIndex = items.findIndex(i => i._id === id);
        const lastIndex = items.findIndex(i => i._id === lastSelectedId);

        if (currentIndex !== -1 && lastIndex !== -1) {
          const start = Math.min(currentIndex, lastIndex);
          const end = Math.max(currentIndex, lastIndex);
          const rangeIds = items.slice(start, end + 1).map(i => i._id);

          setSelectedItems(prev => {
            const newSet = new Set([...prev, ...rangeIds]);
            return Array.from(newSet);
          });
        }
      } else {
        if (!selectedItems.includes(id)) {
          if (setSelectedItems) setSelectedItems(prev => [...prev, id]);
          else onSelectItem(id);
        }
        setLastSelectedId(id);
      }
    }
  };

  // Sort handler
  const handleSort = (key) => {
    if (!onSort) return;
    let direction = 'asc';
    if (sortConfig && sortConfig.key === key) {
      direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
    }
    onSort(key, direction);
  };

  // Filter change handler
  const handleFilterChange = (key, value) => {
    if (onFilterChange) onFilterChange({ ...filters, [key]: value });
  };

  // New row keydown
  const handleNewRowKeyDown = (e) => {
    if (e.key === 'Enter') onSaveNew();
    if (e.key === 'Escape') onCancelNew();
  };

  // Context menu handler
  const handleContextMenu = (e) => {
    handleContextMenuOpen(e, selectedItems.length > 0 || selectedCells.length > 0);
  };

  // Render cell helper
  const renderCell = (item, col) => {
    const field = col.key;
    const value = item[field];

    return (
      <TableCell
        item={item}
        field={field}
        value={value}
        isEditing={isEditing(item._id, field)}
        editValue={editValue}
        isImmutable={IMMUTABLE_FIELDS.includes(field)}
        isFocused={focusedCell?.itemId === item._id && focusedCell?.field === field}
        isMultiSelected={selectedCells.some(c => c.itemId === item._id && c.field === field)}
        onEditValueChange={updateEditValue}
        onSaveEdit={saveEdit}
        onCancelEdit={cancelEdit}
        onDoubleClick={handleCellDoubleClick}
        onCellClick={setFocusedCell}
        onMouseDown={handleCellMouseDown}
        onMouseEnter={handleCellMouseEnter}
      />
    );
  };

  const frozenColumns = useMemo(() => columns.filter(col => col.frozen), [columns]);
  const scrollableColumns = useMemo(() => columns.filter(col => !col.frozen), [columns]);

  return (
    <div
      className="item-table-container"
      onContextMenu={handleContextMenu}
      ref={tableContainerRef}
    >
      <table className="item-table">
        <thead>
          <tr>
            <th className="th-checkbox th-frozen">
              <input
                type="checkbox"
                checked={selectedItems.length === items.length && items.length > 0}
                onChange={onSelectAll}
                disabled={isAdding}
              />
            </th>
            {frozenColumns.map((col) => (
              <th
                key={col.key}
                onClick={() => handleSort(col.key)}
                className={`sortable-header col-${col.key} th-frozen ${sortConfig?.key === col.key ? 'active-sort' : ''}`}
              >
                <div className="th-content">
                  {col.label}
                  <span className="sort-icon">
                    {sortConfig?.key === col.key && (
                      sortConfig.direction === 'asc' ? <FiArrowUp size={12} /> : <FiArrowDown size={12} />
                    )}
                  </span>
                </div>
              </th>
            ))}
            {scrollableColumns.map((col) => (
              <th
                key={col.key}
                onClick={() => handleSort(col.key)}
                className={`sortable-header col-${col.key} ${sortConfig?.key === col.key ? 'active-sort' : ''}`}
              >
                <div className="th-content">
                  {col.label}
                  <span className="sort-icon">
                    {sortConfig?.key === col.key && (
                      sortConfig.direction === 'asc' ? <FiArrowUp size={12} /> : <FiArrowDown size={12} />
                    )}
                  </span>
                </div>
              </th>
            ))}
          </tr>

          {showFilters && (
            <tr className="filter-row fade-in">
              <td className="filter-cell-empty th-frozen"></td>
              {frozenColumns.map((col) => (
                <td key={`filter-${col.key}`} className={`filter-cell col-${col.key} th-frozen`}>
                  <Input
                    type="text"
                    placeholder="סנן..."
                    value={filters?.[col.key] || ''}
                    onChange={(e) => handleFilterChange(col.key, e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && e.target.blur()} 
                  />
                </td>
              ))}
              {scrollableColumns.map((col) => (
                <td key={`filter-${col.key}`} className={`filter-cell col-${col.key}`}>
                  <Input
                    type="text"
                    placeholder="סנן..."
                    value={filters?.[col.key] || ''}
                    onChange={(e) => handleFilterChange(col.key, e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
                  />
                </td>
              ))}
            </tr>
          )}
        </thead>

        <tbody>
          {isAdding && (
            <tr className="new-item-row">
              <td className="new-item-actions-cell th-frozen">
                <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                  <button onClick={onSaveNew} className="action-btn-mini save" title="שמור (Enter)">
                    <FiSave size={16} />
                  </button>
                  <button onClick={onCancelNew} className="action-btn-mini cancel" title="בטל (Esc)">
                    <FiX size={16} />
                  </button>
                </div>
              </td>
              {frozenColumns.map((col) => (
                <td key={`new-${col.key}`} className={`col-${col.key} th-frozen`}>
                  <input
                    type={col.type === 'number' ? 'number' : (col.type === 'date' ? 'date' : 'text')}
                    className="new-item-input"
                    placeholder={col.label}
                    value={newRowData[col.key] || ''}
                    onChange={(e) => onNewRowChange(col.key, e.target.value)}
                    onKeyDown={handleNewRowKeyDown}
                    autoFocus={col.key === 'catalog_number'}
                  />
                </td>
              ))}
              {scrollableColumns.map((col) => (
                <td key={`new-${col.key}`} className={`col-${col.key}`}>
                  <input
                    type={col.type === 'number' ? 'number' : (col.type === 'date' ? 'date' : 'text')}
                    className="new-item-input"
                    placeholder={col.label}
                    value={newRowData[col.key] || ''}
                    onChange={(e) => onNewRowChange(col.key, e.target.value)}
                    onKeyDown={handleNewRowKeyDown}
                  />
                </td>
              ))}
            </tr>
          )}

          {items.length === 0 && !isAdding ? (
            <tr>
              <td colSpan={columns.length + 1} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                לא נמצאו פריטים תואמים
              </td>
            </tr>
          ) : (
            items.map((item) => (
              <tr
                key={item._id}
                className={selectedItems.includes(item._id) ? 'row-selected' : ''}
                onClick={(e) => handleRowClick(item, e)}
              >
                <td className="th-frozen">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item._id)}
                    onChange={() => {
                      onSelectItem(item._id);
                      setLastSelectedId(item._id);
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </td>
                {frozenColumns.map((col) => (
                  <td key={col.key} className={`col-${col.key} th-frozen`}>
                    {renderCell(item, col)}
                  </td>
                ))}
                {scrollableColumns.map((col) => (
                  <td key={col.key} className={`col-${col.key}`}>
                    {renderCell(item, col)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Floating Toolbar - Undo/Redo */}
      {canEdit && (
        <FloatingToolbar
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={handleUndo}
          onRedo={handleRedo}
        />
      )}

      {/* Multi-cell selection indicator */}
      <SelectionIndicator count={selectedCells.length} />

      {/* Context Menu */}
      <ContextMenu
        position={contextMenu}
        selectedItemsCount={selectedItems.length}
        selectedCellsCount={selectedCells.length}
        onEdit={canEdit ? onBulkEdit : null}
        onDelete={canEdit ? onBulkDelete : null}
        onCopy={copySelectedCells}
        onClose={closeContextMenu}
      />
    </div>
  );
};

export default ItemTable;