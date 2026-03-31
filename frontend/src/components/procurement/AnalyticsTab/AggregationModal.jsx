import React, { useState, useEffect, useRef } from 'react';
import { FiX, FiPlus, FiLayers, FiSearch } from 'react-icons/fi';
import bomAnalyticsService from '../../../api/services/bomAnalyticsService';
import { Spinner } from '../../common';
import './AggregationModal.css';

/**
 * Modal for building an aggregation group.
 *
 * The user selects:
 *  - ONE main part  → names the group, defines the denominator (main_qty)
 *  - N secondary parts → added to the numerator
 *
 * On confirm:
 *  - onAddGroup(label, mainPart, secondaryParts) is called
 *  - The parent also adds mainPart as an individual line via addPart()
 */
const PartSearch = ({ placeholder, onSelect, excludeParts = [], label }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSugg, setShowSugg] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (query.trim().length < 2) { setSuggestions([]); setShowSugg(false); return; }
    const t = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await bomAnalyticsService.searchParts(query, null); // search all types
        setSuggestions((res.parts || []).filter(p => !excludeParts.includes(p)));
        setShowSugg(true);
      } catch { /* ignore */ } finally { setIsLoading(false); }
    }, 200);
    return () => clearTimeout(t);
  }, [query, excludeParts]);

  useEffect(() => {
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setShowSugg(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const pick = (part) => {
    onSelect(part);
    setQuery('');
    setShowSugg(false);
  };

  return (
    <div className="agg-modal-search-wrap" ref={wrapRef}>
      {label && <label className="agg-modal-field-label">{label}</label>}
      <div className="agg-modal-search-row">
        <FiSearch size={14} className="agg-modal-search-icon" />
        <input
          type="text"
          className="agg-modal-search-input"
          placeholder={placeholder}
          value={query}
          onChange={e => { setQuery(e.target.value); setShowSugg(true); }}
          onFocus={() => { if (suggestions.length > 0) setShowSugg(true); }}
        />
        {isLoading && <Spinner size="sm" />}
      </div>
      {showSugg && query.length >= 2 && (
        <div className="agg-modal-dropdown">
          {suggestions.length > 0
            ? suggestions.map(p => (
                <div key={p} className="agg-modal-dropdown-item" onClick={() => pick(p)}>{p}</div>
              ))
            : <div className="agg-modal-dropdown-empty">לא נמצאו תוצאות</div>
          }
        </div>
      )}
    </div>
  );
};

const AggregationModal = ({ isOpen, onClose, onAddGroup, isAdding }) => {
  const [mainPart, setMainPart]         = useState(null);
  const [secondaryParts, setSecondaryParts] = useState([]);
  const [groupLabel, setGroupLabel]     = useState('');

  // Auto-fill label when main part selected
  useEffect(() => {
    if (mainPart && !groupLabel) setGroupLabel(mainPart);
  }, [mainPart]);

  const removeSecondary = (pn) => setSecondaryParts(prev => prev.filter(p => p !== pn));
  const clearAll = () => { setMainPart(null); setSecondaryParts([]); setGroupLabel(''); };

  const handleClose = () => { clearAll(); onClose(); };

  const handleSubmit = async () => {
    if (!mainPart || secondaryParts.length === 0 || !groupLabel.trim()) return;
    await onAddGroup(groupLabel.trim(), mainPart, secondaryParts);
    clearAll();
    onClose();
  };

  const allSelected = [mainPart, ...secondaryParts].filter(Boolean);
  const canSubmit = mainPart && secondaryParts.length > 0 && groupLabel.trim() && !isAdding;

  if (!isOpen) return null;

  return (
    <div className="agg-modal-overlay" onClick={e => { if (e.target === e.currentTarget) handleClose(); }}>
      <div className="agg-modal" dir="rtl">

        {/* Header */}
        <div className="agg-modal-header">
          <FiLayers size={17} />
          <h3 className="agg-modal-title">הגדר Aggregation</h3>
          <button className="agg-modal-close" onClick={handleClose}><FiX size={16} /></button>
        </div>

        <div className="agg-modal-body">

          {/* Main part */}
          <div className="agg-modal-section">
            <div className="agg-modal-section-title">
              <span className="agg-type-badge main">M</span>
              רכיב ראשי — שם הקבוצה ומכנה המחיר
            </div>
            {mainPart ? (
              <div className="agg-modal-chip main-chip">
                <span>{mainPart}</span>
                <button onClick={() => { setMainPart(null); setGroupLabel(''); }}><FiX size={11} /></button>
              </div>
            ) : (
              <PartSearch
                placeholder='חפש מק"ט ראשי (לדוגמא: AFF-A90)...'
                onSelect={p => setMainPart(p)}
                excludeParts={allSelected}
              />
            )}
          </div>

          {/* Secondary parts */}
          <div className="agg-modal-section">
            <div className="agg-modal-section-title">
              <span className="agg-type-badge comp">C</span>
              רכיבים משניים — מתווספים למחיר
            </div>
            <div className="agg-modal-chips">
              {secondaryParts.map(pn => (
                <div key={pn} className="agg-modal-chip">
                  <span>{pn}</span>
                  <button onClick={() => removeSecondary(pn)}><FiX size={11} /></button>
                </div>
              ))}
            </div>
            <PartSearch
              placeholder='הוסף רכיב משני (לדוגמא: AFF-A30)...'
              onSelect={p => setSecondaryParts(prev => prev.includes(p) ? prev : [...prev, p])}
              excludeParts={allSelected}
            />
          </div>

          {/* Group label */}
          {mainPart && secondaryParts.length > 0 && (
            <div className="agg-modal-section">
              <div className="agg-modal-section-title">שם הקבוצה</div>
              <input
                type="text"
                className="agg-modal-label-input"
                value={groupLabel}
                onChange={e => setGroupLabel(e.target.value)}
                placeholder="שם לקבוצה..."
              />
            </div>
          )}

          {/* Info note */}
          {mainPart && secondaryParts.length > 0 && (
            <div className="agg-modal-note">
              <strong>נוסחת מחיר:</strong>{' '}
              (סה"כ <em>{mainPart}</em> + סה"כ רכיבים משניים) ÷ כמות <em>{mainPart}</em>
              <br />
              <span className="agg-modal-note-sub">
                מוצגות רק הזמנות שבהן קיים גם הראש וגם לפחות רכיב משני אחד.
                הקו הבודד של {mainPart} ממשיך להיות מוצג לכל ההזמנות.
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="agg-modal-footer">
          <button className="agg-modal-cancel-btn" onClick={handleClose}>ביטול</button>
          <button
            className="agg-modal-submit-btn"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            {isAdding ? <Spinner size="sm" /> : <FiPlus size={14} />}
            הוסף לגרף
          </button>
        </div>
      </div>
    </div>
  );
};

export default AggregationModal;
