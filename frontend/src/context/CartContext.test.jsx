import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import CartContext, { CartProvider } from './CartContext';
import { useCart } from './CartContext';

// ── Mock cartService ──────────────────────────────────────────────────────────

const mockGetCart = vi.fn();
const mockAddItemToCart = vi.fn();
const mockRemoveItemFromCart = vi.fn();
const mockCheckoutCart = vi.fn();
const mockClearCart = vi.fn();

vi.mock('../api/services/cartService', () => ({
  default: {
    getCart: (...args) => mockGetCart(...args),
    addItemToCart: (...args) => mockAddItemToCart(...args),
    removeItemFromCart: (...args) => mockRemoveItemFromCart(...args),
    checkoutCart: (...args) => mockCheckoutCart(...args),
    clearCart: (...args) => mockClearCart(...args),
  },
}));

// ── Mock AuthContext ──────────────────────────────────────────────────────────

vi.mock('./AuthContext', () => ({
  useAuth: () => ({ user: { username: 'tester' }, isAuthenticated: true }),
}));

// ── Helper ───────────────────────────────────────────────────────────────────

const EMPTY_CART = {
  id: 'cart1',
  username: 'tester',
  items: [],
  expires_at: new Date(Date.now() + 86_400_000).toISOString(),
  created_at: new Date().toISOString(),
};

const CART_WITH_ITEM = {
  ...EMPTY_CART,
  items: [
    {
      item_id: 'item1',
      catalog_number: 'CAT-1',
      serial: null,
      quantity: 3,
      location: 'LOC-A',
      target_site: 'SITE-X',
    },
  ],
};

/** Consumer component that exposes context values */
const Consumer = ({ onMount }) => {
  const ctx = useCart();
  React.useEffect(() => { onMount?.(ctx); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div>
      <span data-testid="count">{ctx.cartCount}</span>
    </div>
  );
};

const renderWithProvider = (ui) => render(<CartProvider>{ui}</CartProvider>);

// ── Tests ────────────────────────────────────────────────────────────────────

describe('CartContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCart.mockResolvedValue(EMPTY_CART);
  });

  it('fetches cart on mount when authenticated', async () => {
    renderWithProvider(<Consumer />);
    await waitFor(() => expect(mockGetCart).toHaveBeenCalledTimes(1));
  });

  it('exposes cartCount = 0 for empty cart', async () => {
    renderWithProvider(<Consumer />);
    await waitFor(() => expect(screen.getByTestId('count').textContent).toBe('0'));
  });

  it('exposes cartCount matching number of items', async () => {
    mockGetCart.mockResolvedValue(CART_WITH_ITEM);
    renderWithProvider(<Consumer />);
    await waitFor(() => expect(screen.getByTestId('count').textContent).toBe('1'));
  });

  it('addToCart calls service and updates cart', async () => {
    mockAddItemToCart.mockResolvedValue(CART_WITH_ITEM);
    let ctx;
    renderWithProvider(<Consumer onMount={(c) => { ctx = c; }} />);
    await waitFor(() => expect(mockGetCart).toHaveBeenCalled());

    await ctx.addToCart('item1', 3);
    await waitFor(() =>
      expect(mockAddItemToCart).toHaveBeenCalledWith('item1', 3, null)
    );
  });

  it('removeFromCart calls service', async () => {
    mockGetCart.mockResolvedValue(CART_WITH_ITEM);
    mockRemoveItemFromCart.mockResolvedValue(EMPTY_CART);
    let ctx;
    renderWithProvider(<Consumer onMount={(c) => { ctx = c; }} />);
    await waitFor(() => expect(mockGetCart).toHaveBeenCalled());

    await ctx.removeFromCart('item1');
    expect(mockRemoveItemFromCart).toHaveBeenCalledWith('item1');
  });

  it('throws if useCart used outside provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Consumer />)).toThrow();
    spy.mockRestore();
  });
});
