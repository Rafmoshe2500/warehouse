import React, { useState, useMemo } from 'react';
import { FiX, FiSearch, FiGrid, FiList } from 'react-icons/fi';
import { CATEGORY_CONFIG, CategoryIcon } from './BomScannerTab/CategoryIcons';
import './BomPreviewModal.css';

// ── Constants ────────────────────────────────────────────────────────────────
const VENDOR_META = {
  NETAPP: { logo: '🟠', color: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b22, #f59e0b05)', label: 'NetApp' },
  DELL:   { logo: '🔵', color: '#3b82f6', gradient: 'linear-gradient(135deg, #3b82f622, #3b82f605)', label: 'Dell'   },
  HPE:    { logo: '🟢', color: '#22c55e', gradient: 'linear-gradient(135deg, #22c55e22, #22c55e05)', label: 'HPE'    },
};
const getVendorMeta = (v) =>
  VENDOR_META[v] || VENDOR_META[String(v || '').toUpperCase()] || { logo: '📦', color: '#6366f1', gradient: '', label: v || 'BOM' };

const fmt = (val) =>
  val > 0 ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val) : null;

// ── KPI Chip ─────────────────────────────────────────────────────────────────
const KpiChip = ({ icon, label, value, color }) => (
  <div className="bpv-kpi">
    <span className="bpv-kpi-icon" style={{ color }}>{icon}</span>
    <div>
      <div className="bpv-kpi-value" style={{ color }}>{value}</div>
      <div className="bpv-kpi-label">{label}</div>
    </div>
  </div>
);

// ── Inline Group Card (redesigned) ───────────────────────────────────────────
const GroupCard = ({ group, vendorColor }) => {
  const [expanded, setExpanded] = useState(false);
  const { main, children = [], total_net_price } = group;
  const catalog = main.catalog || {};
  const category = catalog.category || 'other';
  const cfg = CATEGORY_CONFIG[category] || CATEGORY_CONFIG['other'];
  const qty = Math.round(main.ext_qty || 1);

  // Aggregate children by category
  const aggr = useMemo(() => {
    const map = {};
    for (const c of children) {
      if (c.catalog?.important === false) continue;
      const cat = c.catalog?.category || 'other';
      if (!map[cat]) map[cat] = { qty: 0, price: 0, label: '' };
      map[cat].qty += c.ext_qty || 0;
      map[cat].price += c.ext_net_price || 0;
      if (!map[cat].label)
        map[cat].label = c.catalog?.description_he || (CATEGORY_CONFIG[cat] || {}).label || cat;
    }
    return Object.entries(map).map(([cat, d]) => ({ cat, ...d }));
  }, [children]);

  const price = fmt(total_net_price);

  return (
    <div className="bpv-card" style={{ '--vc': vendorColor, '--cc': cfg.color }}>
      {/* Top accent */}
      <div className="bpv-card-accent" />

      {/* Header */}
      <div className="bpv-card-head">
        <div className="bpv-card-icon-wrap" style={{ background: cfg.bg }}>
          <cfg.Icon size={28} color={cfg.color} />
        </div>
        <div className="bpv-card-meta">
          <div className="bpv-card-pn">{main.part_number}</div>
          <div className="bpv-card-desc">{catalog.description_he || main.product || ''}</div>
          <span className="bpv-card-category" style={{ color: cfg.color }}>{cfg.label}</span>
        </div>
        <div className="bpv-card-qty">×{qty}</div>
      </div>

      {/* Price */}
      {price && (
        <div className="bpv-card-price">
          <span className="bpv-card-price-label">מחיר נטו</span>
          <span className="bpv-card-price-value">{price}</span>
        </div>
      )}

      {/* Children summary */}
      {aggr.length > 0 && (
        <div className="bpv-card-children">
          {aggr.map(({ cat, qty: cQty, price: cPrice, label }) => {
            const ccfg = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG['other'];
            return (
              <div key={cat} className="bpv-child-row">
                <ccfg.Icon size={14} color={ccfg.color} style={{ flexShrink: 0 }} />
                <span className="bpv-child-qty">{Math.round(cQty)}</span>
                <span className="bpv-child-label">{label}</span>
                {cPrice > 0 && <span className="bpv-child-price">{fmt(cPrice)}</span>}
              </div>
            );
          })}
        </div>
      )}

      {/* Expand toggle */}
      <button className="bpv-expand-btn" onClick={() => setExpanded(e => !e)}>
        {expanded ? '▲ הסתר פרטים' : '▼ פרטים מלאים'}
      </button>

      {/* Expanded detail table */}
      {expanded && (
        <div className="bpv-detail-table">
          <div className="bpv-detail-header">
            <span>Part #</span><span>תיאור</span><span>כמות</span><span>מחיר</span>
          </div>
          {children.map((c, i) => (
            <div key={i} className={`bpv-detail-row ${c.catalog?.important === false ? 'muted' : ''}`}>
              <span className="bpv-detail-pn">{c.part_number}</span>
              <span>{c.catalog?.description_he || c.product || '—'}</span>
              <span>{Math.round(c.ext_qty || 0)}</span>
              <span className="bpv-detail-price">{c.ext_net_price > 0 ? fmt(c.ext_net_price) : '—'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Main Modal ────────────────────────────────────────────────────────────────
const BomPreviewModal = ({ isOpen, onClose, bomData, vendor }) => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // grid | list

  if (!isOpen || !bomData) return null;

  const groups = bomData.groups || [];
  const meta = getVendorMeta(vendor);

  // KPI totals
  const totalPrice = groups.reduce((s, g) => s + (g.total_net_price || 0), 0);
  const totalComponents = groups.reduce((s, g) => s + (g.children || []).length, 0);

  // Category counts (from main items)
  const categoryCounts = {};
  for (const g of groups) {
    const cat = g.main?.catalog?.category || 'other';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  }
  const categoryTabs = [
    { key: 'all', label: 'הכל', count: groups.length },
    ...Object.entries(categoryCounts).map(([cat, n]) => ({
      key: cat,
      label: (CATEGORY_CONFIG[cat] || {}).label || cat,
      count: n,
    })),
  ];

  // Search + category filter
  const filtered = groups.filter(g => {
    const pn = g.main?.part_number?.toLowerCase() || '';
    const desc = (g.main?.catalog?.description_he || g.main?.product || '').toLowerCase();
    const q = search.toLowerCase();
    const matchSearch = !q || pn.includes(q) || desc.includes(q);
    const matchCat = activeCategory === 'all' || (g.main?.catalog?.category || 'other') === activeCategory;
    return matchSearch && matchCat;
  });

  // Footer category breakdown
  const breakdown = {};
  for (const g of filtered) {
    const cat = g.main?.catalog?.category || 'other';
    if (!breakdown[cat]) breakdown[cat] = 0;
    breakdown[cat] += g.total_net_price || 0;
  }

  return (
    <div className="bpv-overlay" onClick={onClose}>
      <div className="bpv-panel" onClick={e => e.stopPropagation()}>

        {/* ── Header ─────────────────────────────────────── */}
        <div className="bpv-header" style={{ background: meta.gradient, borderBottom: `1px solid ${meta.color}22` }}>
          <div className="bpv-header-left">
            <div className="bpv-vendor-badge" style={{ color: meta.color, borderColor: `${meta.color}44` }}>
              {meta.logo} {meta.label}
            </div>
            <h2 className="bpv-title">תוצאות BOM</h2>
          </div>

          <div className="bpv-kpi-row">
            <KpiChip icon="📦" label="מערכות"  value={groups.length}    color={meta.color} />
            <KpiChip icon="🔩" label="רכיבים"  value={totalComponents}  color="#6366f1"   />
            {totalPrice > 0 && (
              <KpiChip icon="💰" label="סה״כ"   value={fmt(totalPrice)}  color="#22c55e"  />
            )}
          </div>

          <button className="bpv-close" onClick={onClose}><FiX size={18} /></button>
        </div>

        {/* ── Filter bar ─────────────────────────────────── */}
        <div className="bpv-filter-bar">
          {/* Category tabs */}
          <div className="bpv-tabs">
            {categoryTabs.map(t => (
              <button
                key={t.key}
                className={`bpv-tab ${activeCategory === t.key ? 'active' : ''}`}
                onClick={() => setActiveCategory(t.key)}
              >
                {t.label}
                <span className="bpv-tab-count">{t.count}</span>
              </button>
            ))}
          </div>

          <div className="bpv-filter-right">
            {/* Search */}
            <div className="bpv-search-wrap">
              <FiSearch size={14} className="bpv-search-icon" />
              <input
                className="bpv-search"
                placeholder='חפש מק"ט או תיאור...'
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            {/* View toggle */}
            <div className="bpv-view-toggle">
              <button className={viewMode === 'grid' ? 'active' : ''} onClick={() => setViewMode('grid')} title="Grid"><FiGrid size={15} /></button>
              <button className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')} title="List"><FiList size={15} /></button>
            </div>
          </div>
        </div>

        {/* ── Cards ──────────────────────────────────────── */}
        <div className={`bpv-cards ${viewMode === 'list' ? 'list' : ''}`}>
          {filtered.length > 0 ? (
            filtered.map((group, idx) => (
              <GroupCard key={idx} group={group} vendorColor={meta.color} />
            ))
          ) : (
            <div className="bpv-empty">
              <span>🔍</span>
              <p>לא נמצאו תוצאות</p>
            </div>
          )}
        </div>

        {/* ── Footer totals ───────────────────────────────── */}
        {Object.keys(breakdown).length > 0 && (
          <div className="bpv-footer">
            <span className="bpv-footer-label">פירוט לפי קטגוריה:</span>
            <div className="bpv-footer-chips">
              {Object.entries(breakdown).map(([cat, price]) => {
                const ccfg = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG['other'];
                return (
                  <span key={cat} className="bpv-footer-chip" style={{ borderColor: `${ccfg.color}44`, color: ccfg.color }}>
                    {ccfg.label} — {fmt(price)}
                  </span>
                );
              })}
            </div>
            {totalPrice > 0 && (
              <span className="bpv-footer-total">{fmt(filtered.reduce((s, g) => s + (g.total_net_price || 0), 0))}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BomPreviewModal;
