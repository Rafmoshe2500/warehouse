import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useLogs } from '../../hooks/useLogs';
import { usePagination } from '../../hooks/usePagination';
import { LogTimeline, LogFilters } from '../../components/logs';
import { Spinner, ScrollableTableLayout, Pagination } from '../../components/common';
import './LogsPage.css';

const LogsPage = ({ isEmbedded = false }) => {

  const [filters, setFilters] = useState({});
  const { currentPage, itemsPerPage, goToPage, setItemsPerPage } = usePagination(1, 50);

  // React Query Hook
  const { 
    logs, 
    totalLogs, 
    loading, 
    error 
  } = useLogs(filters, currentPage, itemsPerPage);

  const handleFilter = (filterData) => {
    setFilters(filterData);
    goToPage(1);
  };

  const handleClear = () => {
    setFilters({});
    goToPage(1);
  };

  const totalPages = Math.ceil(totalLogs / itemsPerPage);

  return (
    <div className={isEmbedded ? "logs-page-embedded" : "logs-page"}>
      <ScrollableTableLayout
        header={
          <LogFilters onFilter={handleFilter} onClear={handleClear} />
        }
        pagination={
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalLogs}
            limit={itemsPerPage}
            onPageChange={goToPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        }
      >
        {loading ? (
          <div className="logs-page__loading">
            <Spinner size="large" text="טוען לוגים..." />
          </div>
        ) : error ? (
          <div className="logs-page__error">שגיאה: {error}</div>
        ) : (
          <LogTimeline logs={logs} />
        )}
      </ScrollableTableLayout>
    </div>
  );
};

LogsPage.propTypes = {
  isEmbedded: PropTypes.bool
};

export default LogsPage;
