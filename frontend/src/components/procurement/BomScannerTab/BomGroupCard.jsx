import React, { useState, useCallback, useRef } from 'react';
import { CATEGORY_CONFIG, CategoryIcon } from './CategoryIcons';
import { FiEdit2, FiCheck, FiX } from 'react-icons/fi';
import './BomGroupCard.css';

const formatPrice = (val) => {
  if (!val || val === 0) return null;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
};

const CATEGORY_OPTIONS = Object.entries(CATEGORY_CONFIG).map(([slug, cfg]) => ({
  value: slug,
  label: cfg.label,
}));

// Mirrors backend MAIN_CATEGORIES
const MAIN_CATEGORIES_FE = new Set(['server-storage', 'disk-shelf', 'switch']);

const BomGroupCard = ({ group, canEdit = false, onSaveEdits }) => {
  const [expanded, setExpanded] = useState(false);
  const [showUnimportant, setShowUnimportant] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editMap, setEditMap] = useState({});
  const [saving, setSaving] = useState(false);
  // Initial values frozen at edit-start — used as span children so React
  // never overwrites DOM content mid-typing (fixes reversed bidi text).
  const initialEditRef = useRef({});

  const { main, children, total_net_price } = group;
  const mainCatalog = main.catalog || {};
  const mainCategory = mainCatalog.category || 'other';
  const mainCfg = CATEGORY_CONFIG[mainCategory] || CATEGORY_CONFIG['other'];

  // Group children by category
  const grouped = {};
  const unimportantChildren = [];

  for (const child of children) {
    const cat = child.catalog?.category || 'other';
    const isImportant = child.catalog?.important !== false;

    if (!isImportant) {
      unimportantChildren.push(child);
      continue;
    }
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(child);
  }

  // Aggregate by category: sum qty and price
  const aggregated = Object.entries(grouped).map(([cat, items]) => {
    const catCfg = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG['other'];
    const totalQty = items.reduce((sum, i) => sum + (i.ext_qty || 0), 0);
    const totalPrice = items.reduce((sum, i) => sum + (i.ext_net_price || 0), 0);
    // Hebrew description: catalog > AI description > Excel product > generic label
    const label =
      items.find(i => i.catalog?.description_he)?.catalog?.description_he ||
      items.find(i => i.product)?.product ||
      catCfg.label;
    return { cat, catCfg, totalQty, totalPrice, items, label };
  });

  const mainQty = Math.round(main.ext_qty || 1);
  const totalFormatted = formatPrice(total_net_price);

  // ── Inline Edit Logic ─────────────────────────────────────────────────────

  const allItems = [main, ...children];

  const startEditing = useCallback(() => {
    const map = {};
    for (const item of allItems) {
      map[item.part_number] = {
        description_he: item.catalog?.description_he || '',
        category: item.catalog?.category || 'other',
        part_alias: item.part_alias || '',
      };
    }
    initialEditRef.current = map;
    setEditMap(map);
    setEditing(true);
    if (!expanded) setExpanded(true);
  }, [allItems, expanded]);

  const cancelEditing = useCallback(() => {
    setEditing(false);
    setEditMap({});
    initialEditRef.current = {};
  }, []);

  const handleEditField = useCallback((partNumber, field, value) => {
    setEditMap(prev => ({
      ...prev,
      [partNumber]: { ...prev[partNumber], [field]: value },
    }));
  }, []);

  const handleSave = useCallback(async () => {
    // Build list of changed items only
    const changed = [];
    for (const item of allItems) {
      const orig = {
        description_he: item.catalog?.description_he || '',
        category: item.catalog?.category || 'other',
        part_alias: item.part_alias || '',
      };
      const edited = editMap[item.part_number];
      if (!edited) continue;
      const diff = {};
      if (edited.description_he !== orig.description_he) diff.description_he = edited.description_he;
      if (edited.category !== orig.category) diff.category = edited.category;
      if (edited.part_alias !== orig.part_alias) diff.part_alias = edited.part_alias;
      if (Object.keys(diff).length > 0) {
        changed.push({ part_number: item.part_number, ...diff });
      }
    }
    if (changed.length === 0) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onSaveEdits(changed);
      setEditing(false);
      setEditMap({});
    } catch {
      // keep edit mode open on failure
    } finally {
      setSaving(false);
    }
  }, [allItems, editMap, onSaveEdits]);

  const isMainSystem = group.is_main_system;
  // While editing, recompute based on current category selection
  const effectiveIsMainSystem = editing
    ? MAIN_CATEGORIES_FE.has(editMap[main.part_number]?.category ?? mainCategory)
    : isMainSystem;

  return (
    <div
      className={`bom-group-card${effectiveIsMainSystem === false ? ' bom-group-card--unidentified' : ''}`}
      style={{ '--card-color': mainCfg.color, '--card-bg': mainCfg.bg }}
    >
      {/* Unidentified system warning */}
      {effectiveIsMainSystem === false && (
        <div className="bgc-not-main-badge">⚠ לא מזוהה כמערכת ראשית</div>
      )}

      {/* Card header */}
      <div className="bgc-header">
        <div className="bgc-icon-wrap">
          <mainCfg.Icon size={36} color={mainCfg.color} />
        </div>
        <div className="bgc-title-block">
          <div className="bgc-part-number">{main.part_number}</div>
          {main.part_alias && (
            <div className="bgc-part-alias">{main.part_alias}</div>
          )}
          <span
            key={editing ? `main-edit-${main.part_number}` : `main-view-${main.part_number}`}
            contentEditable={editing}
            suppressContentEditableWarning
            dir="auto"
            className={`bgc-description${editing ? ' bgc-desc-editable' : ''}`}
            onInput={editing ? (e => handleEditField(main.part_number, 'description_he', e.currentTarget.textContent)) : undefined}
          >
            {editing
              ? (initialEditRef.current[main.part_number]?.description_he ?? mainCatalog.description_he ?? main.product ?? '')
              : (mainCatalog.description_he || (mainCatalog._ai && main.product) || main.product || '')}
          </span>
          {editing && (
            <select
              className="bgc-cat-select-inline"
              value={editMap[main.part_number]?.category ?? mainCategory}
              onChange={e => handleEditField(main.part_number, 'category', e.target.value)}
            >
              {CATEGORY_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          )}
        </div>
        <div className="bgc-header-right">
          <div className="bgc-qty-badge">× {mainQty}</div>
          {canEdit && !editing && (
            <button className="bgc-edit-icon-btn" onClick={startEditing} title="ערוך פריטים">
              <FiEdit2 size={15} />
            </button>
          )}
          {editing && (
            <div className="bgc-edit-actions">
              <button className="bgc-save-btn" onClick={handleSave} disabled={saving}>
                <FiCheck size={13} /> {saving ? '...' : 'שמור'}
              </button>
              <button className="bgc-cancel-btn" onClick={cancelEditing} disabled={saving}>
                <FiX size={13} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Price bar */}
      {totalFormatted && (
        <div className="bgc-price-bar">
          <span className="bgc-price-label">סה״כ מחיר נטו</span>
          <span className="bgc-price-value">{totalFormatted}</span>
        </div>
      )}

      <div className="bgc-divider" />

      {/* Aggregated children */}
      <div className="bgc-children">
        {aggregated.map(({ cat, catCfg, totalQty, totalPrice, label }) => (
          <div key={cat} className="bgc-child-row">
            <div className="bgc-child-icon">
              <catCfg.Icon size={20} color={catCfg.color} />
            </div>
            <div className="bgc-child-qty">{Math.round(totalQty)}</div>
            <div className="bgc-child-label">{label}</div>
            {totalPrice > 0 && (
              <div className="bgc-child-price">{formatPrice(totalPrice)}</div>
            )}
          </div>
        ))}
      </div>

      {/* Expand for full detail */}
      <div className="bgc-footer">
        <button className="bgc-expand-btn" onClick={() => setExpanded(e => !e)}>
          {expanded ? 'הסתר פרטים ▲' : 'פרטים מלאים ▼'}
        </button>

        {unimportantChildren.length > 0 && (
          <button
            className="bgc-unimportant-btn"
            onClick={() => setShowUnimportant(s => !s)}
          >
            {showUnimportant ? 'הסתר' : `+ ${unimportantChildren.length} רכיבים נוספים`}
          </button>
        )}
      </div>

      {/* Full line-item detail (expanded) */}
      {expanded && (
        <div className="bgc-detail">
          <div className="bgc-detail-header">
            <span>Part Number</span>
            <span>תיאור</span>
            <span>כמות</span>
            <span>מחיר נטו</span>
          </div>
          {[...children].filter(c => c.catalog?.important !== false || showUnimportant).map((child, idx) => (
            <div key={idx} className="bgc-detail-row">
              <span className="bgc-detail-pn">{child.part_number}</span>
              <div className="bgc-desc-cell">
                <span
                  key={editing ? `edit-${child.part_number}` : `view-${child.part_number}`}
                  contentEditable={editing}
                  suppressContentEditableWarning
                  dir="auto"
                  className={editing ? 'bgc-desc-editable' : 'bgc-detail-desc'}
                  onInput={editing ? (e => handleEditField(child.part_number, 'description_he', e.currentTarget.textContent)) : undefined}
                >
                  {editing
                    ? (initialEditRef.current[child.part_number]?.description_he ?? child.catalog?.description_he ?? child.product ?? '')
                    : (child.catalog?.description_he || child.product || child.part_number)}
                </span>
                {editing && (
                  <select
                    className="bgc-cat-select-inline"
                    value={editMap[child.part_number]?.category ?? child.catalog?.category ?? 'other'}
                    onChange={e => handleEditField(child.part_number, 'category', e.target.value)}
                  >
                    {CATEGORY_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                )}
              </div>
              <span>{Math.round(child.ext_qty || 0)}</span>
              <span className="bgc-detail-price">
                {child.ext_net_price > 0 ? formatPrice(child.ext_net_price) : '—'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Unimportant shown outside expand */}
      {!expanded && showUnimportant && (
        <div className="bgc-unimportant-list">
          {unimportantChildren.map((child, idx) => (
            <div key={idx} className="bgc-child-row bgc-child-muted">
              <div className="bgc-child-icon">
                <CategoryIcon category="other" size={16} />
              </div>
              <div className="bgc-child-qty">{Math.round(child.ext_qty || 0)}</div>
              <div className="bgc-child-label" style={{ opacity: 0.5 }}>
                {child.catalog?.description_he || child.product || child.part_number}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BomGroupCard;
