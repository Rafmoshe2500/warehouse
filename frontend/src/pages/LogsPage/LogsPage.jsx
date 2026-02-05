import React, { useState, useEffect } from 'react';
import logService from '../../api/services/logService';
import { usePagination } from '../../hooks/usePagination';
import { LogTimeline, LogFilters } from '../../components/logs';
import { Spinner, ScrollableTableLayout, Pagination } from '../../components/common';
import './LogsPage.css';

const LogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({});

  const { currentPage, itemsPerPage, goToPage, setItemsPerPage } = usePagination(1, 50);

  useEffect(() => {
    loadLogs();
  }, [currentPage, itemsPerPage]);

  const loadLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await logService.getLogs({
        ...filters,
        target_resource: 'item', // Filter only item logs
        page: currentPage,
        limit: itemsPerPage,
      });
      setLogs(data.logs);
      setTotalLogs(data.total);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = (filterData) => {
    setFilters(filterData);
    goToPage(1);
    setLoading(true);
    logService
      .getLogs({
        ...filterData,
        target_resource: 'item',
        page: 1,
        limit: itemsPerPage
      })
      .then((data) => {
        setLogs(data.logs);
        setTotalLogs(data.total);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  const handleClear = () => {
    setFilters({});
    goToPage(1);
    loadLogs();
  };

  const totalPages = Math.ceil(totalLogs / itemsPerPage);

  return (
    <div className="logs-page">
      <ScrollableTableLayout
        header={
          <LogFilters onFilter={handleFilter} onClear={handleClear} />
        }
        pagination={
          totalPages > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalLogs}
              limit={itemsPerPage}
              onPageChange={goToPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          )
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

export default LogsPage;

