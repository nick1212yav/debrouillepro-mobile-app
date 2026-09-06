import { useState, useCallback, useMemo } from "react";
import type { MenuItem } from "../types/menu.types";

export interface CartItemRecord {
  name: string;
  price: number;
  quantity: number;
}

export function useCart() {
  const [cart, setCart] = useState<Record<string, CartItemRecord>>({});

  const addToCart = useCallback((item: MenuItem) => {
    setCart((prev) => {
      const current = prev[item.name] || {
        name: item.name,
        price: item.price,
        quantity: 0,
      };
      return {
        ...prev,
        [item.name]: { ...current, quantity: current.quantity + 1 },
      };
    });
  }, []);

  const removeFromCart = useCallback((itemName: string) => {
    setCart((prev) => {
      const current = prev[itemName];
      if (!current) return prev;
      if (current.quantity === 1) {
        const next = { ...prev };
        delete next[itemName];
        return next;
      }
      return {
        ...prev,
        [itemName]: { ...current, quantity: current.quantity - 1 },
      };
    });
  }, []);

  const clearCart = useCallback(() => {
    setCart({});
  }, []);

  const cartTotal = useMemo(() => {
    return Object.values(cart).reduce(
      (sum, curr) => sum + curr.price * curr.quantity,
      0,
    );
  }, [cart]);

  const cartItemsCount = useMemo(() => {
    return Object.values(cart).reduce((sum, curr) => sum + curr.quantity, 0);
  }, [cart]);

  return {
    cart,
    addToCart,
    removeFromCart,
    clearCart,
    cartTotal,
    cartItemsCount,
  };
}
