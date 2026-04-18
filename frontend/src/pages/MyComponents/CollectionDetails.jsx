import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { FaArrowRight, FaCog, FaPlus, FaBoxOpen } from 'react-icons/fa';
import { Button, Spinner, Tabs } from '../../components/common';
import DeleteModal from '../../components/common/DeleteModal/DeleteModal';
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
    isCollectionError,
    isItemsLoading,
    activeTab,
    setActiveTab,
    isOwner,
    canEdit,
    handleUnassignItem,
    handleBulkRemoveItems,
    handleUpdateItem,
    handleBulkEditItems,
    deleteModal,
    handleDeleteConfirm,
    handleDeleteClose,
    navigate
  } = useCollectionDetails(id);

  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const handleAssignItems = async (selectedIds) => {
    setIsAssigning(true);
    try {
      await collectionsService.bulkAddItem(id, { item_ids: selectedIds });
      showToast(`נוספו ${selectedIds.length} פריטים לאוסף`, 'success');
      setIsAssignDialogOpen(false);
      queryClient.invalidateQueries(['collectionItems', id]);
    } catch (error) {
        console.error(error);
        const msg = error.response?.data?.detail || 'שגיאה בהוספת פריטים';
        queryClient.invalidateQueries(['collectionItems', id]);
        if (typeof msg === 'string' && msg.toLowerCase().includes('already')) {
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

  if (isCollectionError) {
    return (
      <div className="p-8 text-center">
        <p className="text-lg text-gray-500">שגיאה בטעינת האוסף</p>
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>נסה שוב</Button>
      </div>
    );
  }

  if (!collection) {
    return <div className="p-8 text-center text-lg text-gray-500">האוסף לא נמצא</div>;
  }

  return (
    <div className="my-components-page" dir="rtl">
        
        {/* Title and Back Button Row */}
        <div className="collection-details-title-row">
            <Button variant="ghost" size="sm" onClick={() => navigate('/my-components')} className="collection-back-btn">
                <FaArrowRight className="me-2" /> חזרה
            </Button>
            <h3 className="collection-details-name">{collection.name}</h3>
        </div>

        {/* TABS */}
        <Tabs 
            tabs={[
                { id: 'items', label: `פריטים (${items.length})`, icon: <FaBoxOpen /> },
                { id: 'settings', label: 'הגדרות', icon: <FaCog /> }
            ]}
            activeTab={activeTab}
            onTabChange={setActiveTab}
        />

        {/* Main Content Area */}
        <div className="collection-details-body">
            {activeTab === 'items' && (
                <div className="collection-details-items-wrapper">
                    {isItemsLoading ? (
                        <div className="collection-details-loading"><Spinner /></div>
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

        <DeleteModal
            isOpen={deleteModal.isOpen}
            onClose={handleDeleteClose}
            onConfirm={handleDeleteConfirm}
            title="הסרת פריט מהאוסף"
            message={deleteModal.message}
            warningText=""
            type="confirmation"
            confirmText="הסר מהאוסף"
        />
    </div>
  );
};

export default CollectionDetails;
