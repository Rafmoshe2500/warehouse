import { useState, useRef } from 'react';
import excelService from '../api/services/excelService';

/**
 * Hook for managing Excel import/export logic
 * @param {Function} loadItems - Function to reload items after import
 * @param {Function} addToast - Function to show toast messages
 * @returns {Object} Excel state and handlers
 */
export const useInventoryExcel = (loadItems, addToast) => {
    const [uploadingExcel, setUploadingExcel] = useState(false);
    const [importType, setImportType] = useState('standard'); // 'standard' | 'project'
    const uploadStartTimeRef = useRef(null);
    
    // Using existing hook logic inside this custom hook or just plain state
    // Ideally this replaces useExcelManager if it was too specific or simple
    
    const handleImportExcel = async (file) => {
        if (!file) return;

        setUploadingExcel(true);
        uploadStartTimeRef.current = Date.now();
        
        try {
            let result;
            if (importType === 'project') {
                result = await excelService.importProjectExcel(file);
                addToast(result.message, 'success');
            } else {
                result = await excelService.importExcel(file);
                
                // Build message
                let message = `יבוא הושלם! נוצרו: ${result.added}, עודכנו: ${result.updated}`;
                if (result.skipped > 0) message += `, דולגו: ${result.skipped}`;
                
                // If there are errors, show warning with combined message
                if (result.errors && result.errors.length > 0) {
                    message += `. שימו לב: היו שגיאות ב-${result.errors.length} שורות`;
                    addToast(message, 'warning');
                } else {
                    // No errors - show success
                    addToast(message, 'success');
                }
            }

            if (loadItems) await loadItems();
            
            // Ensure minimum animation display time (1500ms)
            const elapsedTime = Date.now() - uploadStartTimeRef.current;
            const remainingTime = Math.max(0, 1500 - elapsedTime);
            
            if (remainingTime > 0) {
                await new Promise(resolve => setTimeout(resolve, remainingTime));
            }
        } catch (err) {
            addToast(err.response?.data?.detail || 'שגיאה ביבוא מאקסל', 'error');
        } finally {
            setUploadingExcel(false);
            setImportType('standard'); // Reset to default
        }
    };

    return {
        uploadingExcel,
        setUploadingExcel,
        importType,
        setImportType,
        handleImportExcel
    };
};
