import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { FiArrowRight, FiSearch } from 'react-icons/fi';
import { ACTION_LABELS } from '../../utils/constants';
import { useToast } from '../../hooks/useToast';
import { usePagination } from '../../hooks/usePagination';
import auditService from '../../api/services/auditService';
import { LogTimeline } from '../../components/logs';
import { 
  Spinner, 
  ScrollableTableLayout, 
  Pagination, 
  Button, 
  Input, 
  Select,
  SkeletonTable
} from '../../components/common';
import './AuditLogs.css';

const AuditLogs = ({ isEmbedded = false }) => {
  const navigate = useNavigate();
  const { error } = useToast();
  const [logs, setLogs] = useState([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: '',
    actor: '',
    target_user: ''
  });

  const { currentPage, itemsPerPage, goToPage, setItemsPerPage } = usePagination(1, 50);

  useEffect(() => {
    fetchLogs();
  }, [currentPage, itemsPerPage]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {
        target_resource: 'user',
        page: currentPage,
        limit: itemsPerPage
      };
      if (filters.action) params.action = filters.action;
      if (filters.actor) params.actor = filters.actor;
      if (filters.target_user) params.target_user = filters.target_user;

      const data = await auditService.getLogs(params);
      setLogs(data.logs);
      setTotalLogs(data.total || 0);
    } catch (err) {
      error('שגיאה בטעינת יומן ביקורת');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    goToPage(1);
    fetchLogs();
  };

  const ACTION_KEYS = [
    'user_create',
    'user_update',
    'user_delete',
    'user_login',
    'password_change',
    'group_create',
    'group_update',
    'group_delete'
  ];

  const ACTION_OPTIONS = ACTION_KEYS.map(key => ({
    value: key,
    label: ACTION_LABELS[key] || key
  }));

  const totalPages = Math.ceil(totalLogs / itemsPerPage);

  const headerContent = (
    <div className="audit-logs-header-items">
      <div className="audit-logs-title-row">
        {!isEmbedded && (
          <Button 
            variant="secondary" 
            icon={<FiArrowRight />} 
            onClick={() => navigate('/admin')}
          >
            חזרה
          </Button>
        )}
      </div>

      <div className="audit-logs-filters-row">
        <Select
          label="סוג פעולה"
          options={ACTION_OPTIONS}
          value={filters.action}
          onChange={(e) => setFilters({ ...filters, action: e.target.value })}
          placeholder="הכל"
          className="filter-select"
          data-testid="audit-action-filter"
        />

        <Input
          label="מבצע"
          value={filters.actor}
          onChange={(e) => setFilters({ ...filters, actor: e.target.value })}
          placeholder="שם משתמש..."
          className="filter-input"
          data-testid="audit-actor-filter"
        />

        <Input
          label="משתמש מושפע"
          value={filters.target_user}
          onChange={(e) => setFilters({ ...filters, target_user: e.target.value })}
          placeholder="שם משתמש..."
          className="filter-input"
          data-testid="audit-target-filter"
        />

        <div className="filter-actions-btn">
           <Button 
            variant="primary" 
            icon={<FiSearch />} 
            onClick={handleSearch}
            data-testid="audit-search-btn"
          >
            חיפוש
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="audit-logs" data-testid="audit-logs">
      <ScrollableTableLayout
        header={headerContent}
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
          <SkeletonTable rows={8} columns={5} />
        ) : (
          <div className="audit-timeline-wrapper" data-testid="audit-timeline">
             <LogTimeline logs={logs} />
          </div>
        )}
      </ScrollableTableLayout>
    </div>
  );
};


AuditLogs.propTypes = {
  isEmbedded: PropTypes.bool
};

export default AuditLogs;
