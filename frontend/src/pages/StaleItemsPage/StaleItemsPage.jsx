import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useStaleItems } from '../../hooks/useStaleItems';
import { useToast } from '../../hooks/useToast';

import ItemTable from '../../components/inventory/ItemTable/ItemTable';
import { usePagination } from '../../hooks/usePagination';
import { ScrollableTableLayout, Pagination } from '../../components/common';
import './StaleItemsPage.css';

const StaleItemsPage = ({ isEmbedded = false }) => {
    // 1. UI State
    const [days, setDays] = useState(30);
    const [selectedItems, setSelectedItems] = useState([]);
    
    // 2. Pagination
    const { currentPage, itemsPerPage, goToPage, setItemsPerPage } = usePagination(1, 25);
    const { addToast } = useToast();

    // 3. React Query Data Fetching
    const { 
        items, 
        totalItems, 
        loading, 
        error: loadError,
        updateStaleItem 
    } = useStaleItems(days, currentPage, itemsPerPage);

    useEffect(() => {
        if (loadError) {
            addToast('שגיאה בטעינת פריטים ישנים', 'error');
        }
    }, [loadError, addToast]);

    // 4. Handlers
    const handleEditCell = async (itemId, field, value) => {
        try {
            await updateStaleItem({ itemId, field, value });
            addToast('הפריט עודכן בהצלחה', 'success');
            // No manual reload needed!
        } catch (err) {
            console.error(err);
            addToast('שגיאה בעדכון פריט', 'error');
        }
    };

    const handleSelectItem = (id) => {
        setSelectedItems(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleSelectAll = (e) => {
        if (selectedItems.length === items.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(items.map(i => i._id));
        }
    };

    const totalPages = Math.ceil(totalItems / itemsPerPage);

    return (
        <div className={isEmbedded ? "stale-items-page-embedded" : "stale-items-page"}>
            <ScrollableTableLayout
                header={
                    <div className="stale-items-header">
                        {/* Title removed */}
                        <div className="days-filter">
                            <label>הצג פריטים שלא עודכנו למעלה מ-</label>
                            <input 
                                type="number" 
                                value={days} 
                                onChange={(e) => setDays(Number(e.target.value))}
                                min="0"
                                className="days-input"
                            />
                            <span>ימים</span>
                        </div>
                    </div>
                }
                pagination={
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={totalItems}
                        limit={itemsPerPage}
                        onPageChange={goToPage}
                        onItemsPerPageChange={setItemsPerPage}
                    />
                }
            >
                <ItemTable 
                    items={items}
                    editing={{ onEdit: handleEditCell }}
                    selection={{
                        selectedItems,
                        setSelectedItems,
                        onSelectItem: handleSelectItem,
                        onSelectAll: handleSelectAll
                    }}
                />
            </ScrollableTableLayout>
        </div>
    );
};

StaleItemsPage.propTypes = {
  isEmbedded: PropTypes.bool
};

export default StaleItemsPage;
