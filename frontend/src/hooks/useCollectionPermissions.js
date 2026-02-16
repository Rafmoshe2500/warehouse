import { useState } from 'react';

/**
 * Custom hook for managing collection permissions
 * Handles user search, selection, and permission operations
 * 
 * @param {Object} options - Configuration options
 * @param {Function} options.onSuccess - Callback after successful permission update
 * @param {Function} options.onError - Callback on error
 * @returns {Object} - State and handlers for permission management
 */
const useCollectionPermissions = ({ onSuccess, onError } = {}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('RO');
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSearchUser = async (term, searchFunction) => {
    setSearchTerm(term);
    if (term.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchFunction(term);
      setSearchResults(results);
    } catch (error) {
      console.error('User search error:', error);
      if (onError) {
        onError('שגיאה בחיפוש משתמשים');
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setSearchTerm(user.username || user.display_name || '');
    setSearchResults([]);
  };

  const handleAddPermission = async (collectionId, addPermissionFunction) => {
    if (!searchTerm && !selectedUser) return;
    
    // Allow adding by username string directly if user not selected from list (for AD/External)
    const username = selectedUser?.username || searchTerm;

    setIsSubmitting(true);
    try {
      await addPermissionFunction(collectionId, {
        type: 'USER',
        identifier: username,
        role: selectedRole
      });
      
      // Reset form
      setSearchTerm('');
      setSelectedUser(null);
      setSelectedRole('RO');
      setSearchResults([]);
      
      if (onSuccess) {
        onSuccess('ההרשאה נוספה בהצלחה');
      }
    } catch (error) {
      console.error('Add permission error:', error);
      if (onError) {
        onError(error.response?.data?.detail || 'שגיאה בהוספת הרשאה');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemovePermission = async (collectionId, permissionId, removePermissionFunction) => {
    try {
      await removePermissionFunction(collectionId, permissionId);
      
      if (onSuccess) {
        onSuccess('ההרשאה הוסרה בהצלחה');
      }
    } catch (error) {
      console.error('Remove permission error:', error);
      if (onError) {
        onError('שגיאה בהסרת הרשאה');
      }
    }
  };

  const resetForm = () => {
    setSearchTerm('');
    setSelectedUser(null);
    setSelectedRole('RO');
    setSearchResults([]);
  };

  return {
    // State
    searchTerm,
    searchResults,
    selectedUser,
    selectedRole,
    isSearching,
    isSubmitting,
    
    // Setters
    setSearchTerm,
    setSelectedRole,
    
    // Handlers
    handleSearchUser,
    handleSelectUser,
    handleAddPermission,
    handleRemovePermission,
    resetForm
  };
};

export default useCollectionPermissions;
