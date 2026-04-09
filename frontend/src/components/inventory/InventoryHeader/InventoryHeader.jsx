import React from 'react';
import { FiPlus, FiUpload, FiDownload, FiEdit2, FiTrash2, FiFilter } from 'react-icons/fi';
import Button from '../../common/Button/Button';
import Spinner from '../../common/Spinner/Spinner';
import ColumnToggle from '../ColumnToggle/ColumnToggle';
import './InventoryHeader.css';

const InventoryHeader = ({
  canEdit = false,
  selectedItems = [],
  showFilters = false,
  uploadingExcel = false,
  searchQuery = '',
  onSearch,
  onFilterToggle,
  onUploadClick,
  onExportClick,
  onAddClick,
  onBulkEdit,
  onBulkDelete,
  onImportProjectsClick,
  // Column Toggle Props
  allColumns,
  visibleColumns,
  onColumnToggle,
  // Feature visibility
  hideImport = false,
  hideAdd = false,
  // Extra content slot (e.g. days filter)
  extraContent
}) => {
  return (
    <div className="inventory-header">
      <div className="action-buttons">
        {canEdit && !hideImport && (
          <>
            <Button variant="secondary" onClick={onUploadClick} disabled={uploadingExcel} className="btn-icon" data-testid="import-button">
              <FiUpload /> {uploadingExcel ? <Spinner inline size="small" /> : 'יבוא מלאי'}
            </Button>

            <Button variant="secondary" onClick={onImportProjectsClick} disabled={uploadingExcel} className="btn-icon">
              <FiUpload /> יבוא שריונים
            </Button>
          </>
        )}

        <Button variant="secondary" onClick={onExportClick} className="btn-icon" data-testid="export-button">
          <FiDownload /> ייצוא
        </Button>

        <Button
          variant={showFilters ? 'primary' : 'secondary'}
          onClick={onFilterToggle}
          title={showFilters ? "הסתרה" : "פילטרים"}
          className="btn-icon"
        >
          <FiFilter /> {showFilters ? 'הסתרה' : 'פילטרים'}
        </Button>

        {allColumns && (
          <ColumnToggle
            allColumns={allColumns}
            visibleColumns={visibleColumns}
            onToggle={onColumnToggle}
          />
        )}

        {canEdit && !hideAdd && (
          <>
            <Button onClick={onAddClick} className="btn-icon" data-testid="add-item-button">
              <FiPlus /> הוסף
            </Button>
            <Button 
              variant="secondary" 
              onClick={onBulkEdit} 
              disabled={selectedItems.length === 0}
              className="btn-icon"
              title={selectedItems.length === 0 ? "סמן פריטים לעריכה" : "ערוך פריטים מסומנים"}
              data-testid="bulk-edit-button"
            >
              <FiEdit2 /> עריכה {selectedItems.length > 0 && `(${selectedItems.length})`}
            </Button>

            <Button 
              variant="danger" 
              onClick={onBulkDelete} 
              disabled={selectedItems.length === 0}
              className="btn-icon"
              title={selectedItems.length === 0 ? "סמן פריטים למחיקה" : "מחק פריטים מסומנים"}
              data-testid="delete-button"
            >
              <FiTrash2 /> מחק {selectedItems.length > 0 && `(${selectedItems.length})`}
            </Button>
          </>
        )}
        <div className="divider-vertical"></div>
        {extraContent}
      </div>

      <div className="header-search">
         <div className="search-input-wrapper">
             <input 
                type="text" 
                placeholder="חיפוש חופשי..." 
                value={searchQuery}
                onChange={(e) => onSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && e.target.blur()} 
                className="global-search-input"
             />
         </div>
      </div>
    </div>
  );
};

export default InventoryHeader;
