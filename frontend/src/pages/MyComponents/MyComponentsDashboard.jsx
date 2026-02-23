import React from 'react';
import { FaPlus, FaSearch, FaLayerGroup } from 'react-icons/fa';
import CollectionCard from '../../components/MyComponents/CollectionCard';
import CreateCollectionDialog from '../../components/MyComponents/CreateCollectionDialog';
import { Button, Input, Spinner, SkeletonCards } from '../../components/common';
import { useMyComponents } from '../../hooks/useMyComponents';
import './MyComponents.css';

const MyComponentsDashboard = () => {
  const {
    filteredCollections,
    isLoading,
    isError,
    refetch,
    searchQuery,
    setSearchQuery,
    isCreateOpen,
    setIsCreateOpen,
    showHeaderCreateButton
  } = useMyComponents();

  if (isLoading) {
    return (
      <div className="my-components-page" dir="rtl">
        <div className="page-header">
          <div>
            <h1 className="page-title">
              <FaLayerGroup className="page-title-icon" />
              המלאי שלי
            </h1>
          </div>
        </div>
        <SkeletonCards count={6} variant="collection" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="empty-state">
        <p className="empty-state__title">שגיאה בטעינת האוספים.</p>
        <Button 
            variant="outline" 
            className="mt-4"
            onClick={refetch}
        >
            נסה שוב
        </Button>
      </div>
    );
  }

  return (
    <div className="my-components-page" dir="rtl">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <FaLayerGroup className="page-title-icon" />
            המלאי שלי
          </h1>
          <p className="page-subtitle">
            ניהול אוספי רכיבים ומעקב אחריהם.
          </p>
        </div>
        {showHeaderCreateButton && (
          <Button 
              variant="primary" 
              onClick={() => setIsCreateOpen(true)}
              icon={<FaPlus />}
          >
              אוסף חדש
          </Button>
        )}
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-container">
            <Input 
                placeholder="חפש באוספים..." 
                icon={<FaSearch className="search-input-icon" />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
        </div>
      </div>

      {/* Grid */}
      {filteredCollections.length > 0 ? (
        <div className="collections-grid">
          {filteredCollections.map(collection => (
            <CollectionCard key={collection.id} collection={collection} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
            <div className="empty-state__icon">
                <FaLayerGroup size={32} />
            </div>
            <h3 className="empty-state__title">לא נמצאו אוספים</h3>
            <p className="empty-state__description">
                {searchQuery 
                    ? `לא נמצאו תוצאות עבור "${searchQuery}"` 
                    : "צור את האוסף הראשון שלך כדי להתחיל לעקוב אחר רכיבים."}
            </p>
            {!searchQuery && (
                <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
                    צור אוסף
                </Button>
            )}
        </div>
      )}

      {/* Dialogs */}
      <CreateCollectionDialog 
        isOpen={isCreateOpen} 
        onClose={() => setIsCreateOpen(false)} 
      />
    </div>
  );
};

export default MyComponentsDashboard;
