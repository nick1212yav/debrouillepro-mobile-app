// src/features/marketplace/types/order.types.ts
import type { Id } from "@/convex/_generated/dataModel";
import type { Product } from "./product.types";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export interface Order {
  _id: Id<"orders">;
  buyerId: Id<"users">;
  sellerId: Id<"users">;
  productId: Id<"products">;
  product?: Product;
  quantity: number;
  totalAmount: number;
  currency: string;
  status: OrderStatus;
  deliveryAddress?: string;
  note?: string;
  paidAt?: string;
  deliveredAt?: string;
  createdAt: number;
  buyerName?: string;
  sellerName?: string;
}

export interface OrderSummary {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  completedOrders: number;
}
