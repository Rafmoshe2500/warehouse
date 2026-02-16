import { useState, useEffect, useCallback } from 'react';
import collectionsService from '../api/services/collectionsService';

/**
 * Hook for managing "Add to Collection" functionality
 * @param {boolean} canEdit - Whether user has edit permissions
 * @param {Function} addToast - Toast notification function
 * @returns {Object} Collection state and handlers
 */
export const useAddToCollection = (canEdit, addToast) => {
    const [userCollections, setUserCollections] = useState([]);
    const [collectionsModalItem, setCollectionsModalItem] = useState(null);

    // Fetch collections user can write to
    useEffect(() => {
        const fetchUserCollections = async () => {
            try {
                const cols = await collectionsService.getCollections();
                // Filter for collections where user is owner or has rw access (case insensitive)
                const writable = cols.filter(c => 
                    c.role?.toLowerCase() === 'owner' || c.role?.toLowerCase() === 'rw'
                );
                setUserCollections(writable);
            } catch (err) {
                console.error("Failed to fetch collections", err);
            }
        };

        fetchUserCollections();
    }, []);

    const handleAddToCollection = useCallback(async (collection, selectedItems, onSuccess) => {
        if (!selectedItems || selectedItems.length === 0) return;
        
        try {
            await collectionsService.bulkAddItem(collection.id, {
                item_ids: selectedItems,
                custom_values: {}
            });
            addToast(`הפריטים נוספו בהצלחה ל-${collection.name}`, 'success');
            if (onSuccess) onSuccess();
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.detail || 'שגיאה בהוספת פריטים לאוסף';
             if (msg.includes('already in collection')) {
                addToast('חלק מהפריטים כבר קיימים באוסף זה', 'warning');
            } else {
                addToast(msg, 'error');
            }
        }
    }, [addToast]);

    const openCollectionsModal = (item) => {
        setCollectionsModalItem(item);
    };

    const closeCollectionsModal = () => {
        setCollectionsModalItem(null);
    };

    return {
        userCollections,
        collectionsModalItem,
        openCollectionsModal,
        closeCollectionsModal,
        handleAddToCollection
    };
};
