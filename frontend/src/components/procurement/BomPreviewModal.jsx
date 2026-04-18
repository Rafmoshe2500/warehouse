import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { FiX, FiSearch, FiEdit2, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { CATEGORY_CONFIG } from './BomScannerTab/CategoryIcons';
import bomService from '../../api/services/bomService';
import './BomPreviewModal.css';

// ── Constants ────────────────────────────────────────────────────────────────
const VENDOR_META = {
  NETAPP: { logo: '🟠', color: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b33, #f59e0b08)', label: 'NetApp' },
  DELL:   { logo: '🔵', color: '#3b82f6', gradient: 'linear-gradient(135deg, #3b82f633, #3b82f608)', label: 'Dell'   },
  HPE:    { logo: '🟢', color: '#22c55e', gradient: 'linear-gradient(135deg, #22c55e33, #22c55e08)', label: 'HPE'    },
};
const getVendorMeta = (v) =>
  VENDOR_META[v] || VENDOR_META[String(v || '').toUpperCase()] || { logo: '📦', color: '#6366f1', gradient: '', label: v || 'BOM' };

const CATEGORY_OPTIONS = Object.entries(CATEGORY_CONFIG).map(([slug, cfg]) => ({
  value: slug,
  label: cfg.label,
}));

const fmt = (val) =>
  val > 0 ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val) : null;

// ── Group Card ────────────────────────────────────────────────────────────────
const GroupCard = ({ group, vendorColor, selected, onSelect }) => {
  const { main, children = [], total_net_price } = group;
  const catalog = main.catalog || {};
  const category = catalog.category || 'other';
  const cfg = CATEGORY_CONFIG[category] || CATEGORY_CONFIG['other'];
  const qty = Math.round(main.ext_qty || 1);
  const price = fmt(total_net_price);

  // Aggregate child counts by category for progress bars (top 3)
  const aggr = useMemo(() => {
    const map = {};
    const total = children.filter(c => c.catalog?.important !== false).length;
    for (const c of children) {
      if (c.catalog?.important === false) continue;
      const cat = c.catalog?.category || 'other';
      if (!map[cat]) map[cat] = 0;
      map[cat] += 1;
    }
    return Object.entries(map)
      .map(([cat, count]) => ({
        cat,
        count,
        pct: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [children]);

  return (
    <div
      className={`bpv-card ${selected ? 'selected' : ''}`}
      style={{ '--vc': vendorColor, '--cc': cfg.color }}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onSelect()}
    >
      <div className="bpv-card-accent" />

      {/* Header */}
      <div className="bpv-card-head">
        <div className="bpv-card-icon-wrap" style={{ background: cfg.bg }}>
          <cfg.Icon size={24} color={cfg.color} />
        </div>
        <div className="bpv-card-meta">
          <div className="bpv-card-pn">{main.part_number}</div>
          <div className="bpv-card-desc">{catalog.description_he || main.product || ''}</div>
          <span className="bpv-card-category" style={{ color: cfg.color }}>{cfg.label}</span>
        </div>
        <div className="bpv-card-qty">×{qty}</div>
      </div>

      {/* Component breakdown — progress bars */}
      {aggr.length > 0 && (
        <div className="bpv-card-breakdown">
          {aggr.map(({ cat, count, pct }) => {
            const ccfg = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG['other'];
            return (
              <div key={cat} className="bpv-breakdown-row">
                <ccfg.Icon size={11} color={ccfg.color} style={{ flexShrink: 0 }} />
                <div className="bpv-breakdown-bar-wrap">
                  <div className="bpv-breakdown-bar" style={{ width: `${pct}%`, background: ccfg.color }} />
                </div>
                <span className="bpv-breakdown-qty">{count}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer: price + details button */}
      <div className="bpv-card-footer">
        {price
          ? <span className="bpv-card-price-value">{price}</span>
          : <span />
        }
        <button
          className="bpv-details-btn"
          onClick={e => { e.stopPropagation(); onSelect(); }}
        >
          פרטים ←
        </button>
      </div>
    </div>
  );
};

// ── Detail Drawer ─────────────────────────────────────────────────────────────
const DetailDrawer = ({ group, vendor, canEdit, onClose, onSaveEdits, orderId }) => {
  const [editing, setEditing] = useState(false);
  const [editMap, setEditMap] = useState({});
  const [saving,  setSaving]  = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  // Freeze initial values at edit-start to avoid React overwriting DOM mid-typing (bidi fix)
  const initialEditRef = useRef({});
  // Local optimistic copy so the UI reflects saved changes without a full refetch
  const [localGroup, setLocalGroup] = useState(group);

  // Sync if parent passes a different group (user selected another card)
  // Using state-based comparison (React-documented getDerivedStateFromProps pattern)
  // so it survives StrictMode double renders correctly — unlike ref mutation.
  const [prevGroupProp, setPrevGroupProp] = useState(group);
  if (group !== prevGroupProp) {
    setPrevGroupProp(group);
    setLocalGroup(group);
    setEditing(false);
    setEditMap({});
  }

  const { main, children = [], total_net_price } = localGroup;
  const catalog  = main.catalog || {};
  const category = catalog.category || 'other';
  const cfg      = CATEGORY_CONFIG[category] || CATEGORY_CONFIG['other'];
  const qty      = Math.round(main.ext_qty || 1);
  const price    = fmt(total_net_price);

  const allItems = useMemo(() => [main, ...children], [main, children]);

  const startEditing = useCallback(() => {
    const map = {};
    for (const item of allItems) {
      map[item.part_number] = {
        description_he: item.catalog?.description_he || '',
        category:       item.catalog?.category       || 'other',
      };
    }
    initialEditRef.current = map;
    setEditMap(map);
    setEditing(true);
  }, [allItems]);

  const cancelEditing = useCallback(() => {
    setEditing(false);
    setEditMap({});
    initialEditRef.current = {};
  }, []);

  const handleField = useCallback((pn, field, value) => {
    setEditMap(prev => ({ ...prev, [pn]: { ...prev[pn], [field]: value } }));
  }, []);

  const handleSave = useCallback(async () => {
    const changed = [];
    for (const item of allItems) {
      const orig   = { description_he: item.catalog?.description_he || '', category: item.catalog?.category || 'other' };
      const edited = editMap[item.part_number];
      if (!edited) continue;
      const diff = {};
      if (edited.description_he !== orig.description_he) diff.description_he = edited.description_he;
      if (edited.category       !== orig.category)       diff.category       = edited.category;
      if (Object.keys(diff).length > 0) changed.push({ part_number: item.part_number, ...diff });
    }
    if (!changed.length) { setEditing(false); return; }
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      await bomService.updateBomItems(vendor, changed, orderId || null);
      // ── Optimistic update: apply saved values into localGroup ──────────────
      setLocalGroup(prev => {
        const applyToItem = (item) => {
          const saved = editMap[item.part_number];
          if (!saved) return item;
          return {
            ...item,
            catalog: {
              ...(item.catalog || {}),
              ...(saved.description_he !== undefined ? { description_he: saved.description_he } : {}),
              ...(saved.category       !== undefined ? { category:       saved.category       } : {}),
            },
          };
        };
        return {
          ...prev,
          main:     applyToItem(prev.main),
          children: (prev.children || []).map(applyToItem),
        };
      });
      // Notify parent so GroupCard list updates too
      if (onSaveEdits) onSaveEdits(changed);
      setEditing(false);
      setEditMap({});
      initialEditRef.current = {};
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      const msg = err?.response?.data?.detail || 'שגיאה בשמירת העריכות';
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  }, [allItems, editMap, vendor, onSaveEdits]);

  return (
    <div className="bpv-drawer">

      {/* Drawer header */}
      <div className="bpv-drawer-head" style={{ borderBottom: `2px solid ${cfg.color}44` }}>
        <button className="bpv-drawer-close" onClick={onClose} title="סגור">
          <FiX size={16} />
        </button>
        <div className="bpv-drawer-icon-wrap" style={{ background: cfg.bg }}>
          <cfg.Icon size={18} color={cfg.color} />
        </div>
        <div className="bpv-drawer-title">
          <div className="bpv-drawer-pn">{main.part_number}</div>
          <span className="bpv-drawer-cat" style={{ color: cfg.color }}>{cfg.label}</span>
        </div>
        <div className="bpv-drawer-qty">×{qty}</div>
      </div>

      {/* Description */}
      <div className="bpv-drawer-desc-section">
        {editing ? (
          <span
            key={`de-${main.part_number}`}
            contentEditable
            suppressContentEditableWarning
            dir="auto"
            className="bpv-desc-editable"
            onInput={e => handleField(main.part_number, 'description_he', e.currentTarget.textContent)}
          >
            {initialEditRef.current[main.part_number]?.description_he ?? catalog.description_he ?? main.product ?? ''}
          </span>
        ) : (
          <p className="bpv-drawer-desc-text">{catalog.description_he || main.product || '—'}</p>
        )}
        {editing && (
          <select
            className="bpv-cat-select"
            value={editMap[main.part_number]?.category ?? category}
            onChange={e => handleField(main.part_number, 'category', e.target.value)}
          >
            {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        )}
      </div>

      {/* Price */}
      {price && (
        <div className="bpv-drawer-price">
          <span className="bpv-drawer-price-label">מחיר נטו</span>
          <span className="bpv-drawer-price-value">{price}</span>
        </div>
      )}

      {/* Children table */}
      {children.length > 0 && (
        <div className="bpv-drawer-children">
          <div className="bpv-drawer-section-title">{children.length} רכיבי ילד</div>
          <div className="bpv-detail-header">
            <span>Part #</span><span>תיאור</span><span>כמות</span><span>מחיר</span>
          </div>
          <div className="bpv-drawer-rows">
            {children.map((c, i) => (
              <div key={i} className={`bpv-detail-row ${c.catalog?.important === false ? 'muted' : ''}`}>
                <span className="bpv-detail-pn">{c.part_number}</span>
                <div className="bpv-desc-cell">
                  <span
                    key={editing ? `ce-${c.part_number}-${i}` : `cv-${c.part_number}-${i}`}
                    contentEditable={editing}
                    suppressContentEditableWarning
                    dir="auto"
                    className={editing ? 'bpv-desc-editable' : undefined}
                    onInput={editing ? (e => handleField(c.part_number, 'description_he', e.currentTarget.textContent)) : undefined}
                  >
                    {editing
                      ? (initialEditRef.current[c.part_number]?.description_he ?? c.catalog?.description_he ?? c.product ?? '')
                      : (c.catalog?.description_he || c.product || '—')}
                  </span>
                  {editing && (
                    <select
                      className="bpv-cat-select"
                      value={editMap[c.part_number]?.category ?? c.catalog?.category ?? 'other'}
                      onChange={e => handleField(c.part_number, 'category', e.target.value)}
                    >
                      {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  )}
                </div>
                <span>{Math.round(c.ext_qty || 0)}</span>
                <span className="bpv-detail-price">{c.ext_net_price > 0 ? fmt(c.ext_net_price) : '—'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Save feedback */}
      {saveError && (
        <div className="bpv-drawer-toast bpv-drawer-toast--error">
          <FiAlertCircle size={14} /> {saveError}
        </div>
      )}
      {saveSuccess && (
        <div className="bpv-drawer-toast bpv-drawer-toast--success">
          <FiCheck size={14} /> השינויים נשמרו בהצלחה
        </div>
      )}

      {/* Edit actions */}
      {canEdit && (
        <div className="bpv-drawer-actions">
          {!editing ? (
            <button className="bpv-edit-btn-full" onClick={startEditing}>
              <FiEdit2 size={14} /> ערוך פרטים
            </button>
          ) : (
            <>
              <button className="bpv-save-btn" onClick={handleSave} disabled={saving}>
                <FiCheck size={14} /> {saving ? 'שומר...' : 'שמור שינויים'}
              </button>
              <button className="bpv-cancel-btn" onClick={cancelEditing} disabled={saving}>
                <FiX size={14} /> בטל
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// ── Main Modal ────────────────────────────────────────────────────────────────
const BomPreviewModal = ({ isOpen, onClose, bomData, vendor, canEdit = false, onBomDataChange, orderId }) => {
  const [search,          setSearch]          = useState('');
  const [activeCategory,  setActiveCategory]  = useState('all');
  const [selectedGroup,   setSelectedGroup]   = useState(null);

  // Local mutable copy of groups so drawer edits propagate to cards
  const [localGroups, setLocalGroups] = useState(() => bomData?.groups || []);
  useEffect(() => {
    setLocalGroups(bomData?.groups || []);
  }, [bomData]);

  const handleDrawerSaveEdits = useCallback((changedItems) => {
    const byPn = Object.fromEntries(changedItems.map(i => [i.part_number, i]));
    const applyToItem = (item) => {
      const edit = byPn[item.part_number];
      if (!edit) return item;
      return { ...item, catalog: { ...(item.catalog || {}), ...edit } };
    };
    const updatedGroups = localGroups.map(g => ({
      ...g,
      main:     applyToItem(g.main),
      children: (g.children || []).map(applyToItem),
    }));
    setLocalGroups(updatedGroups);
    // Update selected group reference so the drawer reflects changes immediately
    setSelectedGroup(prev => {
      if (!prev) return prev;
      return updatedGroups.find(gr => gr.main?.part_number === prev.main?.part_number) || prev;
    });
    // Propagate to parent so the order in the React Query cache stays fresh
    if (onBomDataChange) onBomDataChange(updatedGroups);
  }, [localGroups, onBomDataChange]);

  if (!isOpen || !bomData) return null;

  const groups = localGroups;
  const meta   = getVendorMeta(vendor);

  // KPI totals
  const totalPrice      = groups.reduce((s, g) => s + (g.total_net_price || 0), 0);
  const totalComponents = groups.reduce((s, g) => s + (g.children || []).length, 0);

  // Category counts
  const categoryCounts = {};
  for (const g of groups) {
    const cat = g.main?.catalog?.category || 'other';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  }
  const categoryTabs = [
    { key: 'all', label: 'הכל', count: groups.length, color: null },
    ...Object.entries(categoryCounts).map(([cat, n]) => ({
      key:   cat,
      label: (CATEGORY_CONFIG[cat] || {}).label || cat,
      count: n,
      color: (CATEGORY_CONFIG[cat] || {}).color || null,
    })),
  ];

  // Search + category filter
  const filtered = groups.filter(g => {
    const pn   = g.main?.part_number?.toLowerCase() || '';
    const desc = (g.main?.catalog?.description_he || g.main?.product || '').toLowerCase();
    const q    = search.toLowerCase();
    const matchSearch = !q || pn.includes(q) || desc.includes(q);
    const matchCat    = activeCategory === 'all' || (g.main?.catalog?.category || 'other') === activeCategory;
    return matchSearch && matchCat;
  });

  const handleSelectGroup = (group) => {
    setSelectedGroup(prev => (prev === group ? null : group));
  };

  return (
    <div className="bpv-overlay" onClick={onClose}>
      <div className="bpv-panel" onClick={e => e.stopPropagation()}>

        {/* ── Slim Header ───────────────────────────────── */}
        <div className="bpv-header" style={{ borderBottom: `1px solid ${meta.color}33` }}>
          <div
            className="bpv-vendor-badge"
            style={{ color: meta.color, borderColor: `${meta.color}44`, background: `${meta.color}12` }}
          >
            {meta.logo} {meta.label}
          </div>
          <h2 className="bpv-title">תצוגת BOM</h2>
          <div className="bpv-header-kpis">
            <span className="bpv-header-kpi" title="מערכות">
              <span style={{ color: meta.color }}>📦</span> {groups.length}
            </span>
            <span className="bpv-header-kpi" title="רכיבים">
              <span style={{ color: '#6366f1' }}>🔩</span> {totalComponents}
            </span>
            {totalPrice > 0 && (
              <span className="bpv-header-kpi" title="סה״כ">
                <span style={{ color: '#22c55e' }}>💰</span> {fmt(totalPrice)}
              </span>
            )}
          </div>
          <button className="bpv-close" onClick={onClose}><FiX size={18} /></button>
        </div>

        {/* ── Body: Sidebar + Main + Drawer ─────────────── */}
        <div className="bpv-body">

          {/* ── Sidebar ──────────────────────────────────── */}
          <aside className="bpv-sidebar">
            {/* Vendor hero */}
            <div className="bpv-sidebar-vendor" style={{ background: meta.gradient }}>
              <span className="bpv-sidebar-vendor-logo">{meta.logo}</span>
              <span className="bpv-sidebar-vendor-name">{meta.label}</span>
            </div>

            {/* Category navigation */}
            <nav className="bpv-sidebar-nav">
              <div className="bpv-sidebar-section-title">קטגוריות</div>
              {categoryTabs.map(t => (
                <button
                  key={t.key}
                  className={`bpv-sidebar-nav-item ${activeCategory === t.key ? 'active' : ''}`}
                  style={activeCategory === t.key && t.color ? { '--nav-color': t.color } : {}}
                  onClick={() => { setActiveCategory(t.key); setSelectedGroup(null); }}
                >
                  <span className="bpv-sidebar-nav-label">{t.label}</span>
                  <span className="bpv-sidebar-nav-count">{t.count}</span>
                </button>
              ))}
            </nav>

            {/* Search */}
            <div className="bpv-sidebar-search-wrap">
              <FiSearch size={13} className="bpv-sidebar-search-icon" />
              <input
                className="bpv-sidebar-search"
                placeholder='חפש מק"ט...'
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* Total */}
            {totalPrice > 0 && (
              <div className="bpv-sidebar-total">
                <span className="bpv-sidebar-total-label">סה״כ BOM</span>
                <span className="bpv-sidebar-total-value">{fmt(totalPrice)}</span>
              </div>
            )}
          </aside>

          {/* ── Main cards area ──────────────────────────── */}
          <main className="bpv-main">
            <div className="bpv-cards">
              {filtered.length > 0 ? (
                filtered.map((group, idx) => (
                  <GroupCard
                    key={idx}
                    group={group}
                    vendorColor={meta.color}
                    selected={selectedGroup === group}
                    onSelect={() => handleSelectGroup(group)}
                  />
                ))
              ) : (
                <div className="bpv-empty">
                  <span>🔍</span>
                  <p>לא נמצאו תוצאות</p>
                </div>
              )}
            </div>
          </main>

          {/* ── Detail Drawer ────────────────────────────── */}
          {selectedGroup && (
            <DetailDrawer
              group={selectedGroup}
              vendor={vendor}
              canEdit={canEdit}
              onClose={() => setSelectedGroup(null)}
              onSaveEdits={handleDrawerSaveEdits}
              orderId={orderId}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default BomPreviewModal;
