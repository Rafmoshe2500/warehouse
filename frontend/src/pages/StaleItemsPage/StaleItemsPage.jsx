import React, { useState, useEffect } from 'react';
import { useItems } from '../../hooks/useItems';
import { useToast } from '../../hooks/useToast';
import itemService from '../../api/services/itemService';
import ItemTable from '../../components/inventory/ItemTable/ItemTable';
import { usePagination } from '../../hooks/usePagination';
import { ScrollableTableLayout, Pagination } from '../../components/common';
import './StaleItemsPage.css';

const StaleItemsPage = () => {
    const [items, setItems] = useState([]);
    const [totalItems, setTotalItems] = useState(0);
    const [loading, setLoading] = useState(false);
    const [days, setDays] = useState(30);
    
    const { addToast } = useToast();
    const { currentPage, itemsPerPage, goToPage, setItemsPerPage } = usePagination(1, 25);

    useEffect(() => {
        loadStaleItems();
    }, [currentPage, itemsPerPage, days]);

    const loadStaleItems = async () => {
        setLoading(true);
        try {
            const data = await itemService.getStaleItems(days, currentPage, itemsPerPage);
            setItems(data.items || []);
            setTotalItems(data.total || 0);
        } catch (err) {
            console.error(err);
            addToast('שגיאה בטעינת פריטים ישנים', 'error');
        } finally {
            setLoading(false);
        }
    };

    const [selectedItems, setSelectedItems] = useState([]);

    const handleEditCell = async (itemId, field, value) => {
        try {
            await itemService.updateItem(itemId, field, value);
            addToast('הפריט עודכן בהצלחה', 'success');
            loadStaleItems();
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
        <div className="stale-items-page">
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
                    totalPages > 0 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={totalItems}
                            limit={itemsPerPage}
                            onPageChange={goToPage}
                            onItemsPerPageChange={setItemsPerPage}
                        />
                    )
                }
                contentMaxHeight="calc(100vh - 350px)"
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

export default StaleItemsPage;

