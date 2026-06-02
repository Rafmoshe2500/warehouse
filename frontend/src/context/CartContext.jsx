import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import cartService from '../api/services/cartService';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [cart, setCart] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const cartCount = useMemo(
    () => (cart?.items?.length ?? 0),
    [cart]
  );

  // ── Fetch cart once user is authenticated ────────────────────────────────

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setIsLoading(true);
      const data = await cartService.getCart();
      setCart(data);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshCart();
    } else {
      setCart(null);
    }
  }, [isAuthenticated, refreshCart]);

  // ── Cart mutations ────────────────────────────────────────────────────────

  const addToCart = useCallback(
    async (itemId, quantity = 1, targetSiteOverride = null) => {
      const data = await cartService.addItemToCart(itemId, quantity, targetSiteOverride);
      setCart(data);
      return data;
    },
    []
  );

  const removeFromCart = useCallback(async (itemId) => {
    const data = await cartService.removeItemFromCart(itemId);
    setCart(data);
    return data;
  }, []);

  const checkoutCart = useCallback(async (targetSite) => {
    const result = await cartService.checkoutCart(targetSite);
    // Cart is cleared server-side; reflect that locally
    await refreshCart();
    return result;
  }, [refreshCart]);

  const clearCart = useCallback(async () => {
    await cartService.clearCart();
    await refreshCart();
  }, [refreshCart]);

  const value = useMemo(
    () => ({
      cart,
      cartCount,
      isLoading,
      error,
      addToCart,
      removeFromCart,
      checkoutCart,
      clearCart,
      refreshCart,
    }),
    [cart, cartCount, isLoading, error, addToCart, removeFromCart, checkoutCart, clearCart, refreshCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};

export default CartContext;
