import { useState, useRef } from 'react';

/**
 * Hook for managing Excel import/export operations
 * Handles UI state for Excel operations
 */
export const useExcelManager = () => {
  const [uploadingExcel, setUploadingExcel] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const fileInputRef = useRef(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return {
    uploadingExcel,
    setUploadingExcel,
    showExportModal,
    setShowExportModal,
    exportProgress,
    setExportProgress,
    fileInputRef,
    handleUploadClick,
  };
};
