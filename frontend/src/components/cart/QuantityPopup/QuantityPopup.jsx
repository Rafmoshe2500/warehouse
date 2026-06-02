import React, { useState } from 'react';
import './QuantityPopup.css';

/**
 * Small modal asking the user how many units to add to the cart.
 * Only shown for non-serial items.
 */
const QuantityPopup = ({ item, onConfirm, onCancel }) => {
  const maxStock = parseInt(item?.current_stock, 10) || 999;
  const [qty, setQty] = useState(1);

  const handleConfirm = () => {
    const safeQty = Math.max(1, Math.min(qty, maxStock));
    onConfirm(safeQty);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleConfirm();
    if (e.key === 'Escape') onCancel();
  };

  return (
    <div className="qty-popup__overlay" onClick={onCancel}>
      <div
        className="qty-popup"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-modal="true"
        aria-label="בחר כמות"
      >
        <div className="qty-popup__header">
          <span className="qty-popup__title">הוסף לעגלה</span>
        </div>

        <div className="qty-popup__item-info">
          <span className="qty-popup__catalog">{item?.catalog_number || '—'}</span>
          {item?.description && (
            <span className="qty-popup__desc">{item.description}</span>
          )}
        </div>

        <div className="qty-popup__field">
          <label className="qty-popup__label" htmlFor="cart-qty">
            כמות
          </label>
          <input
            id="cart-qty"
            type="number"
            className="qty-popup__input"
            value={qty}
            min={1}
            max={maxStock}
            autoFocus
            onChange={(e) =>
              setQty(Math.max(1, Math.min(parseInt(e.target.value, 10) || 1, maxStock)))
            }
          />
          {maxStock < 999 && (
            <span className="qty-popup__hint">מלאי: {maxStock}</span>
          )}
        </div>

        <div className="qty-popup__actions">
          <button className="qty-popup__btn qty-popup__btn--cancel" onClick={onCancel}>
            ביטול
          </button>
          <button className="qty-popup__btn qty-popup__btn--confirm" onClick={handleConfirm}>
            הוסף לעגלה
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuantityPopup;
