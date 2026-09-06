// src/features/marketplace/types/cart.types.ts
import type { Id } from "@/convex/_generated/dataModel";
import type { Product } from "./product.types";

export interface CartItem {
  _id: Id<"cartItems">;
  userId: Id<"users">;
  productId: Id<"products">;
  product?: Product;
  quantity: number;
}

export interface CartSummary {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  currency: string;
}
