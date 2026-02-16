import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { FaArrowRight, FaCog, FaPlus, FaBoxOpen } from 'react-icons/fa';
import { Button, Spinner } from '../../components/common';
import CollectionSettings from '../../components/MyComponents/Settings/CollectionSettings';
import CollectionItemsTable from '../../components/MyComponents/CollectionItemsTable';
import AssignItemDialog from '../../components/MyComponents/AssignItemDialog';
import ScrollableTableLayout from '../../components/common/ScrollableTableLayout/ScrollableTableLayout';
import { useCollectionDetails } from '../../hooks/useCollectionDetails';
import { useToast } from '../../context/ToastContext';
import collectionsService from '../../api/services/collectionsService';
import { useQueryClient } from '@tanstack/react-query';
import './MyComponents.css';

const CollectionDetails = () => {
  const { id } = useParams();
  const {
    collection,
    items,
    isCollectionLoading,
    isItemsLoading,
    activeTab,
    setActiveTab,
    isOwner,
    canEdit,
    handleUnassignItem,
    handleBulkRemoveItems,
    handleUpdateItem,
    navigate
  } = useCollectionDetails(id);

  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const handleAssignItems = async (selectedIds) => {
    setIsAssigning(true);
    try {
      // Loop execution (API is single item)
      // We could use Promise.all but let's do sequential or parallel limited to avoid rate limits if many
      const promises = selectedIds.map(itemId => 
        collectionsService.addItem(id, { item_id: itemId })
      );
      
      await Promise.all(promises);
      
      showToast(`נוספו ${selectedIds.length} פריטים לאוסף`, 'success');
      setIsAssignDialogOpen(false);
      queryClient.invalidateQueries(['collectionItems', id]);
    } catch (error) {
        console.error(error);
        const msg = error.response?.data?.detail || 'שגיאה בהוספת פריטים';
        // Check for specific duplicate error
        if (msg.includes('already in collection')) {
            showToast('חלק מהפריטים כבר קיימים באוסף זה', 'warning');
        } else {
            showToast(msg, 'error');
        }
    } finally {
      setIsAssigning(false);
    }
  };

  if (isCollectionLoading) {
    return <div className="flex justify-center items-center h-full"><Spinner size="lg" /></div>;
  }

  if (!collection) {
    return <div className="p-8 text-center text-lg text-gray-500">האוסף לא נמצא</div>;
  }

  // Header Content
  const header = (
    <div className="collection-header" dir="rtl">
        <div className="flex items-center justify-center mb-4 relative min-h-[40px]">
             <div className="absolute right-0">
                <Button variant="ghost" size="sm" onClick={() => navigate('/my-components')} className="text-gray-500 hover:text-gray-900">
                    <FaArrowRight /> חזרה
                </Button>
            </div>
            <h1 className="text-xl font-bold text-gray-900">{collection.name}</h1>
        </div>
        
        <div className="access-tabs">
            <button
                className={`tab-btn ${activeTab === 'items' ? 'active' : ''}`}
                onClick={() => setActiveTab('items')}
            >
                <FaBoxOpen />
                פריטים ({items.length})
            </button>
            <button
                className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => setActiveTab('settings')}
            >
                <FaCog />
                הגדרות
            </button>
        </div>
    </div>
  );

  return (
    <ScrollableTableLayout header={header}>
        <div className="p-6 my-components-page bg-gray-50 min-h-full" dir="rtl">
            {activeTab === 'items' && (
                <div className="space-y-4">
                    {isItemsLoading ? (
                        <div className="flex justify-center py-12"><Spinner /></div>
                    ) : (
                        <CollectionItemsTable 
                            items={items} 
                            customFields={collection.custom_fields || []}
                            isReadOnly={!canEdit}
                            collectionId={id}
                            onUnassign={handleUnassignItem}
                            onBulkDelete={handleBulkRemoveItems}
                            onUpdateCustomValue={handleUpdateItem}
                            onAddItem={() => setIsAssignDialogOpen(true)}
                        />
                    )}
                </div>
            )}
            
            {activeTab === 'settings' && (
                <CollectionSettings 
                    collection={collection}
                    isOwner={isOwner}
                    canEdit={canEdit}
                />
            )}
        </div>

        <AssignItemDialog 
            isOpen={isAssignDialogOpen}
            onClose={() => setIsAssignDialogOpen(false)}
            onAssign={handleAssignItems}
            isAssigning={isAssigning}
        />
    </ScrollableTableLayout>
  );
};

export default CollectionDetails;
