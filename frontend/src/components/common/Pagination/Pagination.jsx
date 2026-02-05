import React from 'react';
import { FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight } from 'react-icons/fi';
import './Pagination.css';

const Pagination = ({
  currentPage,
  totalPages,
  totalItems,
  limit,
  onPageChange,
  onItemsPerPageChange,
}) => {
  const pageSizeOptions = [25, 50, 75, 100, 'הכל'];

  const handlePageSizeChange = (e) => {
    const value = e.target.value;
    if (value === 'all') {
      onItemsPerPageChange(totalItems);
    } else {
      onItemsPerPageChange(parseInt(value));
    }
  };

  const startItem = (currentPage - 1) * limit + 1;
  const endItem = Math.min(currentPage * limit, totalItems);

  return (
    <div className="pagination">
      <div className="pagination__info">
        <span className="pagination__count">
          מציג {startItem}-{endItem} מתוך {totalItems} פריטים
        </span>

        <div className="pagination__size-selector">
          <label>הצג:</label>
          <select
            value={limit >= totalItems ? 'all' : limit}
            onChange={handlePageSizeChange}
            className="pagination__select"
          >
            {pageSizeOptions.map((option) => (
              <option
                key={option}
                value={option === 'הכל' ? 'all' : option}
              >
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="pagination__controls">
          <button
            className="pagination__btn"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            title="עמוד ראשון"
          >
            <FiChevronsRight />
          </button>

          <button
            className="pagination__btn"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            title="הקודם"
          >
            <FiChevronRight />
          </button>

          <div className="pagination__pages">
            <span className="pagination__current">{currentPage}</span>
            <span className="pagination__separator">/</span>
            <span className="pagination__total">{totalPages}</span>
          </div>

          <button
            className="pagination__btn"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            title="הבא"
          >
            <FiChevronLeft />
          </button>

          <button
            className="pagination__btn"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            title="עמוד אחרון"
          >
            <FiChevronsLeft />
          </button>
        </div>
      )}
    </div>
  );
};

export default Pagination;
