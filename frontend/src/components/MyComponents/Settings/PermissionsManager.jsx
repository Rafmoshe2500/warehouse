import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { FaUser, FaUsers, FaTrash, FaPlus, FaShieldAlt } from 'react-icons/fa';
import { Button, Input, Select, Spinner } from '../../common';
import { useToast } from '../../../context/ToastContext';
import collectionsService from '../../../api/services/collectionsService';
import userService from '../../../api/services/userService';
import groupService from '../../../api/services/groupService';
import { useQueryClient } from '@tanstack/react-query';
import { useDebounce } from '../../../hooks/useDebounce';
import './PermissionsManager.css';

const PermissionsManager = ({ collection, isOwner }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedEntity, setSelectedEntity] = useState(null); // User or Group object
  const [permissionType, setPermissionType] = useState('user'); // 'user' or 'group'
  const [selectedRole, setSelectedRole] = useState('RO');
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Effect for handling search when debounced term changes
  React.useEffect(() => {
    const search = async () => {
      if (debouncedSearchTerm.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        if (permissionType === 'user') {
          const results = await userService.searchUsers(debouncedSearchTerm);
          setSearchResults(results);
        } else {
          // Use server-side search
          const groups = await groupService.searchGroups(debouncedSearchTerm);
          // Map to common structure
          setSearchResults(groups.map(g => ({
              id: g.id,
              username: g.name, // Use name as username for display consistency
              type: 'group'
          })));
        }
      } catch (error) {
        console.error(error);
        showToast(`שגיאה בחיפוש ${permissionType === 'user' ? 'משתמשים' : 'קבוצות'}`, 'error');
      } finally {
        setIsSearching(false);
      }
    };

    search();
  }, [debouncedSearchTerm, permissionType]);

  // Effect for handling search when debounced term changes
  React.useEffect(() => {
    const search = async () => {
      if (debouncedSearchTerm.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        if (permissionType === 'user') {
          const results = await userService.searchUsers(debouncedSearchTerm);
          setSearchResults(results);
        } else {
          // Use server-side search
          const groups = await groupService.searchGroups(debouncedSearchTerm);
          // Map to common structure
          setSearchResults(groups.map(g => ({
              id: g.id,
              username: g.name, // Use name as username for display consistency
              type: 'group'
          })));
        }
      } catch (error) {
        console.error(error);
        showToast(`שגיאה בחיפוש ${permissionType === 'user' ? 'משתמשים' : 'קבוצות'}`, 'error');
      } finally {
        setIsSearching(false);
      }
    };

    search();
  }, [debouncedSearchTerm, permissionType]);

  const handleSearch = (term) => {
    setSearchTerm(term);
    // Clear results immediately if term is too short
    if (term.length < 2) {
        setSearchResults([]);
    }
  };

  const handleAddPermission = async () => {
    if (!searchTerm && !selectedEntity) return;
    
    // Allow adding by name/username string directly if entity not selected from list (for AD/External)
    const entityId = selectedEntity?.username || searchTerm; // For groups username mapped to name above

    setIsSubmitting(true);
    try {
      await collectionsService.updatePermissions(collection.id, {
        type: permissionType, // 'user' or 'group'
        id: entityId,
        level: selectedRole.toLowerCase() // 'ro' or 'rw'
      });
      
      showToast('הרשאה נוספה בהצלחה', 'success');
      setSearchTerm('');
      setSelectedEntity(null);
      queryClient.invalidateQueries(['collection', collection.id]);
    } catch (error) {
      console.error('Add permission error:', error);
      let msg = 'שגיאה בהוספת הרשאה';
      if (error.response?.data?.detail) {
          msg = typeof error.response.data.detail === 'string' 
              ? error.response.data.detail 
              : JSON.stringify(error.response.data.detail);
      }
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemovePermission = async (userId) => {
    if (!window.confirm('האם אתה בטוח שברצונך להסיר הרשאה זו?')) return;

    try {
       // Using removePermission method (will be added to service)
       await collectionsService.removePermission(collection.id, userId);

      showToast('הרשאה הוסרה בהצלחה', 'success');
      queryClient.invalidateQueries(['collection', collection.id]);
    } catch (error) {
       console.error('Remove permission error:', error);
       showToast('שגיאה בהסרת הרשאה', 'error');
    }
  };

  return (
    <div className="permissions-manager" dir="rtl">
      <div className="permissions-header">
        <h3>ניהול הרשאות</h3>
        <p>נהל מי יכול לצפות או לערוך את האוסף הזה.</p>
      </div>

      <div className="permissions-content">
        {isOwner && (
          <div className="add-permission-form">
          <div className="permission-type-toggle mb-4 flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                      type="radio" 
                      name="permType" 
                      checked={permissionType === 'user'}
                      onChange={() => {
                          setPermissionType('user');
                          setSearchTerm('');
                          setSearchResults([]);
                          setSelectedEntity(null);
                      }}
                  />
                  <span>משתמש</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                      type="radio" 
                      name="permType" 
                      checked={permissionType === 'group'} 
                      onChange={() => {
                          setPermissionType('group');
                          setSearchTerm('');
                          setSearchResults([]);
                          setSelectedEntity(null);
                      }}
                  />
                  <span>קבוצה</span>
              </label>
          </div>

          <div className="user-search-container relative">
            <Input
              label={permissionType === 'user' ? "הוסף משתמש" : "הוסף קבוצה"}
              placeholder={permissionType === 'user' ? "חפש משתמש..." : "חפש קבוצה..."}
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              disabled={isSubmitting}
            />


      {/* Search Results Dropdown */}
      {isSearching && searchTerm.length >= 2 && (
          <div className="search-results-dropdown">
              <div className="search-loading">מחפש {permissionType === 'user' ? 'משתמשים' : 'קבוצות'}...</div>
          </div>
      )}
      
      {!isSearching && searchResults.length > 0 && (
          <div className="search-results-dropdown">
              {searchResults.map(result => (
                  <div 
                      key={result.id} 
                      className="search-result-item"
                      onClick={() => {
                          setSelectedEntity(result);
                          setSearchTerm(result.username);
                          setSearchResults([]);
                      }}
                  >
                      <div className="font-medium flex items-center gap-2">
                          {result.type === 'group' ? <FaUsers /> : <FaUser />}
                          {result.username}
                      </div>
                      {result.email && <div className="text-xs text-gray-500">{result.email}</div>}
                  </div>
              ))}
          </div>
      )}
    </div>
    
    <div className="role-select-container">
      <Select
        label="רמת הרשאה"
        value={selectedRole}
        onChange={(e) => setSelectedRole(e.target.value)}
        options={[
          { value: 'RO', label: 'קריאה בלבד' },
          { value: 'RW', label: 'עריכה' }
        ]}
        disabled={isSubmitting}
      />
    </div>
    
    <Button
      variant="primary"
      onClick={handleAddPermission}
      disabled={!searchTerm || isSubmitting}
      loading={isSubmitting}
      icon={<FaPlus />}
    >
      הוסף
    </Button>
  </div>
)}
      
      <div className="permissions-list">
         {/* Owner Display */}
         <div className="permission-item">
            <div className="permission-user-info">
                <div className="permission-avatar" style={{ backgroundColor: 'var(--accent-primary)' }}>
                    <FaShieldAlt />
                </div>
                <div className="permission-details">
                    <span className="permission-name">{collection.owner_id}</span>
                    <span className="permission-role">בעלים</span>
                </div>
            </div>
         </div>

         {/* Permissions List */}
         {collection.permissions?.map((perm, index) => (
             <div key={`${perm.id}-${index}`} className="permission-item">
                 <div className="permission-user-info">
                     <div className="permission-avatar" title={perm.type === 'group' ? 'קבוצה' : 'משתמש'}>
                         {perm.type === 'group' ? <FaUsers /> : perm.id.charAt(0).toUpperCase()}
                     </div>
                     <div className="permission-details">
                         <span className="permission-name flex items-center gap-2">
                             {perm.id}
                             {perm.type === 'group' && <span className="text-xs bg-gray-200 px-1 rounded">קבוצה</span>}
                         </span>
                         <span className="permission-role">
                             {perm.level?.toLowerCase() === 'rw' ? 'עריכה' : 'קריאה בלבד'}
                         </span>
                     </div>
                 </div>
                 {isOwner && (
                     <div className="permission-actions">
                         <Button 
                             variant="ghost" 
                             size="sm"
                             onClick={() => handleRemovePermission(perm.id)}
                             icon={<FaTrash />}
                             className="delete-permission-btn"
                             title="הסר הרשאה"
                         >
                             הסר
                         </Button>
                     </div>
                 )}
             </div>
         ))}
         
         {(!collection.permissions || collection.permissions.length === 0) && (
             <div className="text-center text-gray-500 py-4">
                 אין הרשאות נוספות מוגדרות
             </div>
         )}
      </div>
      </div>
    </div>
  );
};

PermissionsManager.propTypes = {
  collection: PropTypes.object.isRequired,
  isOwner: PropTypes.bool
};

export default PermissionsManager;
