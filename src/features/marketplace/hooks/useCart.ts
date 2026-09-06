// src/features/marketplace/hooks/useCart.ts
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { adaptCartItem } from "../adapter";
import type { Id } from "@/convex/_generated/dataModel";

export function useCart() {
  // ✅ Correction : utiliser getMyCart au lieu de getCart
  const cartItems = useQuery(api.commerce.getMyCart, {});
  const addToCart = useMutation(api.commerce.addToCart);
  const updateQuantity = useMutation(api.commerce.updateCartItem);
  const clearCart = useMutation(api.commerce.clearCart);

  const items = (cartItems ?? []).map(adaptCartItem);

  const addItem = async (productId: Id<"products">, quantity: number = 1) => {
    await addToCart({ productId, quantity });
  };

  const updateItem = async (itemId: Id<"cartItems">, quantity: number) => {
    await updateQuantity({ itemId, quantity });
  };

  const removeItem = async (itemId: Id<"cartItems">) => {
    await updateQuantity({ itemId, quantity: 0 });
  };

  return {
    items,
    addItem,
    updateItem,
    removeItem,
    clearCart,
    isLoading: cartItems === undefined,
  };
}
