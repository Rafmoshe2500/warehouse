import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { FaArrowRight, FaCog, FaPlus, FaBoxOpen } from 'react-icons/fa';
import { Button, Spinner, Tabs } from '../../components/common';
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
    handleBulkEditItems,
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

  return (
    <div className="my-components-page" dir="rtl">
        
        {/* TABS */}
        <Tabs 
            tabs={[
                { id: 'items', label: `פריטים (${items.length})`, icon: <FaBoxOpen /> },
                { id: 'settings', label: 'הגדרות', icon: <FaCog /> }
            ]}
            activeTab={activeTab}
            onTabChange={setActiveTab}
        />
        
        {/* Title and Back Button Row */}
        <div className="flex items-center justify-center relative mb-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/my-components')} className="text-gray-500 hover:text-gray-900 absolute right-0">
                <FaArrowRight className="ml-2" /> חזרה
            </Button>
            <h3 className="text-xl font-bold text-gray-900">{collection.name}</h3>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-0">
            {activeTab === 'items' && (
                <div className="flex-1 flex flex-col min-h-0">
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
                            onBulkEdit={handleBulkEditItems}
                            onAddItem={() => setIsAssignDialogOpen(true)}
                        />
                    )}
                </div>
            )}
            
            {activeTab === 'settings' && (
                <div style={{ paddingTop: '1rem' }}>
                    <CollectionSettings 
                        collection={collection}
                        isOwner={isOwner}
                        canEdit={canEdit}
                    />
                </div>
            )}
        </div>

        <AssignItemDialog 
            isOpen={isAssignDialogOpen}
            onClose={() => setIsAssignDialogOpen(false)}
            onAssign={handleAssignItems}
            isAssigning={isAssigning}
        />
    </div>
  );
};

export default CollectionDetails;
