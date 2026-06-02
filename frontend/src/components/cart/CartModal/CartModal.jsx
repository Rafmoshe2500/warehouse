import React, { useCallback, useState } from 'react';
import { FiShoppingCart, FiX, FiTrash2, FiClock } from 'react-icons/fi';
import { useCart } from '../../../context/CartContext';
import EmailPreview from '../EmailPreview/EmailPreview';
import './CartModal.css';

const MS_IN_HOUR = 3_600_000;

function useCountdown(expiresAt) {
  const target = expiresAt ? new Date(expiresAt).getTime() : null;
  const remaining = target ? Math.max(0, target - Date.now()) : null;
  const hours = remaining !== null ? Math.floor(remaining / MS_IN_HOUR) : null;
  const minutes = remaining !== null ? Math.floor((remaining % MS_IN_HOUR) / 60_000) : null;
  return { hours, minutes };
}

const CartModal = ({ onClose }) => {
  const { cart, cartCount, removeFromCart, checkoutCart, clearCart, isLoading } = useCart();
  const [targetSite, setTargetSite] = useState(() => {
    const sites = cart?.items?.map((i) => i.target_site).filter(Boolean);
    return sites?.length ? sites[0] : '';
  });
  const [checkoutResult, setCheckoutResult] = useState(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const { hours, minutes } = useCountdown(cart?.expires_at);

  const handleRemove = useCallback(
    async (itemId) => {
      try {
        await removeFromCart(itemId);
      } catch {
        /* toast is handled by the caller component */
      }
    },
    [removeFromCart]
  );

  const handleCheckout = useCallback(async () => {
    if (!targetSite.trim()) return;
    setIsCheckingOut(true);
    try {
      const result = await checkoutCart(targetSite.trim());
      setCheckoutResult(result);
    } catch (err) {
      console.error('Checkout failed', err);
    } finally {
      setIsCheckingOut(false);
    }
  }, [checkoutCart, targetSite]);

  const handleClearAll = async () => {
    if (window.confirm('לרוקן את כל העגלה?')) {
      await clearCart();
    }
  };

  if (checkoutResult) {
    return (
      <EmailPreview
        emailText={checkoutResult.email_text}
        targetSite={targetSite}
        onClose={onClose}
      />
    );
  }

  const items = cart?.items ?? [];
  const serialItems = items.filter((i) => i.serial);
  const nonSerialItems = items.filter((i) => !i.serial);

  return (
    <div className="cart-modal__overlay" onClick={onClose}>
      <div
        className="cart-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="עגלת קניות"
      >
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="cart-modal__header">
          <div className="cart-modal__header-left">
            <FiShoppingCart size={18} />
            <h2 className="cart-modal__title">עגלת קניות</h2>
            {cartCount > 0 && (
              <span className="cart-modal__count">{cartCount} פריטים</span>
            )}
          </div>
          <div className="cart-modal__header-right">
            {hours !== null && (
              <span className="cart-modal__expiry" title="זמן לפקיעת העגלה">
                <FiClock size={13} />
                {hours}:{String(minutes).padStart(2, '0')} שע׳
              </span>
            )}
            <button className="cart-modal__close" onClick={onClose} aria-label="סגור">
              <FiX size={18} />
            </button>
          </div>
        </div>

        {/* ── Content ─────────────────────────────────────────────────── */}
        {isLoading ? (
          <div className="cart-modal__empty">טוען...</div>
        ) : items.length === 0 ? (
          <div className="cart-modal__empty">
            <FiShoppingCart size={40} />
            <p>העגלה ריקה</p>
          </div>
        ) : (
          <div className="cart-modal__body">
            {/* Serial items */}
            {serialItems.length > 0 && (
              <section className="cart-modal__section">
                <h3 className="cart-modal__section-title">פריטים סריאליים</h3>
                <ul className="cart-modal__list">
                  {serialItems.map((item) => (
                    <li key={item.item_id} className="cart-modal__item">
                      <div className="cart-modal__item-info">
                        <span className="cart-modal__serial">{item.serial}</span>
                        <span className="cart-modal__meta">
                          {[item.location, item.description].filter(Boolean).join(' · ')}
                        </span>
                      </div>
                      <button
                        className="cart-modal__remove"
                        onClick={() => handleRemove(item.item_id)}
                        aria-label={`הסר ${item.serial}`}
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Non-serial items */}
            {nonSerialItems.length > 0 && (
              <section className="cart-modal__section">
                <h3 className="cart-modal__section-title">פריטים ללא סריאלי</h3>
                <ul className="cart-modal__list">
                  {nonSerialItems.map((item) => (
                    <li key={item.item_id} className="cart-modal__item">
                      <div className="cart-modal__item-info">
                        <span className="cart-modal__catalog">{item.catalog_number}</span>
                        <span className="cart-modal__meta">
                          {[item.location, item.description].filter(Boolean).join(' · ')}
                        </span>
                      </div>
                      <span className="cart-modal__qty-label">כמות: {item.quantity}</span>
                      <button
                        className="cart-modal__remove"
                        onClick={() => handleRemove(item.item_id)}
                        aria-label={`הסר ${item.catalog_number}`}
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}

        {/* ── Footer / Checkout ────────────────────────────────────────── */}
        {items.length > 0 && (
          <div className="cart-modal__footer">
            <div className="cart-modal__site-row">
              <label className="cart-modal__site-label" htmlFor="cart-target-site">
                אתר יעד
              </label>
              <input
                id="cart-target-site"
                className="cart-modal__site-input"
                type="text"
                value={targetSite}
                onChange={(e) => setTargetSite(e.target.value)}
                placeholder="הזן אתר יעד..."
                dir="rtl"
              />
            </div>
            <div className="cart-modal__footer-actions">
              <button
                className="cart-modal__btn cart-modal__btn--clear"
                onClick={handleClearAll}
              >
                רוקן עגלה
              </button>
              <button
                className="cart-modal__btn cart-modal__btn--checkout"
                onClick={handleCheckout}
                disabled={isCheckingOut || !targetSite.trim()}
              >
                {isCheckingOut ? 'מעבד...' : 'משיכת ציוד'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartModal;
