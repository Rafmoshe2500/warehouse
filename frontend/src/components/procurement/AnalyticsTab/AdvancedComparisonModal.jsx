import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FiX, FiPlus, FiSettings, FiSearch, FiTrash2, FiArrowDownRight } from 'react-icons/fi';
import bomAnalyticsService from '../../../api/services/bomAnalyticsService';
import { Spinner } from '../../common';
import './AggregationModal.css';

// ── Shared autocomplete search ────────────────────────────────────────────────
const PartSearch = ({ placeholder, onSelect, excludeParts = [], autoFocus = false, itemType = null }) => {
  const [query,       setQuery]       = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading,   setIsLoading]   = useState(false);
  const [showSugg,    setShowSugg]    = useState(false);
  const wrapRef  = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) inputRef.current.focus();
  }, [autoFocus]);

  useEffect(() => {
    if (query.trim().length < 2) { setSuggestions([]); setShowSugg(false); return; }
    const t = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await bomAnalyticsService.searchParts(query, itemType);
        // res.parts is now [{part_number, product_name, vendor}]
        const parts = (res.parts || []).filter(p => {
          const pn = typeof p === 'string' ? p : p.part_number;
          return !excludeParts.includes(pn);
        });
        setSuggestions(parts);
        setShowSugg(true);
      } catch { /* ignore */ } finally { setIsLoading(false); }
    }, 200);
    return () => clearTimeout(t);
  }, [query, excludeParts]);

  useEffect(() => {
    const h = e => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setShowSugg(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const pick = s => {
    const pn = typeof s === 'string' ? s : s.part_number;
    onSelect(pn, s);
    setQuery('');
    setShowSugg(false);
  };

  return (
    <div className="agg-modal-search-wrap" ref={wrapRef}>
      <div className="agg-modal-search-row">
        <FiSearch size={14} className="agg-modal-search-icon" />
        <input
          ref={inputRef}
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
            ? suggestions.map(s => {
                const pn   = typeof s === 'string' ? s : s.part_number;
                const name = typeof s === 'string' ? '' : (s.product_name || '');
                return (
                  <div key={pn} className="agg-modal-dropdown-item" onClick={() => pick(s)}>
                    <span style={{ fontWeight: 600 }}>{name || pn}</span>
                    {name && <span style={{ color: 'var(--text-muted)', fontSize: '0.73rem', marginLeft: 5 }}>{pn}</span>}
                  </div>
                );
              })
            : <div className="agg-modal-dropdown-empty">לא נמצאו תוצאות</div>
          }
        </div>
      )}
    </div>
  );
};

// ── Slot card ─────────────────────────────────────────────────────────────────
let _slotId = 1;

const SlotCard = ({ slot, index, onUpdate, onRemove, isOnly }) => {
  const allInSlot = [slot.mainPart, ...slot.secondaryParts].filter(Boolean);

  const clearMain = () => onUpdate(slot.id, { mainPart: null, mainPartName: null });
  const addSecondary = part =>
    onUpdate(slot.id, { secondaryParts: slot.secondaryParts.includes(part) ? slot.secondaryParts : [...slot.secondaryParts, part] });
  const removeSecondary = part =>
    onUpdate(slot.id, { secondaryParts: slot.secondaryParts.filter(p => p !== part) });

  return (
    <div className="acm-slot-card">
      <div className="acm-slot-header">
        <span className="acm-slot-era">דור {index + 1}</span>
        {index > 0 && <span className="acm-slot-arrow"><FiArrowDownRight size={12} /> ממשיך מדור {index}</span>}
        {!isOnly && (
          <button className="acm-slot-remove" onClick={() => onRemove(slot.id)} title="הסר דור">
            <FiTrash2 size={13} />
          </button>
        )}
      </div>

      {/* Main part */}
      <div className="acm-slot-field">
        <label className="agg-modal-field-label">מוצר ראשי</label>
        {slot.mainPart ? (
          <div className="agg-modal-chip main-chip acm-main-chip">
            <span title={slot.mainPart}>{slot.mainPartName || slot.mainPart}</span>
            <button onClick={clearMain}><FiX size={11} /></button>
          </div>
        ) : (
          <PartSearch
            placeholder='חפש שם מוצר או מק"ט ראשי...'
            onSelect={(pn, s) => onUpdate(slot.id, { mainPart: pn, mainPartName: (typeof s === 'object' ? s.product_name : null) || pn })}
            excludeParts={allInSlot}
            autoFocus={index > 0}
            itemType="main"
          />
        )}
      </div>

      {/* Secondary parts */}
      <div className="acm-slot-field">
        <label className="agg-modal-field-label">רכיבים משניים <span className="acm-optional">(אופציונלי)</span></label>
        {slot.secondaryParts.length > 0 && (
          <div className="agg-modal-chips" style={{ marginBottom: '0.4rem' }}>
            {slot.secondaryParts.map(pn => (
              <div key={pn} className="agg-modal-chip">
                <span>{pn}</span>
                <button onClick={() => removeSecondary(pn)}><FiX size={11} /></button>
              </div>
            ))}
          </div>
        )}
        <PartSearch
          placeholder="הוסף רכיב משני..."
          onSelect={addSecondary}
          excludeParts={allInSlot}
        />
      </div>
    </div>
  );
};

// ── Main modal ────────────────────────────────────────────────────────────────
const AdvancedComparisonModal = ({ isOpen, onClose, onAddChain, isAdding }) => {
  const [chainLabel, setChainLabel] = useState('');
  const [slots, setSlots] = useState([{ id: _slotId++, mainPart: null, secondaryParts: [] }]);

  const reset = () => {
    setChainLabel('');
    setSlots([{ id: _slotId++, mainPart: null, secondaryParts: [] }]);
  };

  const handleClose = () => { reset(); onClose(); };

  // Auto-fill chain label from first main part
  useEffect(() => {
    const firstMain = slots[0]?.mainPart;
    if (firstMain && !chainLabel) setChainLabel(firstMain);
  }, [slots[0]?.mainPart]);

  const addSlot = () =>
    setSlots(prev => [...prev, { id: _slotId++, mainPart: null, secondaryParts: [] }]);

  const removeSlot = useCallback(id =>
    setSlots(prev => prev.filter(s => s.id !== id)), []);

  const updateSlot = useCallback((id, patch) =>
    setSlots(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s)), []);

  const handleSubmit = async () => {
    if (!chainLabel.trim()) return;
    await onAddChain(chainLabel.trim(), slots);
    reset();
    onClose();
  };

  const hasAtLeastOneMain = slots.some(s => s.mainPart);
  const canSubmit = hasAtLeastOneMain && chainLabel.trim() && !isAdding;

  const totalSlots = slots.filter(s => s.mainPart).length;
  const totalComponents = slots.reduce((acc, s) => acc + s.secondaryParts.length, 0);

  if (!isOpen) return null;

  return (
    <div className="agg-modal-overlay" onClick={e => { if (e.target === e.currentTarget) handleClose(); }}>
      <div className="agg-modal acm-modal" dir="rtl">

        {/* Header */}
        <div className="agg-modal-header">
          <FiSettings size={17} />
          <h3 className="agg-modal-title">השוואה מתקדמת — שרשרת מוצר</h3>
          <button className="agg-modal-close" onClick={handleClose}><FiX size={16} /></button>
        </div>

        <div className="agg-modal-body">

          {/* Chain label */}
          <div className="acm-label-row">
            <label className="agg-modal-field-label">שם הקו בגרף</label>
            <input
              type="text"
              className="agg-modal-label-input"
              value={chainLabel}
              onChange={e => setChainLabel(e.target.value)}
              placeholder="לדוגמא: AFF-A Series..."
            />
          </div>

          {/* Concept note */}
          <div className="acm-concept-note">
            <span className="acm-concept-icon">↗</span>
            <span>
              כל <strong>דור</strong> = מק"ט ראשי + רכיבים משניים אופציונליים.
              כל הדורות ממוזגים לקו אחד רציף על הגרף לפי סדר כרונולוגי.
            </span>
          </div>

          {/* Slot cards */}
          <div className="acm-slots">
            {slots.map((slot, idx) => (
              <SlotCard
                key={slot.id}
                slot={slot}
                index={idx}
                onUpdate={updateSlot}
                onRemove={removeSlot}
                isOnly={slots.length === 1}
              />
            ))}
          </div>

          {/* Add slot */}
          <button className="acm-add-slot-btn" onClick={addSlot}>
            <FiPlus size={13} /> הוסף דור
          </button>

          {/* Summary */}
          {hasAtLeastOneMain && (
            <div className="acm-summary">
              {totalSlots} דורות · {totalComponents} רכיבים משניים
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

export default AdvancedComparisonModal;
