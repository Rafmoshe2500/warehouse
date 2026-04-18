import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaUsers, FaArrowLeft, FaLayerGroup } from 'react-icons/fa';
import { Button } from '../common';
import '../../pages/MyComponents/MyComponents.css';

const CollectionCard = ({ collection }) => {
  const navigate = useNavigate();
  const isOwner = collection.role?.toUpperCase() === 'OWNER';
  
  // Format permissions for display
  // Calculate counts from permissions array
  const permissions = collection.permissions || [];
  const usersCount = permissions.filter(p => p.type?.toLowerCase() === 'user').length;
  const groupsCount = permissions.filter(p => p.type?.toLowerCase() === 'group').length;
  
  // Apply stripe color based on role
  const stripeClass = isOwner ? 'owner' : 'shared';

  return (
    <div
      className="collection-card"
      dir="rtl"
      style={{ cursor: 'pointer' }}
      onClick={() => navigate(`/my-components/${collection.id || collection._id}`)}
    >      {/* Header Bar - Color Coded */}
      <div className={`card-header-stripe ${stripeClass}`} />
      
      {/* Icon watermark background */}
      <div className="card-icon-bg"><FaLayerGroup /></div>

      <div className="card-content">
        <div className="card-title-row">
          <h3 className="card-title" title={collection.name}>
            {collection.name}
          </h3>
          <span className={`role-badge ${stripeClass}`}>
            {isOwner ? 'בעלים' : collection.role || 'משותף'}
          </span>
        </div>
        
        <p className="card-description">
          {collection.description || 'אין תיאור.'}
        </p>
        
        <div className="card-stats">
          <div className="stat-item" title="קבוצות משוייכות">
            <FaUsers />
            <span>{groupsCount} קבוצות</span>
          </div>
          {isOwner && (
             <div className="stat-item" title="הרשאות ישירות">
               <FaUser />
               <span>{usersCount} משתמשים</span>
             </div>
          )}
        </div>
      </div>
      
      <div className="card-footer">
        <span className="updated-text">
            עודכן {collection.updated_at ? new Date(collection.updated_at).toLocaleDateString() : '-'}
        </span>
        <Button 
            variant="ghost" 
            size="sm" 
            onClick={(e) => { e.stopPropagation(); navigate(`/my-components/${collection.id || collection._id}`); }}
        >
            צפה <FaArrowLeft />
        </Button>
      </div>
    </div>
  );
};

CollectionCard.propTypes = {
  collection: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    role: PropTypes.string,
    permissions: PropTypes.array,
    group_ids: PropTypes.array,
    updated_at: PropTypes.string
  }).isRequired
};

export default CollectionCard;
