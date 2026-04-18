import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Modal, Button, Input, Pagination, Spinner } from '../common';
import ItemTable from '../inventory/ItemTable/ItemTable';
import { useItems } from '../../hooks/useItems';
import { useDebounce } from '../../hooks/useDebounce';
import { FaSearch } from 'react-icons/fa';
import './AssignItemDialog.css';

const AssignItemDialog = ({ isOpen, onClose, onAssign, isAssigning }) => {
  // State
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: 'updated_at', direction: 'desc' });

  const [filters, setFilters] = useState({});

  // Debounce search
  const debouncedSearch = useDebounce(searchQuery, 500);
  const debouncedFilters = useDebounce(filters, 500);

  // Fetch Items
  const queryParams = useMemo(() => ({
    page: currentPage,
    limit: itemsPerPage,
    search: debouncedSearch,
    sort_by: sortConfig.key,
    sort_order: sortConfig.direction,
    ...debouncedFilters
  }), [currentPage, itemsPerPage, debouncedSearch, sortConfig, debouncedFilters]);

  const { items, totalItems, loading } = useItems(queryParams);

  // Handlers
  const handleSearch = (val) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleSelectItem = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map(i => i._id));
    }
  };

  const handleAssign = () => {
    onAssign(selectedIds);
    setSelectedIds([]);
  };

  const handleClose = () => {
    setSelectedIds([]);
    onClose();
  };

  const handleSort = (key, direction) => {
    setSortConfig({ key, direction });
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="הוספת פריטים לאוסף"
      size="xl"
      className="assign-item-modal" // Custom class for overrides
    >
      <div className="assign-dialog-content" dir="rtl">
        {/* Toolbar */}
        <div className="assign-dialog-toolbar">
          <div className="assign-dialog-actions-left">
              <Button 
                    variant="primary" 
                    onClick={handleAssign}
                    disabled={selectedIds.length === 0 || isAssigning}
                    loading={isAssigning}
                >
                    הוסף ({selectedIds.length}) פריטים
                </Button>
                <Button variant="ghost" onClick={handleClose}>
                    ביטול
                </Button>
          </div>

          <div className="assign-dialog-search">
            <Input
              placeholder="חפש פריטים במלאי..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              icon={<FaSearch className="text-gray-400" />}
            />
          </div>
          <div className="assign-dialog-selection-info">
             נבחרו {selectedIds.length} פריטים
          </div>
        </div>

        {/* Table Content */}
        <div className="assign-dialog-table-wrapper">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
              <Spinner />
            </div>
          ) : (
            <div className="h-full">
                <ItemTable
                    items={items}
                    selection={{
                        selectedItems: selectedIds,
                        onSelectItem: handleSelectItem,
                        onSelectAll: handleSelectAll
                    }}
                    sorting={{
                        sortConfig,
                        onSort: handleSort
                    }}
                    filtering={{
                        filters,
                        showFilters: true,
                        onChange: handleFilterChange
                    }}
                    // Disable editing features
                    canEdit={false}
                    isAdding={false} 
                />
                 {items.length === 0 && !loading && (
                    <div className="table-empty-state">
                        לא נמצאו פריטים
                    </div>
                )}
            </div>
          )}
        </div>

        {/* Footer / Pagination */}
        <div className="assign-dialog-footer">
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                limit={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
            />
        </div>
      </div>
    </Modal>
  );
};

AssignItemDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onAssign: PropTypes.func.isRequired,
  isAssigning: PropTypes.bool
};

export default AssignItemDialog;
