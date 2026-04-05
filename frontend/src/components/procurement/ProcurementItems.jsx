import React, { useState } from 'react';

const VISIBLE_COUNT = 4; // items shown before "show more"

// ── Single item row ───────────────────────────────────────
const ItemRow = ({ item, vendorColor }) => (
  <div className="oc-item-row">
    <span className="oc-item-icon" style={{ background: vendorColor }} />
    <div className="oc-item-info">
      <span className="oc-item-name" title={item.part_alias || item.name}>
        {item.part_alias || item.name}
      </span>
      {item.catalog && (
        <span className="oc-item-catalog">{item.catalog}</span>
      )}
    </div>
    {item.qty != null && (
      <span className="oc-item-qty">
        ×{item.qty >= 1000 ? (item.qty / 1000).toFixed(0) + 'K' : item.qty}
      </span>
    )}
  </div>
);

// ── Items block: 2-col grid + show more ──────────────────
const OrderItems = ({ items, vendorColor }) => {
  const [expanded, setExpanded] = useState(false);

  const visibleItems = expanded ? items : items.slice(0, VISIBLE_COUNT);
  const hiddenCount  = items.length - VISIBLE_COUNT;
  const hasMore      = items.length > VISIBLE_COUNT;

  return (
    <div className="oc-items-block">

      <div className="oc-items-grid-2">
        {visibleItems.map((item, i) => (
          <ItemRow key={i} item={item} vendorColor={vendorColor} />
        ))}
      </div>

      {hasMore && (
        <div className="oc-show-more-row">
          <button
            className="oc-show-more-btn"
            onClick={() => setExpanded(prev => !prev)}
          >
            {expanded ? '▴ הצג פחות' : `▾ עוד ${hiddenCount} רכיבים`}
          </button>
          <span className="oc-total-count">סה"כ {items.length} רכיבים</span>
        </div>
      )}

    </div>
  );
};

export default OrderItems;
