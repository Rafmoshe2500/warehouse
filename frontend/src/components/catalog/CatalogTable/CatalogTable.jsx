import React from 'react';
import { FiArrowUp, FiArrowDown } from 'react-icons/fi';
import Input from '../../common/Input/Input';
import './CatalogTable.css';

const CATALOG_COLUMNS = [
  { key: 'catalog_number', label: 'מק"ט' },
  { key: 'description', label: 'תיאור' },
  { key: 'manufacturer', label: 'יצרן' },
  { key: 'total_in_stock', label: 'כמות במלאי' }
];

const CatalogTable = ({
  items,
  sorting = {},
  filtering = {}
}) => {
  const { sortConfig, onSort } = sorting;
  const { filters = {}, showFilters = false, onChange: onFilterChange } = filtering;

  const handleSort = (key) => {
    if (!onSort) return;
    let direction = 'asc';
    if (sortConfig && sortConfig.key === key) {
        direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
    }
    onSort(key, direction);
  };

  const handleFilterChange = (key, value) => {
    if (onFilterChange) onFilterChange({ ...filters, [key]: value });
  };

  return (
    <div className="catalog-table-container">
      <table className="catalog-table">
        <thead>
          <tr>
            {CATALOG_COLUMNS.map((col) => (
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
              {CATALOG_COLUMNS.map((col) => (
                <td key={`filter-${col.key}`} className={`filter-cell col-${col.key}`}>
                  {col.key !== 'total_in_stock' ? (
                    <Input
                      type="text"
                      placeholder="סנן..."
                      value={filters?.[col.key] || ''}
                      onChange={(e) => handleFilterChange(col.key, e.target.value)}
                    />
                  ) : (
                    /* total_in_stock is calculated, filtering might not be supported easily without DB changes, just skip filtering field */
                    <div className="filter-cell-empty"></div>
                  )}
                </td>
              ))}
            </tr>
          )}
        </thead>
        
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={CATALOG_COLUMNS.length} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                לא נמצאו פריטים תואמים
              </td>
            </tr>
          ) : (
            items.map((item) => (
              <tr key={item._id} className="catalog-table-row">
                <td className={`col-catalog_number`}>{item.catalog_number}</td>
                <td className={`col-description`}>{item.description}</td>
                <td className={`col-manufacturer`}>{item.manufacturer}</td>
                <td className={`col-total_in_stock`}>{item.total_in_stock}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default CatalogTable;
