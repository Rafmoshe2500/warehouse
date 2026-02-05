import React from 'react';
import './ScrollableTableLayout.css';

/**
 * Reusable layout component for pages with tables/lists
 * Provides:
 * - Fixed header section
 * - Scrollable content area with defined max-height
 * - Fixed pagination footer always visible at bottom
 * 
 * @param {ReactNode} header - Content for the fixed header (filters, title, etc.)
 * @param {ReactNode} children - Main scrollable content (table, list, etc.)
 * @param {ReactNode} pagination - Pagination controls
 * @param {string} contentMaxHeight - Optional max height for content area (default: calc(100vh - 280px))
 */
const ScrollableTableLayout = ({ 
  header, 
  children, 
  pagination,
  contentMaxHeight = 'calc(100vh - 280px)'
}) => {
  return (
    <div className="scrollable-table-layout">
      {/* Fixed Header Section */}
      {header && (
        <div className="scrollable-table-layout__header">
          {header}
        </div>
      )}

      {/* Scrollable Content Area */}
      <div 
        className="scrollable-table-layout__content"
        style={{ maxHeight: contentMaxHeight }}
      >
        {children}
      </div>

      {/* Fixed Pagination Footer */}
      {pagination && (
        <div className="scrollable-table-layout__footer">
          {pagination}
        </div>
      )}
    </div>
  );
};

export default ScrollableTableLayout;
