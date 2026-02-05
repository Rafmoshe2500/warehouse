import { useState } from 'react';

export const useInlineAddItem = (createItem, onSuccess, onError) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newRowData, setNewRowData] = useState({});

  const startAdd = () => {
    if (isAdding) {
      setIsAdding(false);
      setNewRowData({});
    } else {
      setNewRowData({});
      setIsAdding(true);
    }
  };

  const cancelAdd = () => {
    setIsAdding(false);
    setNewRowData({});
  };

  const handleNewRowChange = (field, value) => {
    setNewRowData(prev => ({ ...prev, [field]: value }));
  };

  const saveNewItem = async () => {
    // Basic Validation
    if (!newRowData.catalog_number || !newRowData.description) {
      if (onError) onError('חובה למלא מק"ט ותיאור');
      return;
    }

    try {
      await createItem(newRowData);
      if (onSuccess) onSuccess();
      setIsAdding(false);
      setNewRowData({});
    } catch (err) {
      const message = err.response?.data?.detail || 'שגיאה ביצירת פריט';
      if (onError) onError(message);
    }
  };

  return {
    isAdding,
    newRowData,
    startAdd,
    cancelAdd,
    handleNewRowChange,
    saveNewItem
  };
};
