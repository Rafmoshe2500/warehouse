import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiPackage, FiShoppingCart, FiFolder, FiArrowLeft } from 'react-icons/fi';
import { useDebounce } from '../../../hooks/useDebounce';
import apiClient from '../../../api/client';
import { API_ENDPOINTS } from '../../../api/endpoints';
import './GlobalSearch.css';

const GlobalSearch = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setResults([]);
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      try {
        const { data } = await apiClient.get(API_ENDPOINTS.GLOBAL_SEARCH, {
          params: { q: debouncedQuery, limit: 5 }
        });

        const mapped = [];

        (data.items || []).forEach(item => mapped.push({
          id: item._id,
          type: 'item',
          icon: FiPackage,
          title: item.catalog_number || 'ללא מק"ט',
          subtitle: item.description || '',
          meta: item.manufacturer || '',
          navigateTo: `/inventory`,
          search: item.catalog_number || debouncedQuery,
          openId: item._id,
        }));

        (data.orders || []).forEach(order => mapped.push({
          id: order._id,
          type: 'order',
          icon: FiShoppingCart,
          title: order.emf_number || 'הזמנה',
          subtitle: order.bom_vendor || '',
          meta: order.status || '',
          navigateTo: `/procurement`,
          search: order.emf_number || debouncedQuery,
          openId: order._id,
        }));

        (data.collections || []).forEach(col => mapped.push({
          id: col._id,
          type: 'collection',
          icon: FiFolder,
          title: col.name || 'קולקציה',
          subtitle: col.description || '',
          meta: '',
          navigateTo: `/my-items`
        }));

        setResults(mapped);
        setSelectedIndex(0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [debouncedQuery]);

  const handleNavigate = useCallback((result) => {
    onClose();
    const searchParam = result.search ? `?search=${encodeURIComponent(result.search)}` : '';
    navigate(
      { pathname: result.navigateTo, search: searchParam },
      { state: result.openId ? { openItemId: result.openId, type: result.type } : undefined }
    );
  }, [navigate, onClose]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      handleNavigate(results[selectedIndex]);
    }
  }, [results, selectedIndex, handleNavigate, onClose]);

  if (!isOpen) return null;

  return (
    <div className="global-search-overlay" onClick={onClose}>
      <div
        className="global-search"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="חיפוש גלובלי"
      >
        <div className="global-search__input-row">
          <FiSearch size={18} className="global-search__icon" />
          <input
            ref={inputRef}
            type="text"
            className="global-search__input"
            placeholder="חיפוש פריטים, הזמנות, קולקציות..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <kbd className="global-search__kbd">Esc</kbd>
        </div>

        {(results.length > 0 || loading || debouncedQuery.length >= 2) && (
          <div className="global-search__results">
            {loading && (
              <div className="global-search__loading">מחפש...</div>
            )}

            {!loading && results.map((result, index) => {
              const Icon = result.icon;
              return (
                <button
                  key={result.id}
                  className={`global-search__result ${index === selectedIndex ? 'global-search__result--selected' : ''}`}
                  onClick={() => handleNavigate(result)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <Icon size={16} className="global-search__result-icon" />
                  <div className="global-search__result-content">
                    <span className="global-search__result-title">{result.title}</span>
                    <span className="global-search__result-subtitle">{result.subtitle}</span>
                  </div>
                  {result.meta && (
                    <span className="global-search__result-meta">{result.meta}</span>
                  )}
                  <FiArrowLeft size={14} className="global-search__result-arrow" />
                </button>
              );
            })}

            {!loading && results.length === 0 && debouncedQuery.length >= 2 && (
              <div className="global-search__empty">לא נמצאו תוצאות</div>
            )}
          </div>
        )}

        <div className="global-search__footer">
          <span><kbd>↑↓</kbd> ניווט</span>
          <span><kbd>Enter</kbd> בחירה</span>
          <span><kbd>Esc</kbd> סגירה</span>
        </div>
      </div>
    </div>
  );
};

export default GlobalSearch;
