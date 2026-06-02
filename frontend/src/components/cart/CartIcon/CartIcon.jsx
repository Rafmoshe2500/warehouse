import React from 'react';
import { FiShoppingCart } from 'react-icons/fi';
import './CartIcon.css';

const CartIcon = ({ count = 0, onClick }) => (
  <button
    className="cart-icon"
    onClick={onClick}
    title="עגלת קניות"
    aria-label={`עגלת קניות${count > 0 ? ` — ${count} פריטים` : ''}`}
    data-testid="cart-icon-btn"
  >
    <FiShoppingCart size={18} />
    {count > 0 && (
      <span className="cart-icon__badge" aria-hidden="true">
        {count > 99 ? '99+' : count}
      </span>
    )}
  </button>
);

export default CartIcon;
