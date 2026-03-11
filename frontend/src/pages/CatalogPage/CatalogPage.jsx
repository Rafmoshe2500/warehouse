import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FiFilter } from 'react-icons/fi';
import { useCatalog } from '../../hooks/useCatalog';
import { useToast } from '../../hooks/useToast';
import { usePagination } from '../../hooks/usePagination';
import { useDebounce } from '../../hooks/useDebounce';

import CatalogTable from '../../components/catalog/CatalogTable/CatalogTable';
import { ScrollableTableLayout, Pagination, SkeletonTable, Button } from '../../components/common';
import './CatalogPage.css';

const CatalogPage = ({ isEmbedded = false }) => {
    // 1. Pagination & UI State
    const { currentPage, itemsPerPage, goToPage, setItemsPerPage } = usePagination(1, 25);
    const { addToast } = useToast();
    
    const [filters, setFilters] = useState({});
    const [sortConfig, setSortConfig] = useState({ key: 'catalog_number', direction: 'asc' });
    const [showFilters, setShowFilters] = useState(false);

    const debouncedFilters = useDebounce(filters, 500);

    const queryParams = {
        page: currentPage,
        limit: itemsPerPage,
        sort_by: sortConfig.key,
        sort_order: sortConfig.direction,
        ...debouncedFilters
    };

    // 2. Data Fetching
    const { 
        items, 
        totalItems, 
        totalPages,
        loading, 
        error: loadError
    } = useCatalog(queryParams);

    useEffect(() => {
        if (loadError) {
            addToast('שגיאה בטעינת קטלוג פריטים', 'error');
        }
    }, [loadError, addToast]);

    // 3. Handlers
    const handleSort = (key, direction) => {
        setSortConfig({ key, direction });
    };

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
        if (currentPage !== 1) goToPage(1);
    };

    return (
        <div className={isEmbedded ? "catalog-page-embedded" : "catalog-page"}>
            <div className="catalog-header">
                <div className="action-buttons">
                    <Button 
                        variant={showFilters ? 'primary' : 'secondary'}
                        onClick={() => setShowFilters(!showFilters)}
                        title={showFilters ? "הסתרה" : "פילטרים"}
                        className="btn-icon"
                    >
                        <FiFilter /> {showFilters ? 'הסתרה' : 'פילטרים'}
                    </Button>
                </div>
            </div>
            <ScrollableTableLayout
                pagination={
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages || Math.ceil(totalItems / itemsPerPage) || 1}
                        totalItems={totalItems}
                        limit={itemsPerPage}
                        onPageChange={goToPage}
                        onItemsPerPageChange={setItemsPerPage}
                    />
                }
            >
                {loading && !items.length ? (
                    <SkeletonTable rows={8} columns={4} />
                ) : (
                    <CatalogTable 
                        items={items}
                        sorting={{ sortConfig, onSort: handleSort }}
                        filtering={{ filters, showFilters, onChange: handleFilterChange }}
                    />
                )}
            </ScrollableTableLayout>
        </div>
    );
};

CatalogPage.propTypes = {
  isEmbedded: PropTypes.bool
};

export default CatalogPage;
