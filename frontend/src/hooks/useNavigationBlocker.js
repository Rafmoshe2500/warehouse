import { useEffect, useCallback, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Hook to block navigation when there are unsaved changes
 * Works with BrowserRouter (non-data router setup)
 * @param {boolean} shouldBlock - Whether to block navigation
 * @returns {Object} Blocker state and control functions
 */
export const useNavigationBlocker = (shouldBlock) => {
  const [isBlocked, setIsBlocked] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const blockRef = useRef(shouldBlock);

  // Update block ref when shouldBlock changes
  useEffect(() => {
    blockRef.current = shouldBlock;
  }, [shouldBlock]);

  // Intercept navigation clicks
  useEffect(() => {
    if (!shouldBlock) return;

    const handleClick = (e) => {
      // Check if the click is on a link
      const link = e.target.closest('a[href]');
      if (!link) return;

      const href = link.getAttribute('href');
      
      // Only block internal navigation (not external links or same page)
      if (href && href.startsWith('/') && href !== location.pathname) {
        e.preventDefault();
        e.stopPropagation();
        
        // Show modal
        setIsBlocked(true);
        setPendingNavigation(href);
      }
    };

    // Add capture phase listener to intercept before other handlers
    document.addEventListener('click', handleClick, true);

    return () => {
      document.removeEventListener('click', handleClick, true);
    };
  }, [shouldBlock, location.pathname]);

  // Handle browser back/forward and beforeunload
  useEffect(() => {
    if (!shouldBlock) return;

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
      return '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [shouldBlock]);

  const proceed = useCallback(() => {
    if (pendingNavigation) {
      setIsBlocked(false);
      // Navigate to pending location
      const targetPath = pendingNavigation;
      setPendingNavigation(null);
      
      // Use setTimeout to ensure modal closes first
      setTimeout(() => {
        navigate(targetPath);
      }, 0);
    }
  }, [pendingNavigation, navigate]);

  const reset = useCallback(() => {
    setIsBlocked(false);
    setPendingNavigation(null);
  }, []);

  return {
    isBlocked,
    proceed,
    reset,
  };
};

export default useNavigationBlocker;
