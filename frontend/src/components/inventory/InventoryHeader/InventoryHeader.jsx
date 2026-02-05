import React from 'react';
import { FiPlus, FiUpload, FiDownload, FiEdit2, FiTrash2, FiFilter } from 'react-icons/fi';
import Button from '../../common/Button/Button';
import './InventoryHeader.css';

const InventoryHeader = ({
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
  onImportProjectsClick
}) => {
  return (
    <div className="inventory-header">
      <div className="action-buttons">
        <Button variant="secondary" onClick={onUploadClick} disabled={uploadingExcel} className="btn-icon">
          <FiUpload /> {uploadingExcel ? 'טוען...' : 'יבוא אקסל'}
        </Button>

        <Button variant="secondary" onClick={onImportProjectsClick} disabled={uploadingExcel} className="btn-icon">
          <FiUpload /> העלאת שריונים
        </Button>

        <Button variant="secondary" onClick={onExportClick} className="btn-icon">
          <FiDownload /> ייצוא
        </Button>

        <Button
          variant={showFilters ? 'primary' : 'secondary'}
          onClick={onFilterToggle}
          title={showFilters ? "הסתר פילטרים" : "הצג פילטרים"}
          className="btn-icon"
        >
          <FiFilter /> {showFilters ? 'הסתר פילטר' : 'הצג פילטר'}
        </Button>

        <Button onClick={onAddClick} className="btn-icon">
          <FiPlus /> הוסף פריט
        </Button>
        <Button 
          variant="secondary" 
          onClick={onBulkEdit} 
          disabled={selectedItems.length === 0}
          className="btn-icon"
          title={selectedItems.length === 0 ? "סמן פריטים לעריכה" : "ערוך פריטים מסומנים"}
        >
          <FiEdit2 /> עריכה {selectedItems.length > 0 && `(${selectedItems.length})`}
        </Button>

        <Button 
          variant="danger" 
          onClick={onBulkDelete} 
          disabled={selectedItems.length === 0}
          className="btn-icon"
          title={selectedItems.length === 0 ? "סמן פריטים למחיקה" : "מחק פריטים מסומנים"}
        >
          <FiTrash2 /> מחק {selectedItems.length > 0 && `(${selectedItems.length})`}
        </Button>
        <div className="divider-vertical"></div>
      
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
