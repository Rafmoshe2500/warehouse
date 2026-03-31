import React, { useState } from 'react';
import { CATEGORY_CONFIG, CategoryIcon } from './CategoryIcons';
import './BomGroupCard.css';

const formatPrice = (val) => {
  if (!val || val === 0) return null;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
};

const BomGroupCard = ({ group }) => {
  const [expanded, setExpanded] = useState(false);
  const [showUnimportant, setShowUnimportant] = useState(false);

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

  return (
    <div className="bom-group-card" style={{ '--card-color': mainCfg.color, '--card-bg': mainCfg.bg }}>
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
          <div className="bgc-description">
            {mainCatalog.description_he || mainCatalog._ai && main.product || main.product || ''}
          </div>
        </div>
        <div className="bgc-qty-badge">× {mainQty}</div>
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
              <span className="bgc-detail-desc">
                {child.catalog?.description_he || child.product || child.part_number}
              </span>
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
